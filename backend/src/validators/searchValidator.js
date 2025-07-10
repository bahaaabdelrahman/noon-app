const Joi = require('joi');

/**
 * Validation schema for advanced search query parameters
 */
const advancedSearchSchema = Joi.object({
  q: Joi.string().trim().max(200).allow('').messages({
    'string.base': 'Search query must be a string',
    'string.max': 'Search query cannot exceed 200 characters',
  }),

  category: Joi.string().trim().messages({
    'string.base': 'Category must be a string',
  }),

  subcategory: Joi.string().trim().messages({
    'string.base': 'Subcategory must be a string',
  }),

  brand: Joi.alternatives()
    .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()))
    .messages({
      'alternatives.match': 'Brand must be a string or array of strings',
    }),

  minPrice: Joi.number().min(0).messages({
    'number.base': 'Minimum price must be a number',
    'number.min': 'Minimum price cannot be negative',
  }),

  maxPrice: Joi.number().min(0).messages({
    'number.base': 'Maximum price must be a number',
    'number.min': 'Maximum price cannot be negative',
  }),

  minRating: Joi.number().min(0).max(5).messages({
    'number.base': 'Minimum rating must be a number',
    'number.min': 'Minimum rating cannot be less than 0',
    'number.max': 'Minimum rating cannot be more than 5',
  }),

  tags: Joi.alternatives()
    .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()))
    .messages({
      'alternatives.match': 'Tags must be a string or array of strings',
    }),

  inStock: Joi.string().valid('true', 'false').messages({
    'string.base': 'inStock must be a string',
    'any.only': 'inStock must be either "true" or "false"',
  }),

  featured: Joi.string().valid('true', 'false').messages({
    'string.base': 'featured must be a string',
    'any.only': 'featured must be either "true" or "false"',
  }),

  sortBy: Joi.string()
    .valid(
      'relevance',
      'price-low',
      'price-high',
      'rating',
      'newest',
      'popular',
      'name'
    )
    .default('relevance')
    .messages({
      'string.base': 'sortBy must be a string',
      'any.only':
        'sortBy must be one of: relevance, price-low, price-high, rating, newest, popular, name',
    }),

  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),

  facets: Joi.string().valid('true', 'false').default('true').messages({
    'string.base': 'facets must be a string',
    'any.only': 'facets must be either "true" or "false"',
  }),
}).custom((value, helpers) => {
  // Custom validation: maxPrice should be greater than minPrice
  if (value.minPrice && value.maxPrice && value.minPrice >= value.maxPrice) {
    return helpers.error('any.invalid', {
      message: 'Maximum price must be greater than minimum price',
    });
  }
  return value;
});

/**
 * Validation schema for autocomplete query parameters
 */
const autocompleteSchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).required().messages({
    'string.base': 'Search query must be a string',
    'string.empty': 'Search query cannot be empty',
    'string.min': 'Search query must be at least 1 character',
    'string.max': 'Search query cannot exceed 100 characters',
    'any.required': 'Search query is required',
  }),

  limit: Joi.number().integer().min(1).max(20).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 20',
  }),
});

/**
 * Validation schema for search filters (used in filter endpoints)
 */
const searchFiltersSchema = Joi.object({
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.base': 'Category ID must be a string',
      'string.pattern.base': 'Category ID must be a valid MongoDB ObjectId',
    }),

  brands: Joi.array().items(Joi.string().trim()).min(1).max(20).messages({
    'array.base': 'Brands must be an array',
    'array.min': 'At least one brand must be specified',
    'array.max': 'Cannot filter by more than 20 brands',
  }),

  priceRange: Joi.object({
    min: Joi.number().min(0).required(),
    max: Joi.number().min(0).required(),
  }).custom((value, helpers) => {
    if (value.min >= value.max) {
      return helpers.error('any.invalid', {
        message: 'Maximum price must be greater than minimum price',
      });
    }
    return value;
  }),

  ratings: Joi.array()
    .items(Joi.number().min(0).max(5))
    .min(1)
    .max(5)
    .messages({
      'array.base': 'Ratings must be an array',
      'array.min': 'At least one rating must be specified',
      'array.max': 'Cannot filter by more than 5 rating values',
    }),

  tags: Joi.array().items(Joi.string().trim()).min(1).max(10).messages({
    'array.base': 'Tags must be an array',
    'array.min': 'At least one tag must be specified',
    'array.max': 'Cannot filter by more than 10 tags',
  }),

  availability: Joi.string()
    .valid('in-stock', 'out-of-stock', 'pre-order', 'all')
    .default('all')
    .messages({
      'string.base': 'Availability must be a string',
      'any.only':
        'Availability must be one of: in-stock, out-of-stock, pre-order, all',
    }),

  featured: Joi.boolean().messages({
    'boolean.base': 'Featured must be a boolean',
  }),

  newArrivals: Joi.boolean().messages({
    'boolean.base': 'New arrivals must be a boolean',
  }),

  onSale: Joi.boolean().messages({
    'boolean.base': 'On sale must be a boolean',
  }),
});

/**
 * Validation schema for search result sorting
 */
const searchSortSchema = Joi.object({
  field: Joi.string()
    .valid(
      'relevance',
      'name',
      'price',
      'rating',
      'date',
      'popularity',
      'alphabetical'
    )
    .required()
    .messages({
      'string.base': 'Sort field must be a string',
      'any.only':
        'Sort field must be one of: relevance, name, price, rating, date, popularity, alphabetical',
      'any.required': 'Sort field is required',
    }),

  direction: Joi.string().valid('asc', 'desc').default('asc').messages({
    'string.base': 'Sort direction must be a string',
    'any.only': 'Sort direction must be either "asc" or "desc"',
  }),
});

/**
 * Validation schema for search analytics (if implemented)
 */
const searchAnalyticsSchema = Joi.object({
  query: Joi.string().trim().max(200).required().messages({
    'string.base': 'Search query must be a string',
    'string.max': 'Search query cannot exceed 200 characters',
    'any.required': 'Search query is required',
  }),

  resultsCount: Joi.number().integer().min(0).required().messages({
    'number.base': 'Results count must be a number',
    'number.integer': 'Results count must be an integer',
    'number.min': 'Results count cannot be negative',
    'any.required': 'Results count is required',
  }),

  clickedResult: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.base': 'Clicked result must be a string',
      'string.pattern.base': 'Clicked result must be a valid MongoDB ObjectId',
    }),

  filters: Joi.object().messages({
    'object.base': 'Filters must be an object',
  }),

  userAgent: Joi.string().max(500).messages({
    'string.base': 'User agent must be a string',
    'string.max': 'User agent cannot exceed 500 characters',
  }),

  sessionId: Joi.string().messages({
    'string.base': 'Session ID must be a string',
  }),
});

module.exports = {
  advancedSearchSchema,
  autocompleteSchema,
  searchFiltersSchema,
  searchSortSchema,
  searchAnalyticsSchema,
};
