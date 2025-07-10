const { logger } = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');
const { AppError } = require('../utils/errors');

/**
 * Handle Mongoose CastError
 * @param {Error} err - Mongoose CastError
 * @returns {AppError} - Formatted error
 */
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

/**
 * Handle Mongoose duplicate key error
 * @param {Error} err - Mongoose duplicate key error
 * @returns {AppError} - Formatted error
 */
const handleDuplicateFieldsDB = err => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
  return new AppError(message, 409, 'DUPLICATE_ENTRY');
};

/**
 * Handle Mongoose validation error
 * @param {Error} err - Mongoose validation error
 * @returns {AppError} - Formatted error
 */
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message,
  }));

  const message = 'Validation failed';
  const error = new AppError(message, 422, 'VALIDATION_ERROR');
  error.details = errors;
  return error;
};

/**
 * Handle JWT errors
 * @param {Error} err - JWT error
 * @returns {AppError} - Formatted error
 */
const handleJWTError = () => {
  return new AppError(
    'Invalid token. Please log in again!',
    401,
    'AUTHENTICATION_ERROR'
  );
};

/**
 * Handle JWT expired error
 * @param {Error} err - JWT expired error
 * @returns {AppError} - Formatted error
 */
const handleJWTExpiredError = () => {
  return new AppError(
    'Your token has expired! Please log in again.',
    401,
    'AUTHENTICATION_ERROR'
  );
};

/**
 * Send error response for development environment
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, res) => {
  logger.error('Error:', {
    error: err,
    stack: err.stack,
  });

  const response = {
    success: false,
    error: {
      code: err.errorCode || 'SERVER_ERROR',
      message: err.message,
      stack: err.stack,
    },
  };

  if (err.details) {
    response.error.details = err.details;
  }

  res.status(err.statusCode || 500).json(response);
};

/**
 * Send error response for production environment
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return ApiResponse.error(
      res,
      err.message,
      err.statusCode || 500,
      err.errorCode || 'SERVER_ERROR',
      err.details || null
    );
  }

  // Programming or other unknown error: don't leak error details
  logger.error('ERROR:', err);

  return ApiResponse.error(res, 'Something went wrong!', 500, 'SERVER_ERROR');
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific Mongoose errors
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

/**
 * Handle unhandled routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFound = (req, res, next) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404,
    'NOT_FOUND'
  );
  next(err);
};

module.exports = {
  globalErrorHandler,
  notFound,
};
