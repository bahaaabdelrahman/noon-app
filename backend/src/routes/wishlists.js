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

// Public routes (for shared wishlists)

/**
 * @route   GET /api/v1/wishlists/shared/:shareToken
 * @desc    Get a shared wishlist by token
 * @access  Public
 */
router.get(
  '/shared/:shareToken',
  validateParams(shareTokenSchema),
  wishlistController.getSharedWishlist
);

// Protected routes (require authentication)
router.use(authenticate);

/**
 * @route   GET /api/v1/wishlists
 * @desc    Get user's wishlists
 * @access  Private
 */
router.get(
  '/',
  validateQuery(wishlistQuerySchema),
  wishlistController.getUserWishlists
);

/**
 * @route   POST /api/v1/wishlists
 * @desc    Create a new wishlist
 * @access  Private
 */
router.post(
  '/',
  validateBody(createWishlistSchema),
  wishlistController.createWishlist
);

/**
 * @route   GET /api/v1/wishlists/:wishlistId
 * @desc    Get a specific wishlist
 * @access  Private
 */
router.get(
  '/:wishlistId',
  validateParams(wishlistIdSchema),
  wishlistController.getWishlist
);

/**
 * @route   PUT /api/v1/wishlists/:wishlistId
 * @desc    Update a wishlist
 * @access  Private
 */
router.put(
  '/:wishlistId',
  validateParams(wishlistIdSchema),
  validateBody(updateWishlistSchema),
  wishlistController.updateWishlist
);

/**
 * @route   DELETE /api/v1/wishlists/:wishlistId
 * @desc    Delete a wishlist
 * @access  Private
 */
router.delete(
  '/:wishlistId',
  validateParams(wishlistIdSchema),
  wishlistController.deleteWishlist
);

/**
 * @route   POST /api/v1/wishlists/:wishlistId/products/:productId
 * @desc    Add a product to wishlist
 * @access  Private
 */
router.post(
  '/:wishlistId/products/:productId',
  validateParams(wishlistProductParamsSchema),
  validateBody(addToWishlistSchema),
  wishlistController.addToWishlist
);

/**
 * @route   DELETE /api/v1/wishlists/:wishlistId/products/:productId
 * @desc    Remove a product from wishlist
 * @access  Private
 */
router.delete(
  '/:wishlistId/products/:productId',
  validateParams(wishlistProductParamsSchema),
  wishlistController.removeFromWishlist
);

/**
 * @route   DELETE /api/v1/wishlists/:wishlistId/clear
 * @desc    Clear all items from wishlist
 * @access  Private
 */
router.delete(
  '/:wishlistId/clear',
  validateParams(wishlistIdSchema),
  wishlistController.clearWishlist
);

/**
 * @route   POST /api/v1/wishlists/:wishlistId/move-to-cart
 * @desc    Move wishlist items to cart
 * @access  Private
 */
router.post(
  '/:wishlistId/move-to-cart',
  validateParams(wishlistIdSchema),
  validateBody(moveToCartSchema),
  wishlistController.moveToCart
);

/**
 * @route   POST /api/v1/wishlists/:wishlistId/share
 * @desc    Share a wishlist
 * @access  Private
 */
router.post(
  '/:wishlistId/share',
  validateParams(wishlistIdSchema),
  validateBody(shareWishlistSchema),
  wishlistController.shareWishlist
);

module.exports = router;
