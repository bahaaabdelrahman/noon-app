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
 * @openapi
 * tags:
 *   name: Reviews
 *   description: Product review management operations
 */

/**
 * @openapi
 * /reviews/{reviewId}:
 *   get:
 *     summary: Get a single review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       404:
 *         description: Review not found
 */
router.get(
  '/:reviewId',
  validateParams(reviewIdSchema),
  reviewController.getReview
);

/**
 * @openapi
 * /reviews/{reviewId}:
 *   put:
 *     summary: Update a review (only by the author)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               title:
 *                 type: string
 *                 example: "Great product!"
 *               comment:
 *                 type: string
 *                 example: "Really satisfied with this purchase. Good quality and fast delivery."
 *               pros:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Great quality", "Fast delivery"]
 *               cons:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["A bit expensive"]
 *     responses:
 *       200:
 *         description: Review updated successfully
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
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only review author can update
 *       404:
 *         description: Review not found
 */
router.put(
  '/:reviewId',
  authenticate,
  validateParams(reviewIdSchema),
  validateBody(updateReviewSchema),
  reviewController.updateReview
);

/**
 * @openapi
 * /reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review (only by the author or admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only review author or admin can delete
 *       404:
 *         description: Review not found
 */
router.delete(
  '/:reviewId',
  authenticate,
  validateParams(reviewIdSchema),
  reviewController.deleteReview
);

/**
 * @openapi
 * /reviews/{reviewId}/helpful:
 *   post:
 *     summary: Mark a review as helpful
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review marked as helpful
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
 *                     helpfulCount:
 *                       type: integer
 *                     userMarkedHelpful:
 *                       type: boolean
 *       400:
 *         description: User already marked this review as helpful
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.post(
  '/:reviewId/helpful',
  authenticate,
  validateParams(reviewIdSchema),
  reviewController.markReviewHelpful
);

/**
 * @openapi
 * /reviews/{reviewId}/flag:
 *   post:
 *     summary: Flag a review as inappropriate
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [spam, inappropriate, fake, offensive, other]
 *                 example: "inappropriate"
 *               description:
 *                 type: string
 *                 example: "Contains inappropriate language"
 *     responses:
 *       200:
 *         description: Review flagged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or already flagged
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.post(
  '/:reviewId/flag',
  authenticate,
  validateParams(reviewIdSchema),
  validateBody(flagReviewSchema),
  reviewController.flagReview
);

/**
 * @openapi
 * /reviews/user/me:
 *   get:
 *     summary: Get current user's reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating]
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: User's reviews
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
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/user/me',
  authenticate,
  validateQuery(reviewQuerySchema),
  reviewController.getUserReviews
);

/**
 * @openapi
 * /reviews/admin/all:
 *   get:
 *     summary: Get all reviews (admin only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Number of reviews per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, flagged]
 *         description: Filter by review status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, helpfulCount]
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: All reviews with admin details
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
 *                         $ref: '#/components/schemas/AdminReview'
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/admin/all',
  authenticate,
  authorize('admin'),
  validateQuery(adminReviewQuerySchema),
  reviewController.getAllReviews
);

/**
 * @openapi
 * /reviews/{reviewId}/status:
 *   put:
 *     summary: Update review status (admin only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, flagged]
 *                 example: "approved"
 *               adminNote:
 *                 type: string
 *                 example: "Review approved after moderation"
 *     responses:
 *       200:
 *         description: Review status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AdminReview'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Review not found
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

/**
 * @openapi
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d5ecb54b24c3001f8b4567
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             avatar:
 *               type: string
 *         product:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             slug:
 *               type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         title:
 *           type: string
 *           example: "Great product!"
 *         comment:
 *           type: string
 *           example: "Really satisfied with this purchase."
 *         pros:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Great quality", "Fast delivery"]
 *         cons:
 *           type: array
 *           items:
 *             type: string
 *           example: ["A bit expensive"]
 *         helpfulCount:
 *           type: integer
 *           example: 12
 *         verifiedPurchase:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AdminReview:
 *       allOf:
 *         - $ref: '#/components/schemas/Review'
 *         - type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [pending, approved, rejected, flagged]
 *               example: "approved"
 *             flags:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: string
 *                   reason:
 *                     type: string
 *                   description:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *             adminNote:
 *               type: string
 *               example: "Review approved after moderation"
 *             moderatedBy:
 *               type: string
 *               example: 60d5ecb54b24c3001f8b4568
 *             moderatedAt:
 *               type: string
 *               format: date-time
 */
