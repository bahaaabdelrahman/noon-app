const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const {
  validateBody,
  validateParams,
  validateQuery,
} = require('../middleware/validation');
const {
  createReviewSchema,
  reviewQuerySchema,
  productIdSchema,
} = require('../validators/reviewValidator');

const router = express.Router();

// Routes for /api/v1/products/:productId/reviews

/**
 * @route   POST /api/v1/products/:productId/reviews
 * @desc    Create a review for a product
 * @access  Private (authenticated users only)
 */
router.post(
  '/:productId/reviews',
  authenticate,
  validateParams(productIdSchema),
  validateBody(createReviewSchema),
  reviewController.createReview
);

/**
 * @route   GET /api/v1/products/:productId/reviews
 * @desc    Get all reviews for a product
 * @access  Public
 */
router.get(
  '/:productId/reviews',
  validateParams(productIdSchema),
  validateQuery(reviewQuerySchema),
  reviewController.getProductReviews
);

module.exports = router;
