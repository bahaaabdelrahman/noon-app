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

/**
 * @openapi
 * tags:
 *   name: Product Reviews
 *   description: Product-specific review operations
 */

/**
 * @openapi
 * /products/{productId}/reviews:
 *   post:
 *     summary: Create a review for a product
 *     tags: [Product Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - title
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *                 description: Rating from 1 to 5 stars
 *               title:
 *                 type: string
 *                 example: "Great product!"
 *                 description: Review title
 *               comment:
 *                 type: string
 *                 example: "Really satisfied with this purchase. Good quality and fast delivery."
 *                 description: Detailed review comment
 *               pros:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Great quality", "Fast delivery", "Good value"]
 *                 description: Product advantages
 *               cons:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["A bit expensive", "Could be smaller"]
 *                 description: Product disadvantages
 *               wouldRecommend:
 *                 type: boolean
 *                 example: true
 *                 description: Whether the user would recommend this product
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error or user already reviewed this product
 *       401:
 *         description: Unauthorized - login required
 *       403:
 *         description: Forbidden - user hasn't purchased this product
 *       404:
 *         description: Product not found
 */
router.post(
  '/:productId/reviews',
  authenticate,
  validateParams(productIdSchema),
  validateBody(createReviewSchema),
  reviewController.createReview
);

/**
 * @openapi
 * /products/{productId}/reviews:
 *   get:
 *     summary: Get all reviews for a product
 *     tags: [Product Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of reviews per page
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, helpfulCount]
 *           default: createdAt
 *         description: Sort reviews by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: verifiedOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Show only verified purchase reviews
 *     responses:
 *       200:
 *         description: Product reviews with statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalReviews:
 *                           type: integer
 *                           example: 156
 *                         averageRating:
 *                           type: number
 *                           format: float
 *                           example: 4.2
 *                         ratingDistribution:
 *                           type: object
 *                           properties:
 *                             "1":
 *                               type: integer
 *                               example: 5
 *                             "2":
 *                               type: integer
 *                               example: 8
 *                             "3":
 *                               type: integer
 *                               example: 15
 *                             "4":
 *                               type: integer
 *                               example: 45
 *                             "5":
 *                               type: integer
 *                               example: 83
 *                         verifiedPurchaseCount:
 *                           type: integer
 *                           example: 134
 *                         recommendationRate:
 *                           type: number
 *                           format: float
 *                           example: 0.87
 *                           description: Percentage of users who would recommend (0-1)
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalReviews:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       404:
 *         description: Product not found
 */
router.get(
  '/:productId/reviews',
  validateParams(productIdSchema),
  validateQuery(reviewQuerySchema),
  reviewController.getProductReviews
);

module.exports = router;
