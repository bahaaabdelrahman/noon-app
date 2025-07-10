const { ERROR_CODES } = require('../config/constants');

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(
    message,
    statusCode,
    errorCode = ERROR_CODES.SERVER_ERROR,
    isOperational = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 422, ERROR_CODES.VALIDATION_ERROR);
    this.details = details;
  }
}

/**
 * Authentication error class
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, ERROR_CODES.AUTHENTICATION_ERROR);
  }
}

/**
 * Authorization error class
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, ERROR_CODES.AUTHORIZATION_ERROR);
  }
}

/**
 * Not found error class
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, ERROR_CODES.NOT_FOUND);
  }
}

/**
 * Duplicate entry error class
 */
class DuplicateError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, ERROR_CODES.DUPLICATE_ENTRY);
  }
}

/**
 * Payment error class
 */
class PaymentError extends AppError {
  constructor(message = 'Payment processing failed') {
    super(message, 402, ERROR_CODES.PAYMENT_ERROR);
  }
}

/**
 * Insufficient stock error class
 */
class InsufficientStockError extends AppError {
  constructor(message = 'Insufficient stock') {
    super(message, 400, ERROR_CODES.INSUFFICIENT_STOCK);
  }
}

/**
 * Rate limit error class
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, ERROR_CODES.RATE_LIMIT_ERROR);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DuplicateError,
  PaymentError,
  InsufficientStockError,
  RateLimitError,
};
