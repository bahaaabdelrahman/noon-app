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

// --- Other Cart Routes (placeholders) ---
router.delete('/clear', optionalAuth, cartController.clearCart);
router.post('/coupon', optionalAuth, validate(applyCouponValidator), cartController.applyCoupon);
router.delete('/coupon', optionalAuth, cartController.removeCoupon);
router.get('/summary', optionalAuth, cartController.getCartSummary);
router.post('/validate', optionalAuth, cartController.validateCart);
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
