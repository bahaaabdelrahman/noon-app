const express = require('express');
const cartController = require('../controllers/cartController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { addToCartValidator, updateCartItemValidator, applyCouponValidator } = require('../validators/cartValidator');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Shopping Cart
 *   description: API for managing the user's shopping cart.
 */

/**
 * @openapi
 * /cart:
 *   get:
 *     summary: Get the current user's cart
 *     tags: [Shopping Cart]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves the cart for the authenticated user, or a guest cart if no token is provided.
 *     responses:
 *       200:
 *         description: The user's cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
router.get('/', optionalAuth, cartController.getCart);

/**
 * @openapi
 * /cart/items:
 *   post:
 *     summary: Add an item to the cart
 *     tags: [Shopping Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "6856900de8d08870077cccce"
 *               quantity:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Item added, returns the updated cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
router.post('/items', optionalAuth, validate(addToCartValidator), cartController.addToCart);

/**
 * @openapi
 * /cart/items/{itemId}:
 *   put:
 *     summary: Update an item's quantity in the cart
 *     tags: [Shopping Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Item updated, returns the updated cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
router.put('/items/:itemId', optionalAuth, validate(updateCartItemValidator), cartController.updateCartItem);

/**
 * @openapi
 * /cart/items/{itemId}:
 *   delete:
 *     summary: Remove an item from the cart
 *     tags: [Shopping Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed, returns the updated cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
router.delete('/items/:itemId', optionalAuth, cartController.removeFromCart);

/**
 * @openapi
 * /cart/clear:
 *   delete:
 *     summary: Clear all items from cart
 *     tags: [Shopping Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 */
router.delete('/clear', optionalAuth, cartController.clearCart);

/**
 * @openapi
 * /cart/coupon:
 *   post:
 *     summary: Apply a coupon to cart
 *     tags: [Shopping Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponCode
 *             properties:
 *               couponCode:
 *                 type: string
 *                 example: "SAVE20"
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Cart'
 *                     - type: object
 *                       properties:
 *                         appliedCoupon:
 *                           type: object
 *                           properties:
 *                             code:
 *                               type: string
 *                             discount:
 *                               type: number
 *                             discountType:
 *                               type: string
 *                               enum: [percentage, fixed]
 *       400:
 *         description: Invalid coupon code or coupon not applicable
 *       404:
 *         description: Coupon not found
 */
router.post('/coupon', optionalAuth, validate(applyCouponValidator), cartController.applyCoupon);

/**
 * @openapi
 * /cart/coupon:
 *   delete:
 *     summary: Remove coupon from cart
 *     tags: [Shopping Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 */
router.delete('/coupon', optionalAuth, cartController.removeCoupon);

/**
 * @openapi
 * /cart/summary:
 *   get:
 *     summary: Get cart summary
 *     tags: [Shopping Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart summary with totals
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
 *                     itemCount:
 *                       type: integer
 *                       example: 3
 *                     subtotal:
 *                       type: number
 *                       example: 299.99
 *                     tax:
 *                       type: number
 *                       example: 24.00
 *                     shipping:
 *                       type: number
 *                       example: 9.99
 *                     discount:
 *                       type: number
 *                       example: 30.00
 *                     total:
 *                       type: number
 *                       example: 303.98
 *                     appliedCoupon:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         code:
 *                           type: string
 *                         discount:
 *                           type: number
 */
router.get('/summary', optionalAuth, cartController.getCartSummary);

/**
 * @openapi
 * /cart/validate:
 *   post:
 *     summary: Validate cart items
 *     tags: [Shopping Cart]
 *     security:
 *       - bearerAuth: []
 *     description: Validates cart items for availability, pricing, and other constraints
 *     responses:
 *       200:
 *         description: Cart validation results
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
 *                     isValid:
 *                       type: boolean
 *                       example: true
 *                     issues:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                           issue:
 *                             type: string
 *                             enum: [out_of_stock, price_changed, product_unavailable]
 *                           message:
 *                             type: string
 *                           oldPrice:
 *                             type: number
 *                           newPrice:
 *                             type: number
 *                     updatedCart:
 *                       $ref: '#/components/schemas/Cart'
 */
router.post('/validate', optionalAuth, cartController.validateCart);

/**
 * @openapi
 * /cart/merge:
 *   post:
 *     summary: Merge guest cart with user cart
 *     tags: [Shopping Cart]
 *     security:
 *       - bearerAuth: []
 *     description: Merges a guest cart with the authenticated user's cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guestCartId
 *             properties:
 *               guestCartId:
 *                 type: string
 *                 example: "60d5ecb54b24c3001f8b4567"
 *               mergeStrategy:
 *                 type: string
 *                 enum: [replace, merge, keep_existing]
 *                 default: merge
 *                 description: How to handle duplicate items
 *     responses:
 *       200:
 *         description: Carts merged successfully
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
 *                     mergedCart:
 *                       $ref: '#/components/schemas/Cart'
 *                     mergeResults:
 *                       type: object
 *                       properties:
 *                         itemsMerged:
 *                           type: integer
 *                         itemsReplaced:
 *                           type: integer
 *                         itemsKept:
 *                           type: integer
 *       400:
 *         description: Invalid guest cart ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Guest cart not found
 */
router.post('/merge', authenticate, cartController.mergeCart);

module.exports = router;

/**
 * @openapi
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 $ref: '#/components/schemas/Product'
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *         subtotal:
 *           type: number
 *         total:
 *           type: number
 */
