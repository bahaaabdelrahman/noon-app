const crypto = require('crypto');
const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} = require('../utils/errors');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const { logger } = require('../utils/logger');

/**
 * Register a new user
 */
const register = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, confirmPassword, phone } =
    req.body;

  if (password !== confirmPassword) {
    return next(new ValidationError('Passwords do not match'));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ValidationError('User already exists with this email'));
  }

  // Create new user
  const userData = {
    firstName,
    lastName,
    email,
    password,
    phone,
  };

  const user = await User.create(userData);

  // Generate email verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const tokens = generateTokens(user._id);

  // Remove password from output
  const userOutput = user.toObject();
  delete userOutput.password;

  // Log registration
  logger.info(`New user registered: ${email}`);

  // TODO: Send verification email (will implement when email service is ready)

  ApiResponse.created(
    res,
    {
      user: userOutput,
      tokens,
    },
    'User registered successfully. Please verify your email.'
  );
});

/**
 * Login user
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select(
    '+password +loginAttempts +lockUntil'
  );

  // Check if user exists and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    // Increment login attempts if user exists
    if (user) {
      await user.incLoginAttempts();
    }

    logger.warn(`Failed login attempt for email: ${email}`);
    return next(new AuthenticationError('Invalid email or password'));
  }

  // Check if account is locked
  if (user.isLocked) {
    logger.warn(`Login attempt on locked account: ${email}`);
    return next(
      new AuthenticationError(
        'Account temporarily locked due to too many failed login attempts'
      )
    );
  }

  // Check if account is active
  if (!user.isActive) {
    logger.warn(`Login attempt on inactive account: ${email}`);
    return next(new AuthenticationError('Account is deactivated'));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login info
  user.lastLoginAt = new Date();
  user.lastLoginIP = req.ip;
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const tokens = generateTokens(user._id);

  // Remove sensitive fields from output
  const userOutput = user.toObject();
  delete userOutput.password;
  delete userOutput.loginAttempts;
  delete userOutput.lockUntil;

  // Log successful login
  logger.info(`User logged in successfully: ${email}`);

  ApiResponse.success(
    res,
    {
      user: userOutput,
      tokens,
    },
    'Login successful'
  );
});

/**
 * Logout user (client-side token removal)
 */
const logout = catchAsync(async (req, res, next) => {
  // Log logout
  if (req.user) {
    logger.info(`User logged out: ${req.user.email}`);
  }

  ApiResponse.success(res, null, 'Logout successful');
});

/**
 * Refresh access token
 */
const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  // Verify refresh token
  let decoded;
  try {
    decoded = await verifyRefreshToken(refreshToken);
  } catch (error) {
    return next(new AuthenticationError('Invalid or expired refresh token'));
  }

  // Check if user still exists
  const user = await User.findById(decoded.userId);
  if (!user) {
    return next(new AuthenticationError('User no longer exists'));
  }

  // Check if user account is active
  if (!user.isActive) {
    return next(new AuthenticationError('User account is deactivated'));
  }

  // Generate new tokens
  const tokens = generateTokens(user._id);

  ApiResponse.success(res, { tokens }, 'Token refreshed successfully');
});

/**
 * Forgot password - send reset token
 */
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return next(new NotFoundError('No user found with that email address'));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new AuthenticationError('Account is deactivated'));
  }

  // Generate password reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Log password reset request
  logger.info(`Password reset requested for: ${email}`);

  // TODO: Send password reset email (will implement when email service is ready)

  ApiResponse.success(res, null, 'Password reset token sent to your email');
});

/**
 * Reset password using token
 */
const resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;

  // Hash the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by token and check if token is not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AuthenticationError('Token is invalid or has expired'));
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();

  await user.save();

  // Generate new tokens
  const tokens = generateTokens(user._id);

  // Log password reset
  logger.info(`Password reset successfully for: ${user.email}`);

  ApiResponse.success(res, { tokens }, 'Password reset successful');
});

/**
 * Change password for authenticated user
 */
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AuthenticationError('Current password is incorrect'));
  }

  // Update password
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  // Generate new tokens (invalidate old ones)
  const tokens = generateTokens(user._id);

  // Log password change
  logger.info(`Password changed for user: ${user.email}`);

  ApiResponse.success(res, { tokens }, 'Password changed successfully');
});

/**
 * Verify email using token
 */
const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  // Hash the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by token and check if token is not expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AuthenticationError('Token is invalid or has expired'));
  }

  // Update user
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save({ validateBeforeSave: false });

  // Log email verification
  logger.info(`Email verified for user: ${user.email}`);

  ApiResponse.success(res, null, 'Email verified successfully');
});

/**
 * Resend email verification
 */
const resendEmailVerification = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (user.emailVerified) {
    return next(new ValidationError('Email is already verified'));
  }

  // Generate new verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // TODO: Send verification email (will implement when email service is ready)

  ApiResponse.success(res, null, 'Verification email sent');
});

/**
 * Get current user info
 */
const getMe = catchAsync(async (req, res, next) => {
  const user = req.user.toObject();

  ApiResponse.success(res, { user }, 'User info retrieved successfully');
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendEmailVerification,
  getMe,
};
