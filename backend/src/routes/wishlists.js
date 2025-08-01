const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');
const {
  validateBody,
  validateParams,
  validateQuery,
} = require('../middleware/validation');
const {
  createWishlistSchema,
  updateWishlistSchema,
  addToWishlistSchema,
  moveToCartSchema,
  shareWishlistSchema,
  wishlistQuerySchema,
  wishlistIdSchema,
  productIdSchema,
  shareTokenSchema,
  wishlistProductParamsSchema,
} = require('../validators/wishlistValidator');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Wishlists
 *   description: User wishlist management operations
 */

/**
 * @openapi
 * /wishlists/shared/{shareToken}:
 *   get:
 *     summary: Get a shared wishlist by token
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: shareToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Share token for the wishlist
 *     responses:
 *       200:
 *         description: Shared wishlist details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SharedWishlist'
 *       404:
 *         description: Wishlist not found or token expired
 *       403:
 *         description: Wishlist is private or sharing disabled
 */
router.get(
  '/shared/:shareToken',
  validateParams(shareTokenSchema),
  wishlistController.getSharedWishlist
);

// Protected routes (require authentication)
router.use(authenticate);

/**
 * @openapi
 * /wishlists:
 *   get:
 *     summary: Get user's wishlists
 *     tags: [Wishlists]
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
 *         description: Number of wishlists per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name]
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
 *         description: User's wishlists
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
 *                     wishlists:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Wishlist'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalWishlists:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  validateQuery(wishlistQuerySchema),
  wishlistController.getUserWishlists
);

/**
 * @openapi
 * /wishlists:
 *   post:
 *     summary: Create a new wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWishlistRequest'
 *     responses:
 *       201:
 *         description: Wishlist created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  validateBody(createWishlistSchema),
  wishlistController.createWishlist
);

/**
 * @openapi
 * /wishlists/{wishlistId}:
 *   get:
 *     summary: Get a specific wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist ID
 *     responses:
 *       200:
 *         description: Wishlist details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WishlistWithProducts'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your wishlist
 *       404:
 *         description: Wishlist not found
 */
router.get(
  '/:wishlistId',
  validateParams(wishlistIdSchema),
  wishlistController.getWishlist
);

/**
 * @openapi
 * /wishlists/{wishlistId}:
 *   put:
 *     summary: Update a wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWishlistRequest'
 *     responses:
 *       200:
 *         description: Wishlist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your wishlist
 *       404:
 *         description: Wishlist not found
 */
router.put(
  '/:wishlistId',
  validateParams(wishlistIdSchema),
  validateBody(updateWishlistSchema),
  wishlistController.updateWishlist
);

/**
 * @openapi
 * /wishlists/{wishlistId}:
 *   delete:
 *     summary: Delete a wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist ID
 *     responses:
 *       200:
 *         description: Wishlist deleted successfully
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
 *         description: Forbidden - Not your wishlist
 *       404:
 *         description: Wishlist not found
 */
router.delete(
  '/:wishlistId',
  validateParams(wishlistIdSchema),
  wishlistController.deleteWishlist
);

/**
 * @openapi
 * /wishlists/{wishlistId}/products/{productId}:
 *   post:
 *     summary: Add a product to wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToWishlistRequest'
 *     responses:
 *       200:
 *         description: Product added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WishlistWithProducts'
 *       400:
 *         description: Product already in wishlist or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your wishlist
 *       404:
 *         description: Wishlist or product not found
 */
router.post(
  '/:wishlistId/products/:productId',
  validateParams(wishlistProductParamsSchema),
  validateBody(addToWishlistSchema),
  wishlistController.addToWishlist
);

/**
 * @openapi
 * /wishlists/{wishlistId}/products/{productId}:
 *   delete:
 *     summary: Remove a product from wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WishlistWithProducts'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your wishlist
 *       404:
 *         description: Wishlist or product not found in wishlist
 */
router.delete(
  '/:wishlistId/products/:productId',
  validateParams(wishlistProductParamsSchema),
  wishlistController.removeFromWishlist
);

/**
 * @openapi
 * /wishlists/{wishlistId}/clear:
 *   delete:
 *     summary: Clear all items from wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist ID
 *     responses:
 *       200:
 *         description: Wishlist cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Wishlist'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your wishlist
 *       404:
 *         description: Wishlist not found
 */
router.delete(
  '/:wishlistId/clear',
  validateParams(wishlistIdSchema),
  wishlistController.clearWishlist
);

/**
 * @openapi
 * /wishlists/{wishlistId}/move-to-cart:
 *   post:
 *     summary: Move wishlist items to cart
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MoveToCartRequest'
 *     responses:
 *       200:
 *         description: Items moved to cart successfully
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
 *                     movedItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                           quantity:
 *                             type: integer
 *                           success:
 *                             type: boolean
 *                           error:
 *                             type: string
 *                     cart:
 *                       $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your wishlist
 *       404:
 *         description: Wishlist not found
 */
router.post(
  '/:wishlistId/move-to-cart',
  validateParams(wishlistIdSchema),
  validateBody(moveToCartSchema),
  wishlistController.moveToCart
);

