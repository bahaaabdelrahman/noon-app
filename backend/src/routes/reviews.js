const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateBody,
  validateParams,
  validateQuery,
} = require('../middleware/validation');
const {
  updateReviewSchema,
  reviewQuerySchema,
  flagReviewSchema,
  updateReviewStatusSchema,
  adminReviewQuerySchema,
  reviewIdSchema,
} = require('../validators/reviewValidator');

const router = express.Router();

/**
 * @route   GET /api/v1/reviews/:reviewId
 * @desc    Get a single review by ID
 * @access  Public
 */
router.get(
  '/:reviewId',
  validateParams(reviewIdSchema),
  reviewController.getReview
);

/**
 * @route   PUT /api/v1/reviews/:reviewId
 * @desc    Update a review (only by the author)
 * @access  Private
 */
router.put(
  '/:reviewId',
  authenticate,
  validateParams(reviewIdSchema),
  validateBody(updateReviewSchema),
  reviewController.updateReview
);

/**
 * @route   DELETE /api/v1/reviews/:reviewId
 * @desc    Delete a review (only by the author or admin)
 * @access  Private
 */
router.delete(
  '/:reviewId',
  authenticate,
  validateParams(reviewIdSchema),
  reviewController.deleteReview
);

/**
 * @route   POST /api/v1/reviews/:reviewId/helpful
 * @desc    Mark a review as helpful
 * @access  Private
 */
router.post(
  '/:reviewId/helpful',
  authenticate,
  validateParams(reviewIdSchema),
  reviewController.markReviewHelpful
);

/**
 * @route   POST /api/v1/reviews/:reviewId/flag
 * @desc    Flag a review as inappropriate
 * @access  Private
 */
router.post(
  '/:reviewId/flag',
  authenticate,
  validateParams(reviewIdSchema),
  validateBody(flagReviewSchema),
  reviewController.flagReview
);

/**
 * @route   GET /api/v1/reviews/user/me
 * @desc    Get current user's reviews
 * @access  Private
 */
router.get(
  '/user/me',
  authenticate,
  validateQuery(reviewQuerySchema),
  reviewController.getUserReviews
);

/**
 * @route   GET /api/v1/reviews/admin/all
 * @desc    Get all reviews (admin only)
 * @access  Private - Admin
 */
router.get(
  '/admin/all',
  authenticate,
  authorize('admin'),
  validateQuery(adminReviewQuerySchema),
  reviewController.getAllReviews
);

/**
 * @route   PUT /api/v1/reviews/:reviewId/status
 * @desc    Update review status (admin only)
 * @access  Private - Admin
 */
router.put(
  '/:reviewId/status',
  authenticate,
  authorize('admin'),
  validateParams(reviewIdSchema),
  validateBody(updateReviewStatusSchema),
  reviewController.updateReviewStatus
);

module.exports = router;
