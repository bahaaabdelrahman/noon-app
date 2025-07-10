const reviewController = require('../../../src/controllers/reviewController');
const Review = require('../../../src/models/Review');
const Product = require('../../../src/models/Product');
const { AppError, NotFoundError, ValidationError } = require('../../../src/utils/errors');
const ApiResponse = require('../../../src/utils/ApiResponse');

// Mock dependencies
jest.mock('../../../src/models/Review');
jest.mock('../../../src/models/Product');
jest.mock('../../../src/utils/ApiResponse');

describe('Review Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: 'userId123', role: 'user' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  // Test suite for createReview
  describe('createReview', () => {
    it('should create a review successfully', async () => {
      req.params.productId = 'productId123';
      req.body = { rating: 5, title: 'Great', comment: 'Awesome product' };

      Product.findById.mockResolvedValue({ _id: 'productId123' });
      Review.findOne.mockResolvedValue(null);
      const mockReview = { _id: 'review1', ...req.body, populate: jest.fn().mockResolvedValue(this) };
      Review.create.mockResolvedValue(mockReview);

      await reviewController.createReview(req, res, next);

      expect(Product.findById).toHaveBeenCalledWith('productId123');
      expect(Review.findOne).toHaveBeenCalledWith({ product: 'productId123', user: 'userId123' });
      expect(Review.create).toHaveBeenCalledWith({ ...req.body, product: 'productId123', user: 'userId123' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockReview, 'Review created successfully'));
    });

    it('should fail if product does not exist', async () => {
      req.params.productId = 'nonExistentProduct';
      Product.findById.mockResolvedValue(null);

      await reviewController.createReview(req, res, next);

      expect(next).toHaveBeenCalledWith(new NotFoundError('Product not found'));
    });

    it('should fail if user has already reviewed the product', async () => {
      req.params.productId = 'productId123';
      Product.findById.mockResolvedValue({ _id: 'productId123' });
      Review.findOne.mockResolvedValue({ _id: 'existingReview' });

      await reviewController.createReview(req, res, next);

      expect(next).toHaveBeenCalledWith(new AppError('You have already reviewed this product', 400));
    });
  });

  // Test suite for getProductReviews
  describe('getProductReviews', () => {
    it('should retrieve product reviews with pagination and stats', async () => {
      req.params.productId = 'productId123';
      const mockReviews = [{ _id: 'review1' }];
      const mockStats = { average: 5 };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReviews),
      };

      Review.find.mockReturnValue(mockQuery);
      Review.countDocuments.mockResolvedValue(1);
      Review.getProductReviewStats.mockResolvedValue(mockStats);

      await reviewController.getProductReviews(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(expect.objectContaining({ reviews: mockReviews, stats: mockStats }), 'Reviews retrieved successfully'));
    });
  });

  // Test suite for getReview
  describe('getReview', () => {
    it('should retrieve a single review', async () => {
      req.params.reviewId = 'review1';
      const mockReview = { _id: 'review1' };
      const mockPopulate = jest.fn().mockResolvedValue(mockReview);
      Review.findById.mockReturnValue({ populate: mockPopulate });

      await reviewController.getReview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockReview, 'Review retrieved successfully'));
    });

    it('should fail if review not found', async () => {
      req.params.reviewId = 'nonExistentReview';
      Review.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      await reviewController.getReview(req, res, next);

      expect(next).toHaveBeenCalledWith(new NotFoundError('Review not found'));
    });
  });

  // Test suite for updateReview
  describe('updateReview', () => {
    it('should update a review successfully', async () => {
      req.params.reviewId = 'review1';
      req.body = { rating: 4 };
      const mockReview = { _id: 'review1', user: { toString: () => 'userId123' }, save: jest.fn().mockResolvedValue(this), populate: jest.fn().mockResolvedValue(this) };

      Review.findById.mockResolvedValue(mockReview);

      await reviewController.updateReview(req, res, next);

      expect(mockReview.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockReview, 'Review updated successfully'));
    });

    it('should fail if user does not own the review', async () => {
      req.params.reviewId = 'review1';
      const mockReview = { _id: 'review1', user: { toString: () => 'anotherUser' } };
      Review.findById.mockResolvedValue(mockReview);

      await reviewController.updateReview(req, res, next);

      expect(next).toHaveBeenCalledWith(new AppError('You can only update your own reviews', 403));
    });
  });

  // Test suite for deleteReview
  describe('deleteReview', () => {
    it('should delete a review successfully by author', async () => {
      req.params.reviewId = 'review1';
      const mockReview = { _id: 'review1', user: { toString: () => 'userId123' } };
      Review.findById.mockResolvedValue(mockReview);
      Review.findByIdAndDelete.mockResolvedValue(mockReview);

      await reviewController.deleteReview(req, res, next);

      expect(Review.findByIdAndDelete).toHaveBeenCalledWith('review1');
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('should delete a review successfully by admin', async () => {
      req.user.role = 'admin';
      req.params.reviewId = 'review1';
      const mockReview = { _id: 'review1', user: { toString: () => 'anotherUser' } };
      Review.findById.mockResolvedValue(mockReview);
      Review.findByIdAndDelete.mockResolvedValue(mockReview);

      await reviewController.deleteReview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  // Test suite for markReviewHelpful
  describe('markReviewHelpful', () => {
    it('should mark a review as helpful', async () => {
      req.params.reviewId = 'review1';
      const mockReview = { _id: 'review1', user: { toString: () => 'anotherUser' }, markHelpful: jest.fn().mockResolvedValue(true), helpful: { count: 1, users: ['userId123'] } };
      Review.findById.mockResolvedValue(mockReview);

      await reviewController.markReviewHelpful(req, res, next);

      expect(mockReview.markHelpful).toHaveBeenCalledWith('userId123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success({ helpfulCount: 1, isHelpful: true }, 'Review helpfulness updated successfully'));
    });

    it('should fail if user marks their own review as helpful', async () => {
      req.params.reviewId = 'review1';
      const mockReview = { _id: 'review1', user: { toString: () => 'userId123' } };
      Review.findById.mockResolvedValue(mockReview);

      await reviewController.markReviewHelpful(req, res, next);

      expect(next).toHaveBeenCalledWith(new AppError('You cannot mark your own review as helpful', 400));
    });
  });

  // Test suite for flagReview
  describe('flagReview', () => {
    it('should flag a review successfully', async () => {
      req.params.reviewId = 'review1';
      req.body = { flagType: 'spam', reason: 'This is spam' };
      const mockReview = { _id: 'review1', user: { toString: () => 'anotherUser' }, flagReview: jest.fn().mockResolvedValue(true) };
      Review.findById.mockResolvedValue(mockReview);

      await reviewController.flagReview(req, res, next);

      expect(mockReview.flagReview).toHaveBeenCalledWith('userId123', 'spam');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(null, 'Review flagged successfully'));
    });
  });

  // Test suite for getUserReviews
  describe('getUserReviews', () => {
    it('should retrieve all reviews for the current user', async () => {
      const mockReviews = [{ _id: 'review1' }];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReviews),
      };

      Review.find.mockReturnValue(mockQuery);
      Review.countDocuments.mockResolvedValue(1);

      await reviewController.getUserReviews(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(expect.objectContaining({ reviews: mockReviews }), 'User reviews retrieved successfully'));
    });
  });

  // Test suite for getAllReviews (Admin)
  describe('getAllReviews (Admin)', () => {
    it('should retrieve all reviews for an admin', async () => {
      req.user.role = 'admin';
      const mockReviews = [{ _id: 'review1' }];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReviews),
      };

      Review.find.mockReturnValue(mockQuery);
      Review.countDocuments.mockResolvedValue(1);

      await reviewController.getAllReviews(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(expect.objectContaining({ reviews: mockReviews }), 'All reviews retrieved successfully'));
    });
  });

  // Test suite for updateReviewStatus (Admin)
  describe('updateReviewStatus (Admin)', () => {
    it('should update a review status successfully', async () => {
      req.user.role = 'admin';
      req.params.reviewId = 'review1';
      req.body = { status: 'approved' };
      const mockReview = { _id: 'review1', status: 'pending', save: jest.fn().mockResolvedValue(this) };
      Review.findById.mockResolvedValue(mockReview);

      await reviewController.updateReviewStatus(req, res, next);

      expect(mockReview.status).toBe('approved');
      expect(mockReview.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockReview, 'Review status updated successfully'));
    });
  });
});
