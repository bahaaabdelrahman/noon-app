const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const {
  authLimiter,
  passwordResetLimiter,
} = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
} = require('../validators/authValidator');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized, token is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized, token is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expiresIn:
 *                       type: string
 *                       example: "24h"
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid email format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests, try again later
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid token or passwords don't match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests, try again later
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change password for authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid current password or passwords don't match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized, token is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

/**
 * @openapi
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Email already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized, token is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/resend-verification',
  authenticate,
  authController.resendEmailVerification
);

module.exports = router;

/**
 * @openapi
 * components:
 *   schemas:
 *     UserAddress:
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
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           example: "John"
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           example: "Doe"
 *         company:
 *           type: string
 *           example: "Tech Corp"
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
 *           pattern: "^\\+?[\\d\\s-()]+$"
 *           example: "+1-555-123-4567"
 *         isDefault:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-16T14:22:00Z"
 *
 *     UserPreferences:
 *       type: object
 *       properties:
 *         newsletter:
 *           type: boolean
 *           example: true
 *           description: "Subscribe to newsletter emails"
 *         notifications:
 *           type: object
 *           properties:
 *             email:
 *               type: boolean
 *               example: true
 *               description: "Receive email notifications"
 *             sms:
 *               type: boolean
 *               example: false
 *               description: "Receive SMS notifications"
 *         currency:
 *           type: string
 *           example: "USD"
 *           description: "Preferred currency for displaying prices"
 *         language:
 *           type: string
 *           example: "en"
 *           description: "Preferred language code"
 *
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           example: "John"
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           pattern: "^\\+?[\\d\\s-()]+$"
 *           example: "+1-555-123-4567"
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/avatars/user123.jpg"
 *         role:
 *           type: string
 *           enum: [customer, admin, super_admin]
 *           example: "customer"
 *         isActive:
 *           type: boolean
 *           example: true
 *           description: "Whether the user account is active"
 *         emailVerified:
 *           type: boolean
 *           example: true
 *           description: "Whether the user's email has been verified"
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-16T14:22:00Z"
 *         lastLoginIP:
 *           type: string
 *           example: "192.168.1.1"
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserAddress'
 *         preferences:
 *           $ref: '#/components/schemas/UserPreferences'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-16T14:22:00Z"
 *         # Virtual fields (computed)
 *         fullName:
 *           type: string
 *           readOnly: true
 *           example: "John Doe"
 *           description: "Full name combining firstName and lastName"
 *         isLocked:
 *           type: boolean
 *           readOnly: true
 *           example: false
 *           description: "Whether the account is currently locked due to failed login attempts"
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Login successful"
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               description: "JWT access token"
 *             refreshToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               description: "JWT refresh token"
 *             expiresIn:
 *               type: string
 *               example: "24h"
 *               description: "Token expiration time"
 *
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *         - confirmPassword
 *       properties:
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           example: "John"
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "SecurePass1!"
 *           description: "Password must be at least 8 characters long"
 *         confirmPassword:
 *           type: string
 *           format: password
 *           example: "SecurePass1!"
 *           description: "Must match the password field"
 *         phone:
 *           type: string
 *           pattern: "^\\+?[\\d\\s-()]+$"
 *           example: "+1-555-123-4567"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "yourSecurePassword123"
 *
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - token
 *         - password
 *         - confirmPassword
 *       properties:
 *         token:
 *           type: string
 *           example: "reset-token-from-email"
 *           description: "Password reset token received via email"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "NewSecurePassword123!"
 *         confirmPassword:
 *           type: string
 *           format: password
 *           example: "NewSecurePassword123!"
 *           description: "Must match the password field"
 *
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *         - confirmPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           example: "CurrentPassword123!"
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "NewSecurePassword123!"
 *         confirmPassword:
 *           type: string
 *           format: password
 *           example: "NewSecurePassword123!"
 *           description: "Must match the newPassword field"
 *
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *           description: "Valid refresh token"
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operation completed successfully"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "An error occurred"
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: "VALIDATION_ERROR"
 *             details:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Email is required", "Password must be at least 8 characters"]
 */
