const Joi = require('joi');

/**
 * Validation schema for creating a review
 */
const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot be more than 5',
    'any.required': 'Rating is required',
  }),

  title: Joi.string().trim().min(3).max(100).required().messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title cannot be empty',
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title cannot exceed 100 characters',
    'any.required': 'Title is required',
  }),

  comment: Joi.string().trim().min(10).max(1000).required().messages({
    'string.base': 'Comment must be a string',
    'string.empty': 'Comment cannot be empty',
    'string.min': 'Comment must be at least 10 characters long',
    'string.max': 'Comment cannot exceed 1000 characters',
    'any.required': 'Comment is required',
  }),
});

/**
 * Validation schema for updating a review
 */
const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot be more than 5',
  }),

  title: Joi.string().trim().min(3).max(100).messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title cannot be empty',
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title cannot exceed 100 characters',
  }),

  comment: Joi.string().trim().min(10).max(1000).messages({
    'string.base': 'Comment must be a string',
    'string.empty': 'Comment cannot be empty',
    'string.min': 'Comment must be at least 10 characters long',
    'string.max': 'Comment cannot exceed 1000 characters',
  }),
}).min(1); // At least one field must be provided

/**
 * Validation schema for review query parameters
 */
const reviewQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),

  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 50',
  }),

  sort: Joi.string()
    .valid(
      'newest',
      'oldest',
      'highest-rating',
      'lowest-rating',
      'most-helpful'
    )
    .default('newest')
    .messages({
      'string.base': 'Sort must be a string',
      'any.only':
        'Sort must be one of: newest, oldest, highest-rating, lowest-rating, most-helpful',
    }),

  rating: Joi.number().integer().min(1).max(5).messages({
    'number.base': 'Rating filter must be a number',
    'number.integer': 'Rating filter must be an integer',
    'number.min': 'Rating filter must be at least 1',
    'number.max': 'Rating filter cannot be more than 5',
  }),

  verified: Joi.string().valid('true', 'false').messages({
    'string.base': 'Verified filter must be a string',
    'any.only': 'Verified filter must be either "true" or "false"',
  }),
});

/**
 * Validation schema for flagging a review
 */
const flagReviewSchema = Joi.object({
  flagType: Joi.string()
    .valid('inappropriate', 'spam')
    .default('inappropriate')
    .messages({
      'string.base': 'Flag type must be a string',
      'any.only': 'Flag type must be either "inappropriate" or "spam"',
    }),

  reason: Joi.string().trim().max(200).messages({
    'string.base': 'Reason must be a string',
    'string.max': 'Reason cannot exceed 200 characters',
  }),
});

/**
 * Validation schema for admin review status update
 */
const updateReviewStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'flagged')
    .required()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of: pending, approved, rejected, flagged',
      'any.required': 'Status is required',
    }),

  moderationReason: Joi.string()
    .trim()
    .max(500)
    .when('status', {
      is: Joi.valid('rejected', 'flagged'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'string.base': 'Moderation reason must be a string',
      'string.max': 'Moderation reason cannot exceed 500 characters',
      'any.required':
        'Moderation reason is required when rejecting or flagging a review',
    }),
});

/**
 * Validation schema for admin review filtering
 */
const adminReviewQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(20),

  sort: Joi.string()
    .valid('-createdAt', 'createdAt', '-rating', 'rating', '-helpful.count')
    .default('-createdAt'),

  status: Joi.string().valid('pending', 'approved', 'rejected', 'flagged'),

  rating: Joi.number().integer().min(1).max(5),

  verified: Joi.string().valid('true', 'false'),

  flagged: Joi.string().valid('true', 'false'),
});

/**
 * Validation schema for MongoDB ObjectId parameters
 */
const objectIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.base': 'ID must be a string',
      'string.pattern.base': 'ID must be a valid MongoDB ObjectId',
      'any.required': 'ID is required',
    }),
});

const productIdSchema = Joi.object({
  productId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.base': 'Product ID must be a string',
      'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
      'any.required': 'Product ID is required',
    }),
});

const reviewIdSchema = Joi.object({
  reviewId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.base': 'Review ID must be a string',
      'string.pattern.base': 'Review ID must be a valid MongoDB ObjectId',
      'any.required': 'Review ID is required',
    }),
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  reviewQuerySchema,
  flagReviewSchema,
  updateReviewStatusSchema,
  adminReviewQuerySchema,
  objectIdSchema,
  productIdSchema,
  reviewIdSchema,
};
