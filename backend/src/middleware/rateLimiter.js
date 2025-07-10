const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../config/constants');
const { logger } = require('../utils/logger');

/**
 * Create rate limiter with custom options
 * @param {Object} options - Rate limit options
 * @returns {Function} Rate limiter middleware
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: RATE_LIMITS.GENERAL.windowMs,
    max: RATE_LIMITS.GENERAL.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many requests from this IP, please try again later.',
      },
    },
    handler: (req, res) => {
      logger.warn(
        `Rate limit exceeded for IP: ${req.ip}, URL: ${req.originalUrl}`
      );
      res.status(429).json(options.message || defaultOptions.message);
    },
    skip: req => {
      // Skip rate limiting for health check endpoints
      return req.path === '/health' || req.path === '/api/v1/health';
    },
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * General API rate limiter
 */
const generalLimiter = createRateLimiter({
  windowMs: RATE_LIMITS.GENERAL.windowMs,
  max: RATE_LIMITS.GENERAL.max,
});

/**
 * Authentication endpoints rate limiter
 */
const authLimiter = createRateLimiter({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
});

/**
 * Admin endpoints rate limiter
 */
const adminLimiter = createRateLimiter({
  windowMs: RATE_LIMITS.ADMIN.windowMs,
  max: RATE_LIMITS.ADMIN.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many admin requests, please try again later.',
    },
  },
});

/**
 * File upload rate limiter
 */
const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 upload requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many file upload attempts, please try again later.',
    },
  },
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many password reset attempts, please try again later.',
    },
  },
});

module.exports = {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  adminLimiter,
  uploadLimiter,
  passwordResetLimiter,
};
