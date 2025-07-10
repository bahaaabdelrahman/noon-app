const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { addAddressValidator } = require('../validators/userValidator');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: User Management
 *   description: Operations related to user profiles and data, like addresses.
 */

// All routes below are authenticated
router.use(authenticate);

/**
 * @openapi
 * /users/addresses:
 *   post:
 *     summary: Add a new address
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               addressLine1:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *             example:
 *               firstName: "John"
 *               lastName: "Doe"
 *               addressLine1: "123 Main St"
 *               city: "Anytown"
 *               state: "CA"
 *               postalCode: "12345"
 *               country: "USA"
 *               phone: "555-123-4567"
 *               isDefault: true
 *     responses:
 *       201:
 *         description: Address added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/addresses', validate(addAddressValidator), userController.addAddress);

/**
 * @openapi
 * /users/addresses:
 *   get:
 *     summary: Get all user addresses
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the user's addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   addressLine1:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   isDefault:
 *                     type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/addresses', userController.getAddresses);

module.exports = router;
