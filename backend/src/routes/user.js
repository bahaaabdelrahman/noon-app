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

/**
 * @openapi
 * /users/addresses/{addressId}:
 *   get:
 *     summary: Get a specific address
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 */
router.get('/addresses/:addressId', userController.getAddress);

/**
 * @openapi
 * /users/addresses/{addressId}:
 *   put:
 *     summary: Update an address
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               addressLine1:
 *                 type: string
 *                 example: "123 Main St"
 *               addressLine2:
 *                 type: string
 *                 example: "Apt 4B"
 *               city:
 *                 type: string
 *                 example: "Anytown"
 *               state:
 *                 type: string
 *                 example: "CA"
 *               postalCode:
 *                 type: string
 *                 example: "12345"
 *               country:
 *                 type: string
 *                 example: "USA"
 *               phone:
 *                 type: string
 *                 example: "555-123-4567"
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 */
router.put('/addresses/:addressId', userController.updateAddress);

/**
 * @openapi
 * /users/addresses/{addressId}:
 *   delete:
 *     summary: Delete an address
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Address deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 */
router.delete('/addresses/:addressId', userController.deleteAddress);

/**
 * @openapi
 * /users/addresses/{addressId}/default:
 *   patch:
 *     summary: Set address as default
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Default address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 */
router.patch('/addresses/:addressId/default', userController.setDefaultAddress);

/**
 * @openapi
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', userController.getProfile);

/**
 * @openapi
 * /users/profile:
 *   put:
 *     summary: Update user profile
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
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               phone:
 *                 type: string
 *                 example: "555-123-4567"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-15"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *                 example: "male"
 *               preferences:
 *                 type: object
 *                 properties:
 *                   notifications:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: boolean
 *                       sms:
 *                         type: boolean
 *                       push:
 *                         type: boolean
 *                   language:
 *                     type: string
 *                     example: "en"
 *                   currency:
 *                     type: string
 *                     example: "USD"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', userController.updateProfile);

module.exports = router;

/**
 * @openapi
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d5ecb54b24c3001f8b4567
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         addressLine1:
 *           type: string
 *           example: "123 Main St"
 *         addressLine2:
 *           type: string
 *           example: "Apt 4B"
 *         city:
 *           type: string
 *           example: "Anytown"
 *         state:
 *           type: string
 *           example: "CA"
 *         postalCode:
 *           type: string
 *           example: "12345"
 *         country:
 *           type: string
 *           example: "USA"
 *         phone:
 *           type: string
 *           example: "555-123-4567"
 *         isDefault:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d5ecb54b24c3001f8b4567
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
 *           example: "555-123-4567"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "1990-01-15"
 *         gender:
 *           type: string
 *           enum: [male, female, other, prefer_not_to_say]
 *           example: "male"
 *         isEmailVerified:
 *           type: boolean
 *           example: true
 *         avatar:
 *           type: string
 *           example: "/uploads/avatars/user123.jpg"
 *         preferences:
 *           type: object
 *           properties:
 *             notifications:
 *               type: object
 *               properties:
 *                 email:
 *                   type: boolean
 *                 sms:
 *                   type: boolean
 *                 push:
 *                   type: boolean
 *             language:
 *               type: string
 *               example: "en"
 *             currency:
 *               type: string
 *               example: "USD"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
