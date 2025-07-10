const Joi = require('joi');

/**
 * Validation schema for creating a wishlist
 */
const createWishlistSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.base': 'Wishlist name must be a string',
    'string.empty': 'Wishlist name cannot be empty',
    'string.min': 'Wishlist name must be at least 1 character',
    'string.max': 'Wishlist name cannot exceed 100 characters',
    'any.required': 'Wishlist name is required',
  }),

  description: Joi.string().trim().max(500).allow('').messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description cannot exceed 500 characters',
  }),

  privacy: Joi.string()
    .valid('private', 'public', 'shared')
    .default('private')
    .messages({
      'string.base': 'Privacy must be a string',
      'any.only': 'Privacy must be either private, public, or shared',
    }),

  tags: Joi.array()
    .items(
      Joi.string().trim().max(30).messages({
        'string.base': 'Tag must be a string',
        'string.max': 'Tag cannot exceed 30 characters',
      })
    )
    .max(10)
    .messages({
      'array.base': 'Tags must be an array',
      'array.max': 'Cannot have more than 10 tags',
    }),
});

/**
 * Validation schema for updating a wishlist
 */
const updateWishlistSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).messages({
    'string.base': 'Wishlist name must be a string',
    'string.empty': 'Wishlist name cannot be empty',
    'string.min': 'Wishlist name must be at least 1 character',
    'string.max': 'Wishlist name cannot exceed 100 characters',
  }),

  description: Joi.string().trim().max(500).allow('').messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description cannot exceed 500 characters',
  }),

  privacy: Joi.string().valid('private', 'public', 'shared').messages({
    'string.base': 'Privacy must be a string',
    'any.only': 'Privacy must be either private, public, or shared',
  }),

  tags: Joi.array()
    .items(
      Joi.string().trim().max(30).messages({
        'string.base': 'Tag must be a string',
        'string.max': 'Tag cannot exceed 30 characters',
      })
    )
    .max(10)
    .messages({
      'array.base': 'Tags must be an array',
      'array.max': 'Cannot have more than 10 tags',
    }),
});

/**
 * Validation schema for adding product to wishlist
 */
const addToWishlistSchema = Joi.object({
  notes: Joi.string().trim().max(200).allow('').messages({
    'string.base': 'Notes must be a string',
    'string.max': 'Notes cannot exceed 200 characters',
  }),

  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium')
    .messages({
      'string.base': 'Priority must be a string',
      'any.only': 'Priority must be low, medium, or high',
    }),
});

/**
 * Validation schema for moving items to cart
 */
const moveToCartSchema = Joi.object({
  productIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
        })
    )
    .min(1)
    .messages({
      'array.base': 'Product IDs must be an array',
      'array.min': 'At least one product ID is required',
    }),

  clearAfterMove: Joi.boolean().default(false).messages({
    'boolean.base': 'clearAfterMove must be a boolean',
  }),
});

/**
 * Validation schema for sharing wishlist
 */
const shareWishlistSchema = Joi.object({
  emails: Joi.array()
    .items(
      Joi.string().email().messages({
        'string.email': 'Each email must be a valid email address',
      })
    )
    .min(1)
    .max(20)
    .messages({
      'array.base': 'Emails must be an array',
      'array.min': 'At least one email is required',
      'array.max': 'Cannot share with more than 20 people at once',
    }),

  permissions: Joi.string().valid('view', 'edit').default('view').messages({
    'string.base': 'Permissions must be a string',
    'any.only': 'Permissions must be either view or edit',
  }),
});

/**
 * Validation schema for wishlist query parameters
 */
const wishlistQuerySchema = Joi.object({
  includeItems: Joi.string().valid('true', 'false').default('false').messages({
    'string.base': 'includeItems must be a string',
    'any.only': 'includeItems must be either true or false',
  }),

  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
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

/**
 * Validation schema for wishlist ID parameter
 */
const wishlistIdSchema = Joi.object({
  wishlistId: Joi.alternatives()
    .try(
      Joi.string().valid('default'),
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
    )
    .required()
    .messages({
      'alternatives.match':
        'Wishlist ID must be either "default" or a valid MongoDB ObjectId',
      'any.required': 'Wishlist ID is required',
    }),
});

/**
 * Validation schema for product ID parameter
 */
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

/**
 * Validation schema for share token parameter
 */
const shareTokenSchema = Joi.object({
  shareToken: Joi.string().alphanum().length(64).required().messages({
    'string.base': 'Share token must be a string',
    'string.alphanum': 'Share token must contain only alphanumeric characters',
    'string.length': 'Share token must be exactly 64 characters',
    'any.required': 'Share token is required',
  }),
});

/**
 * Combined parameter validation schemas
 */
const wishlistProductParamsSchema = Joi.object({
  wishlistId: Joi.alternatives()
    .try(
      Joi.string().valid('default'),
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
    )
    .required()
    .messages({
      'alternatives.match':
        'Wishlist ID must be either "default" or a valid MongoDB ObjectId',
      'any.required': 'Wishlist ID is required',
    }),

  productId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.base': 'Product ID must be a string',
      'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
      'any.required': 'Product ID is required',
    }),
});

module.exports = {
  createWishlistSchema,
  updateWishlistSchema,
  addToWishlistSchema,
  moveToCartSchema,
  shareWishlistSchema,
  wishlistQuerySchema,
  objectIdSchema,
  wishlistIdSchema,
  productIdSchema,
  shareTokenSchema,
  wishlistProductParamsSchema,
};
