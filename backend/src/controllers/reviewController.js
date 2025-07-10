const Review = require('../models/Review');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../utils/errors');

/**
 * Create a new review
 */
const createReview = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;
  const userId = req.user.id;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    product: productId,
    user: userId,
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this product', 400);
  }

  // Create review
  const review = await Review.create({
    product: productId,
    user: userId,
    rating,
    title,
    comment,
  });

  // Populate user info for response
  await review.populate('user', 'firstName lastName');

  res.status(201).json({
    success: true,
    data: review,
    message: 'Review created successfully',
  });
});

/**
 * Get reviews for a product
 */
const getProductReviews = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    rating,
    verified,
  } = req.query;

  // Build filter
  const filter = {
    product: productId,
    status: 'approved',
  };

  if (rating) {
    filter.rating = rating;
  }

  if (verified === 'true') {
    filter.verified = true;
  }

  // Build sort options
  let sortOptions = {};
  switch (sort) {
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    case 'oldest':
      sortOptions = { createdAt: 1 };
      break;
    case 'highest-rating':
      sortOptions = { rating: -1, createdAt: -1 };
      break;
    case 'lowest-rating':
      sortOptions = { rating: 1, createdAt: -1 };
      break;
    case 'most-helpful':
      sortOptions = { 'helpful.count': -1, createdAt: -1 };
      break;
    default:
      sortOptions = { createdAt: -1 };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get reviews with pagination
  const reviews = await Review.find(filter)
    .populate('user', 'firstName lastName')
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get total count for pagination
  const totalReviews = await Review.countDocuments(filter);

  // Get review statistics
  const stats = await Review.getProductReviewStats(productId);

  res.status(200).json({
    success: true,
    data: {
      reviews,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNextPage: skip + reviews.length < totalReviews,
        hasPrevPage: page > 1,
      },
    },
    message: 'Reviews retrieved successfully',
  });
});

/**
 * Get a single review
 */
const getReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId)
    .populate('user', 'firstName lastName')
    .populate('product', 'name slug');

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  res.status(200).json({
    success: true,
    data: review,
    message: 'Review retrieved successfully',
  });
});

/**
 * Update a review (only by the author)
 */
const updateReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, title, comment } = req.body;
  const userId = req.user.id;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Check if user owns this review
  if (review.user.toString() !== userId) {
    throw new AppError('You can only update your own reviews', 403);
  }

  // Update fields
  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;

  await review.save();

  await review.populate('user', 'firstName lastName');

  res.status(200).json({
    success: true,
    data: review,
    message: 'Review updated successfully',
  });
});

/**
 * Delete a review (only by the author or admin)
 */
const deleteReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Check if user owns this review or is admin
  if (review.user.toString() !== userId && userRole !== 'admin') {
    throw new AppError('You can only delete your own reviews', 403);
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: null,
    message: 'Review deleted successfully',
  });
});

/**
 * Mark review as helpful/unhelpful
 */
const markReviewHelpful = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // User cannot mark their own review as helpful
  if (review.user.toString() === userId) {
    throw new AppError('You cannot mark your own review as helpful', 400);
  }

  await review.markHelpful(userId);

  res.status(200).json({
    success: true,
    data: {
      helpfulCount: review.helpful.count,
      isHelpful: review.helpful.users.includes(userId),
    },
    message: 'Review helpfulness updated successfully',
  });
});

/**
 * Flag a review as inappropriate
 */
const flagReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const { flagType = 'inappropriate', reason } = req.body;
  const userId = req.user.id;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // User cannot flag their own review
  if (review.user.toString() === userId) {
    throw new AppError('You cannot flag your own review', 400);
  }

  await review.flagReview(userId, flagType);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Review flagged successfully',
  });
});

/**
 * Get user's reviews
 */
const getUserReviews = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

  const skip = (page - 1) * limit;

  const reviews = await Review.find({ user: userId })
    .populate('product', 'name slug images')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const totalReviews = await Review.countDocuments({ user: userId });

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNextPage: skip + reviews.length < totalReviews,
        hasPrevPage: page > 1,
      },
    },
    message: 'User reviews retrieved successfully',
  });
});

/**
 * Admin: Get all reviews with filtering
 */
const getAllReviews = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    rating,
    verified,
    flagged,
    sort = '-createdAt',
  } = req.query;

  // Build filter
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (rating) {
    filter.rating = rating;
  }

  if (verified === 'true') {
    filter.verified = true;
  }

  if (flagged === 'true') {
    filter.$or = [
      { 'flags.inappropriate.count': { $gte: 1 } },
      { 'flags.spam.count': { $gte: 1 } },
    ];
  }

  const skip = (page - 1) * limit;

  const reviews = await Review.find(filter)
    .populate('user', 'firstName lastName email')
    .populate('product', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const totalReviews = await Review.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNextPage: skip + reviews.length < totalReviews,
        hasPrevPage: page > 1,
      },
    },
    message: 'All reviews retrieved successfully',
  });
});

/**
 * Admin: Update review status
 */
const updateReviewStatus = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const { status, moderationReason } = req.body;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  review.status = status;
  if (moderationReason) {
    review.moderationReason = moderationReason;
  }

  await review.save();

  res.status(200).json({
    success: true,
    data: review,
    message: 'Review status updated successfully',
  });
});

module.exports = {
  createReview,
  getProductReviews,
  getReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  flagReview,
  getUserReviews,
  getAllReviews,
  updateReviewStatus,
};