/**
 * @openapi
 * /wishlists/{wishlistId}/share:
 *   post:
 *     summary: Share a wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wishlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShareWishlistRequest'
 *     responses:
 *       200:
 *         description: Wishlist shared successfully
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
 *                     shareToken:
 *                       type: string
 *                       example: "abc123def456"
 *                     shareUrl:
 *                       type: string
 *                       example: "https://example.com/wishlists/shared/abc123def456"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your wishlist
 *       404:
 *         description: Wishlist not found
 */
router.post(
  '/:wishlistId/share',
  validateParams(wishlistIdSchema),
  validateBody(shareWishlistSchema),
  wishlistController.shareWishlist
);

module.exports = router;

/**
 * @openapi
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       required:
 *         - product
 *       properties:
 *         product:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         addedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         notes:
 *           type: string
 *           maxLength: 200
 *           example: "Want to buy this for my birthday"
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           example: "high"
 *
 *     WishlistSharedWith:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "friend@example.com"
 *         sharedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         permissions:
 *           type: string
 *           enum: [view, edit]
 *           example: "view"
 *
 *     Wishlist:
 *       type: object
 *       required:
 *         - user
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           example: "60d5ecb54b24c3001f8b4567"
 *         user:
 *           type: string
 *           example: "60d5ecb54b24c3001f8b4566"
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "My Favorites"
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: "Products I want to buy later"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItem'
 *         privacy:
 *           type: string
 *           enum: [private, public, shared]
 *           example: "private"
 *         sharedWith:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistSharedWith'
 *         shareToken:
 *           type: string
 *           example: "abc123def456789"
 *         isDefault:
 *           type: boolean
 *           example: false
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["electronics", "gadgets"]
 *         totalItems:
 *           type: integer
 *           minimum: 0
 *           example: 5
 *         totalValue:
 *           type: number
 *           minimum: 0
 *           example: 299.99
 *         lastModified:
 *           type: string
 *           format: date-time
 *           example: "2024-01-16T14:22:00Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-16T14:22:00Z"
 *         itemCount:
 *           type: integer
 *           readOnly: true
 *           example: 5
 *           description: "Total number of items in the wishlist"
 *         shareUrl:
 *           type: string
 *           readOnly: true
 *           example: "https://example.com/wishlists/shared/abc123def456789"
 *           description: "Public URL for sharing the wishlist (only if shareToken exists)"
 *
 *     WishlistItemWithProduct:
 *       type: object
 *       properties:
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         addedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         notes:
 *           type: string
 *           maxLength: 200
 *           example: "Want to buy this for my birthday"
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           example: "high"
 *
 *     WishlistWithProducts:
 *       allOf:
 *         - $ref: '#/components/schemas/Wishlist'
 *         - type: object
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WishlistItemWithProduct'
 *
 *     SharedWishlistOwner:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         avatar:
 *           type: string
 *           example: "https://example.com/avatars/user1.jpg"
 *
 *     SharedWishlist:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60d5ecb54b24c3001f8b4567"
 *         name:
 *           type: string
 *           example: "My Favorites"
 *         description:
 *           type: string
 *           example: "Products I want to buy later"
 *         user:
 *           $ref: '#/components/schemas/SharedWishlistOwner'
 *         privacy:
 *           type: string
 *           enum: [public, shared]
 *           example: "public"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["electronics", "gadgets"]
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItemWithProduct'
 *         totalItems:
 *           type: integer
 *           example: 5
 *         totalValue:
 *           type: number
 *           example: 299.99
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-16T14:22:00Z"
 *
 *     CreateWishlistRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "My Favorites"
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: "Products I want to buy later"
 *         privacy:
 *           type: string
 *           enum: [private, public, shared]
 *           example: "private"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["electronics", "gadgets"]
 *
 *     UpdateWishlistRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "Updated Wishlist Name"
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: "Updated description"
 *         privacy:
 *           type: string
 *           enum: [private, public, shared]
 *           example: "public"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["electronics", "gadgets", "tech"]
 *
 *     AddToWishlistRequest:
 *       type: object
 *       properties:
 *         notes:
 *           type: string
 *           maxLength: 200
 *           example: "Want to buy this for my birthday"
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           example: "high"
 *
 *     MoveToCartRequest:
 *       type: object
 *       properties:
 *         productIds:
 *           type: array
 *           items:
 *             type: string
 *           description: "Specific product IDs to move (if not provided, moves all)"
 *           example: ["60d5ecb54b24c3001f8b4567", "60d5ecb54b24c3001f8b4568"]
 *         quantities:
 *           type: object
 *           description: "Custom quantities for products (productId as key)"
 *           example: {"60d5ecb54b24c3001f8b4567": 2, "60d5ecb54b24c3001f8b4568": 1}
 *         removeFromWishlist:
 *           type: boolean
 *           example: false
 *           description: "Whether to remove items from wishlist after moving"
 *
 *     ShareWishlistRequest:
 *       type: object
 *       properties:
 *         expiresIn:
 *           type: string
 *           enum: [1d, 7d, 30d, never]
 *           example: "30d"
 *           description: "Share link expiration"
 *         allowPurchase:
 *           type: boolean
 *           example: false
 *           description: "Allow others to purchase items from this wishlist"
 */
