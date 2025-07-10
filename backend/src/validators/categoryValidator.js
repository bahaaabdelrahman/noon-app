const Joi = require('joi');

/**
 * Image validation schema
 */
const imageSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.empty': 'Image URL is required',
    'string.uri': 'Image URL must be a valid URI',
  }),
  publicId: Joi.string().required().messages({
    'string.empty': 'Image public ID is required',
  }),
  alt: Joi.string().allow('').max(200).messages({
    'string.max': 'Image alt text cannot exceed 200 characters',
  }),
});

/**
 * Meta data validation schema
 */
const metaDataSchema = Joi.object({
  title: Joi.string().max(60).messages({
    'string.max': 'Meta title cannot exceed 60 characters',
  }),
  description: Joi.string().max(160).messages({
    'string.max': 'Meta description cannot exceed 160 characters',
  }),
  keywords: Joi.array()
    .items(
      Joi.string().max(50).messages({
        'string.max': 'Keyword cannot exceed 50 characters',
      })
    )
    .max(20)
    .messages({
      'array.max': 'Cannot have more than 20 keywords',
    }),
});

/**
 * Create category validation schema
 */
const createCategorySchema = Joi.object({
  name: Joi.string().required().max(100).messages({
    'string.empty': 'Category name is required',
    'string.max': 'Category name cannot exceed 100 characters',
    'any.required': 'Category name is required',
  }),
  description: Joi.string().max(500).messages({
    'string.max': 'Category description cannot exceed 500 characters',
  }),
  image: imageSchema,
  parentCategory: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Parent category must be a valid MongoDB ObjectId',
    }),
  isActive: Joi.boolean().default(true),
  isFeatured: Joi.boolean().default(false),
  sortOrder: Joi.number().integer().min(0).default(0).messages({
    'number.integer': 'Sort order must be an integer',
    'number.min': 'Sort order cannot be negative',
  }),
  metaData: metaDataSchema,
});

/**
 * Update category validation schema (all fields optional)
 */
const updateCategorySchema = Joi.object({
  name: Joi.string().max(100).messages({
    'string.max': 'Category name cannot exceed 100 characters',
  }),
  description: Joi.string().max(500).messages({
    'string.max': 'Category description cannot exceed 500 characters',
  }),
  image: imageSchema,
  parentCategory: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .messages({
      'string.pattern.base': 'Parent category must be a valid MongoDB ObjectId',
    }),
  isActive: Joi.boolean(),
  isFeatured: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0).messages({
    'number.integer': 'Sort order must be an integer',
    'number.min': 'Sort order cannot be negative',
  }),
  metaData: metaDataSchema,
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required for update',
  });

/**
 * Category query validation schema
 */
const categoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  parentCategory: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Parent category must be a valid MongoDB ObjectId',
    }),
  level: Joi.number().integer().min(0).max(3).messages({
    'number.integer': 'Level must be an integer',
    'number.min': 'Level cannot be negative',
    'number.max': 'Level cannot exceed 3',
  }),
  isActive: Joi.boolean(),
  isFeatured: Joi.boolean(),
  search: Joi.string().max(200).messages({
    'string.max': 'Search term cannot exceed 200 characters',
  }),
  sort: Joi.string()
    .valid(
      'name',
      '-name',
      'productCount',
      '-productCount',
      'sortOrder',
      '-sortOrder',
      'createdAt',
      '-createdAt'
    )
    .default('sortOrder'),
  includeChildren: Joi.boolean().default(false),
  maxLevel: Joi.number().integer().min(0).max(3).default(3).messages({
    'number.integer': 'Max level must be an integer',
    'number.min': 'Max level cannot be negative',
    'number.max': 'Max level cannot exceed 3',
  }),
});

/**
 * Category ID param validation schema
 */
const categoryIdParamSchema = Joi.object({
  id: Joi.alternatives()
    .try(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Category ID must be a valid MongoDB ObjectId',
        }),
      Joi.string()
        .pattern(/^[a-z0-9-]+$/)
        .messages({
          'string.pattern.base':
            'Category slug must contain only lowercase letters, numbers, and hyphens',
        })
    )
    .required()
    .messages({
      'any.required': 'Category ID or slug is required',
    }),
});

/**
 * Move category validation schema
 */
const moveCategorySchema = Joi.object({
  newParentCategory: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .required()
    .messages({
      'string.pattern.base':
        'New parent category must be a valid MongoDB ObjectId',
      'any.required':
        'New parent category is required (use null for root level)',
    }),
}).custom((value, helpers) => {
  // Additional validation can be added here
  return value;
});

/**
 * Bulk update categories validation schema
 */
const bulkUpdateCategoriesSchema = Joi.object({
  categoryIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Category ID must be a valid MongoDB ObjectId',
        })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one category ID is required',
      'array.max': 'Cannot update more than 50 categories at once',
      'any.required': 'Category IDs are required',
    }),
  updates: Joi.object({
    isActive: Joi.boolean(),
    isFeatured: Joi.boolean(),
    parentCategory: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null)
      .messages({
        'string.pattern.base':
          'Parent category must be a valid MongoDB ObjectId',
      }),
  })
    .min(1)
    .required()
    .messages({
      'object.min': 'At least one update field is required',
      'any.required': 'Update fields are required',
    }),
});

/**
 * Category tree query validation schema
 */
const categoryTreeQuerySchema = Joi.object({
  parentCategory: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .messages({
      'string.pattern.base': 'Parent category must be a valid MongoDB ObjectId',
    }),
  maxLevel: Joi.number().integer().min(0).max(3).default(3).messages({
    'number.integer': 'Max level must be an integer',
    'number.min': 'Max level cannot be negative',
    'number.max': 'Max level cannot exceed 3',
  }),
  includeInactive: Joi.boolean().default(false),
  includeProductCount: Joi.boolean().default(true),
});

/**
 * Category image upload validation schema
 */
const categoryImageUploadSchema = Joi.object({
  image: Joi.object({
    url: Joi.string().uri().required(),
    publicId: Joi.string().required(),
    alt: Joi.string().allow('').max(200),
  })
    .required()
    .messages({
      'any.required': 'Image is required',
    }),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
  categoryIdParamSchema,
  moveCategorySchema,
  bulkUpdateCategoriesSchema,
  categoryTreeQuerySchema,
  categoryImageUploadSchema,
};
