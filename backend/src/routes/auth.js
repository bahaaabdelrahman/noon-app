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
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass1!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: SecurePass1!
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request or validation error
 *       409:
 *         description: User with this email already exists
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
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: yourSecurePassword123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
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
 *       401:
 *         description: Unauthorized, token is missing or invalid
 */
router.get('/me', authenticate, authController.getMe);

// ... other routes with placeholder for future documentation ...

router.post('/logout', authenticate, authController.logout);
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  authController.refreshToken
);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);
router.get('/verify-email/:token', authController.verifyEmail);
router.post(
  '/resend-verification',
  authenticate,
  authController.resendEmailVerification
);

module.exports = router;
