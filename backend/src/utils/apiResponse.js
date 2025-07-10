const { MESSAGES } = require('../config/constants');

/**
 * Standardized API response utility
 */
class ApiResponse {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   * @param {Object} pagination - Pagination info
   */
  static success(
    res,
    data = null,
    message = MESSAGES.SUCCESS,
    statusCode = 200,
    pagination = null
  ) {
    const response = {
      success: true,
      data,
      message,
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send created response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   */
  static created(res, data = null, message = MESSAGES.CREATED) {
    return this.success(res, data, message, 201);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} errorCode - Application error code
   * @param {Array} details - Error details
   */
  static error(
    res,
    message = 'Something went wrong',
    statusCode = 500,
    errorCode = 'SERVER_ERROR',
    details = null
  ) {
    const response = {
      success: false,
      error: {
        code: errorCode,
        message,
      },
    };

    if (details) {
      response.error.details = details;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {Array} details - Validation error details
   */
  static validationError(res, message = 'Validation failed', details = []) {
    return this.error(res, message, 422, 'VALIDATION_ERROR', details);
  }

  /**
   * Send not found response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404, 'NOT_FOUND');
  }

  /**
   * Send unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static unauthorized(res, message = 'Authentication required') {
    return this.error(res, message, 401, 'AUTHENTICATION_ERROR');
  }

  /**
   * Send forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static forbidden(res, message = 'Access denied') {
    return this.error(res, message, 403, 'AUTHORIZATION_ERROR');
  }

  /**
   * Create pagination object
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items
   * @returns {Object} Pagination object
   */
  static createPagination(page, limit, total) {
    const pages = Math.ceil(total / limit);

    return {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };
  }
}

module.exports = ApiResponse;
