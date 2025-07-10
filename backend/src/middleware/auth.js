const User = require('../models/User');
const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const catchAsync = require('../utils/catchAsync');
const { logger } = require('../utils/logger');

/**
 * Authentication middleware to protect routes
 */
const authenticate = catchAsync(async (req, res, next) => {
  // 1) Get token from header
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return next(new AuthenticationError('Access token is required'));
  }

  // 2) Verify token
  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token has expired'));
    }
    return next(new AuthenticationError('Token verification failed'));
  }

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.userId).select(
    '+passwordChangedAt'
  );

  if (!currentUser) {
    return next(new AuthenticationError('User no longer exists'));
  }

  // 4) Check if user account is active
  if (!currentUser.isActive) {
    return next(new AuthenticationError('User account is deactivated'));
  }

  // 5) Check if user account is locked
  if (currentUser.isLocked) {
    return next(new AuthenticationError('User account is temporarily locked'));
  }

  // 6) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AuthenticationError(
        'User recently changed password. Please log in again'
      )
    );
  }

  // 7) Grant access to protected route
  req.user = currentUser;
  req.token = token;

  // Log successful authentication
  logger.debug(`User ${currentUser.email} authenticated successfully`);

  next();
});

/**
 * Authorization middleware to restrict access based on user roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized access attempt by user ${req.user.email} with role ${req.user.role}`
      );
      return next(
        new AuthorizationError(
          `Access denied. Required roles: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
};

/**
 * Optional authentication middleware (doesn't throw error if no token)
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  // 1) Get token from header
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return next();
  }

  try {
    // 2) Verify token
    const decoded = await verifyToken(token);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.userId);

    if (!currentUser || !currentUser.isActive) {
      return next();
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    // 5) Set user if everything is valid
    req.user = currentUser;
    req.token = token;
  } catch (error) {
    // If token is invalid, just continue without user
    logger.debug('Optional auth failed, continuing without user');
  }

  next();
});

/**
 * Middleware to check if user owns the resource
 * @param {string} resourceField - Field name to check ownership (default: 'user')
 * @returns {Function} Middleware function
 */
const checkResourceOwnership = (resourceField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Admin can access all resources
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      return next();
    }

    // For other users, check ownership
    const resourceUserId =
      req.params.userId || req.body[resourceField] || req.query.userId;

    if (resourceUserId && resourceUserId !== req.user._id.toString()) {
      return next(
        new AuthorizationError(
          'Access denied. You can only access your own resources'
        )
      );
    }

    next();
  };
};

/**
 * middleware to refresh user data from database
 */
const refreshUser = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const currentUser = await User.findById(req.user._id);

  if (!currentUser || !currentUser.isActive) {
    return next(
      new AuthenticationError('User no longer exists or is inactive')
    );
  }

  req.user = currentUser;
  next();
});

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkResourceOwnership,
  refreshUser,
};
