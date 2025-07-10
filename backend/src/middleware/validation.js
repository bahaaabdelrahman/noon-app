const { ValidationError } = require('../utils/errors');
const catchAsync = require('../utils/catchAsync');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return catchAsync(async (req, res, next) => {
    let dataToValidate;

    switch (source) {
      case 'body':
        dataToValidate = req.body;
        break;
      case 'params':
        dataToValidate = req.params;
        break;
      case 'query':
        dataToValidate = req.query;
        break;
      default:
        dataToValidate = req.body;
    }

    // Validate the data
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      // Format error details
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return next(new ValidationError('Validation failed', details));
    }

    // Replace the original data with validated and sanitized data
    switch (source) {
      case 'body':
        req.body = value;
        break;
      case 'params':
        req.params = value;
        break;
      case 'query':
        req.query = value;
        break;
    }

    next();
  });
};

/**
 * Validate request body
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateBody = schema => validate(schema, 'body');

/**
 * Validate request parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateParams = schema => validate(schema, 'params');

/**
 * Validate request query parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateQuery = schema => validate(schema, 'query');

/**
 * Multiple validation middleware for different sources
 * @param {Object} schemas - Object containing schemas for different sources
 * @returns {Function} Express middleware function
 */
const validateMultiple = schemas => {
  return catchAsync(async (req, res, next) => {
    const errors = [];

    // Validate body if schema provided
    if (schemas.body) {
      const { error } = schemas.body.validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      });

      if (error) {
        errors.push(
          ...error.details.map(detail => ({
            source: 'body',
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
          }))
        );
      }
    }

    // Validate params if schema provided
    if (schemas.params) {
      const { error } = schemas.params.validate(req.params, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      });

      if (error) {
        errors.push(
          ...error.details.map(detail => ({
            source: 'params',
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
          }))
        );
      }
    }

    // Validate query if schema provided
    if (schemas.query) {
      const { error } = schemas.query.validate(req.query, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      });

      if (error) {
        errors.push(
          ...error.details.map(detail => ({
            source: 'query',
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
          }))
        );
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError('Validation failed', errors));
    }

    next();
  });
};

module.exports = {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  validateMultiple,
};
