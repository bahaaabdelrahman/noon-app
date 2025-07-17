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
 *     OrderItemVariant:
 *       type: object
 *       required:
 *         - name
 *         - value
 *       properties:
 *         name:
 *           type: string
 *           example: "Size"
 *         value:
 *           type: string
 *           example: "Large"
 *
 *     OrderItemTrackingInfo:
 *       type: object
 *       properties:
 *         carrier:
 *           type: string
 *           example: "FedEx"
 *         trackingNumber:
 *           type: string
 *           example: "1234567890123456"
 *         trackingUrl:
 *           type: string
 *           example: "https://fedex.com/track/1234567890123456"
 *         estimatedDelivery:
 *           type: string
 *           format: date-time
 *           example: "2024-01-20T18:00:00Z"
 *
 *     OrderItemProductSnapshot:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *         - sku
 *       properties:
 *         name:
 *           type: string
 *           example: "Wireless Headphones"
 *         slug:
 *           type: string
 *           example: "wireless-headphones"
 *         sku:
 *           type: string
 *           example: "WH-001-BLK"
 *         image:
 *           type: string
 *           example: "https://example.com/images/headphones.jpg"
 *         brand:
 *           type: string
 *           example: "AudioTech"
 *         category:
 *           type: string
 *           example: "Electronics"
 *
 *     OrderItem:
 *       type: object
 *       required:
 *         - product
 *         - productSnapshot
 *         - quantity
 *         - unitPrice
 *         - totalPrice
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         product:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *           description: "Product ID reference"
 *         productSnapshot:
 *           $ref: '#/components/schemas/OrderItemProductSnapshot'
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         unitPrice:
 *           type: number
 *           minimum: 0
 *           example: 199.99
 *         totalPrice:
 *           type: number
 *           minimum: 0
 *           example: 399.98
 *         selectedVariants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItemVariant'
 *         status:
 *           type: string
 *           enum: [pending, in_progress, shipped, delivered, cancelled, returned]
 *           example: "pending"
 *         trackingInfo:
 *           $ref: '#/components/schemas/OrderItemTrackingInfo'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-16T14:22:00Z"
 *
 *     OrderAddress:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - addressLine1
 *         - city
 *         - state
 *         - postalCode
 *         - country
 *       properties:
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         company:
 *           type: string
 *           example: "Tech Company Inc."
 *         addressLine1:
 *           type: string
 *           example: "123 Main Street"
 *         addressLine2:
 *           type: string
 *           example: "Apt 4B"
 *         city:
 *           type: string
 *           example: "New York"
 *         state:
 *           type: string
 *           example: "NY"
 *         postalCode:
 *           type: string
 *           example: "10001"
 *         country:
 *           type: string
 *           example: "United States"
 *         phone:
 *           type: string
 *           example: "+1-555-123-4567"
 *         isDefault:
 *           type: boolean
 *           example: false
 *
 *     OrderPaymentInfo:
 *       type: object
 *       required:
 *         - method
 *         - status
 *       properties:
 *         method:
 *           type: string
 *           enum: [credit_card, debit_card, paypal, stripe, bank_transfer, cash_on_delivery]
 *           example: "credit_card"
 *         status:
 *           type: string
 *           enum: [pending, paid, failed, cancelled, refunded, partially_refunded]
 *           example: "paid"
 *         transactionId:
 *           type: string
 *           example: "txn_1234567890"
 *         paymentGateway:
 *           type: string
 *           example: "stripe"
 *         paidAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T11:00:00Z"
 *         failedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T11:05:00Z"
 *         refundedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-20T15:30:00Z"
 *         refundAmount:
 *           type: number
 *           minimum: 0
 *           example: 50.00
 *         currency:
 *           type: string
 *           pattern: '^[A-Z]{3}$'
 *           example: "USD"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T11:00:00Z"
 *
 *     OrderTotals:
 *       type: object
 *       required:
 *         - subtotal
 *         - total
 *       properties:
 *         subtotal:
 *           type: number
 *           minimum: 0
 *           example: 399.98
 *           description: "Sum of all item prices before tax, shipping, and discounts"
 *         tax:
 *           type: number
 *           minimum: 0
 *           example: 40.00
 *           description: "Tax amount calculated on subtotal"
 *         shipping:
 *           type: number
 *           minimum: 0
 *           example: 10.00
 *           description: "Shipping cost"
 *         discount:
 *           type: number
 *           minimum: 0
 *           example: 50.00
 *           description: "Total discount amount from coupons/promotions"
 *         total:
 *           type: number
 *           minimum: 0
 *           example: 399.98
 *           description: "Final total amount (subtotal + tax + shipping - discount)"
 *
 *     OrderCoupon:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           example: "SAVE20"
 *         discount:
 *           type: number
 *           minimum: 0
 *           example: 20.00
 *         type:
 *           type: string
 *           enum: [percentage, fixed]
 *           example: "fixed"
 *
 *     OrderUserSnapshot:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           example: "+1-555-123-4567"
 *
 *     OrderMetadata:
 *       type: object
 *       properties:
 *         source:
 *           type: string
 *           example: "web"
 *           description: "Order source (web, mobile, api)"
 *         ipAddress:
 *           type: string
 *           example: "192.168.1.1"
 *         userAgent:
 *           type: string
 *           example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *         affiliateCode:
 *           type: string
 *           example: "AFF123"
 *
 *     Order:
 *       type: object
 *       required:
 *         - orderNumber
 *         - user
 *         - items
 *         - totals
 *         - status
 *         - shippingAddress
 *         - paymentInfo
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         orderNumber:
 *           type: string
 *           example: "ORD-1705330200000-ABC12"
 *           description: "Unique order identifier"
 *         user:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *           description: "User ID who placed the order"
 *         userSnapshot:
 *           $ref: '#/components/schemas/OrderUserSnapshot'
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *           description: "List of products ordered"
 *         totals:
 *           $ref: '#/components/schemas/OrderTotals'
 *         currency:
 *           type: string
 *           pattern: '^[A-Z]{3}$'
 *           example: "USD"
 *         status:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled, returned, refunded]
 *           example: "processing"
 *           description: "Current order status"
 *         shippingAddress:
 *           $ref: '#/components/schemas/OrderAddress'
 *         billingAddress:
 *           $ref: '#/components/schemas/OrderAddress'
 *         paymentInfo:
 *           $ref: '#/components/schemas/OrderPaymentInfo'
 *         appliedCoupons:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderCoupon'
 *         notes:
 *           type: string
 *           example: "Please leave at front door"
 *           description: "Customer notes for the order"
 *         specialInstructions:
 *           type: string
 *           example: "Fragile - handle with care"
 *           description: "Special handling instructions"
 *         estimatedDelivery:
 *           type: string
 *           format: date-time
 *           example: "2024-01-20T18:00:00Z"
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-18T16:30:00Z"
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-16T09:15:00Z"
 *         cancelReason:
 *           type: string
 *           example: "Customer requested cancellation"
 *         refundRequested:
 *           type: boolean
 *           example: false
 *         refundReason:
 *           type: string
 *           example: "Product defective"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["priority", "gift", "expedited"]
 *         metadata:
 *           $ref: '#/components/schemas/OrderMetadata'
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
 *           example: 3
 *           description: "Total quantity of all items in the order"
 *         statusDisplay:
 *           type: string
 *           readOnly: true
 *           example: "Processing"
 *           description: "Human-readable status display"
 *         customerName:
 *           type: string
 *           readOnly: true
 *           example: "John Doe"
 *           description: "Full customer name from user snapshot"
 *         shippingAddressFull:
 *           type: string
 *           readOnly: true
 *           example: "123 Main Street, Apt 4B, New York, NY 10001, United States"
 *           description: "Complete formatted shipping address"
 *         daysSinceOrder:
 *           type: integer
 *           readOnly: true
 *           example: 5
 *           description: "Number of days since the order was placed"
 */
