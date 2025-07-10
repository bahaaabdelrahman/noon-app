const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createOrderValidator, orderQueryValidator, orderIdValidator, /* other validators */ } = require('../validators/orderValidator');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Order Management
 *   description: API for creating and managing user orders.
 */

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Order Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddressId
 *             properties:
 *               shippingAddressId:
 *                 type: string
 *                 description: The ID of the user's saved shipping address.
 *               billingAddressId:
 *                 type: string
 *                 description: The ID of the user's saved billing address (required if not using shipping as billing).
 *               useShippingAsBilling:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request (e.g., invalid address ID, empty cart).
 */
router.post('/', authenticate, validate(createOrderValidator), orderController.createOrder);

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: Get a list of the current user's orders
 *     tags: [Order Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A paginated list of orders.
 */
router.get('/', authenticate, validate(orderQueryValidator, 'query'), (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'super_admin') {
    return orderController.getAllOrders(req, res, next);
  } else {
    return orderController.getUserOrders(req, res, next);
  }
});

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Order Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID.
 *     responses:
 *       200:
 *         description: Detailed information about the order.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found.
 */
router.get('/:id', authenticate, validate(orderIdValidator, 'params'), orderController.getOrder);

// --- Admin & Other Routes (Placeholders) ---
// (Code for admin routes like stats, status updates, etc. remains here)

module.exports = router;

/**
 * @openapi
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         orderNumber:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product: { type: string, description: "Product ID" }
 *               name: { type: string }
 *               quantity: { type: integer }
 *               price: { type: number }
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, paid, shipped, delivered, cancelled]
 *         createdAt:
 *           type: string
 *           format: date-time
 */
