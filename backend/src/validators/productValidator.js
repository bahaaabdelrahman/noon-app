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
  isMain: Joi.boolean().default(false),
});

/**
 * Product variant validation schema
 */
const variantSchema = Joi.object({
  name: Joi.string().required().max(50).messages({
    'string.empty': 'Variant name is required',
    'string.max': 'Variant name cannot exceed 50 characters',
  }),
  options: Joi.array()
    .items(
      Joi.string().required().max(100).messages({
        'string.empty': 'Variant option is required',
        'string.max': 'Variant option cannot exceed 100 characters',
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one variant option is required',
    }),
});

/**
 * Pricing validation schema
 */
const pricingSchema = Joi.object({
  price: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Price must be a positive number',
    'number.precision': 'Price cannot have more than 2 decimal places',
    'any.required': 'Product price is required',
  }),
  comparePrice: Joi.number()
    .positive()
    .precision(2)
    .greater(Joi.ref('price'))
    .messages({
      'number.positive': 'Compare price must be a positive number',
      'number.precision':
        'Compare price cannot have more than 2 decimal places',
      'number.greater': 'Compare price must be greater than regular price',
    }),
  costPerItem: Joi.number().min(0).precision(2).messages({
    'number.min': 'Cost per item cannot be negative',
    'number.precision': 'Cost per item cannot have more than 2 decimal places',
  }),
  taxable: Joi.boolean().default(true),
  currency: Joi.string()
    .uppercase()
    .length(3)
    .pattern(/^[A-Z]{3}$/)
    .default('USD')
    .messages({
      'string.length': 'Currency must be a 3-letter ISO code',
      'string.pattern.base': 'Currency must be a valid 3-letter ISO code',
    }),
});

/**
 * Inventory validation schema
 */
const inventorySchema = Joi.object({
  trackQuantity: Joi.boolean().default(true),
  quantity: Joi.number().integer().min(0).default(0).messages({
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity cannot be negative',
  }),
  lowStockThreshold: Joi.number().integer().min(0).default(10).messages({
    'number.integer': 'Low stock threshold must be an integer',
    'number.min': 'Low stock threshold cannot be negative',
  }),
  allowBackorder: Joi.boolean().default(false),
  weight: Joi.number().positive().messages({
    'number.positive': 'Weight must be a positive number',
  }),
  dimensions: Joi.object({
    length: Joi.number().positive().messages({
      'number.positive': 'Length must be a positive number',
    }),
    width: Joi.number().positive().messages({
      'number.positive': 'Width must be a positive number',
    }),
    height: Joi.number().positive().messages({
      'number.positive': 'Height must be a positive number',
    }),
    unit: Joi.string().valid('cm', 'in', 'm', 'ft').default('cm'),
  }),
});

/**
 * SEO validation schema
 */
const seoSchema = Joi.object({
  metaTitle: Joi.string().max(60).messages({
    'string.max': 'Meta title cannot exceed 60 characters',
  }),
  metaDescription: Joi.string().max(160).messages({
    'string.max': 'Meta description cannot exceed 160 characters',
  }),
  metaKeywords: Joi.array().items(Joi.string().max(50)),
  canonicalUrl: Joi.string().uri().messages({
    'string.uri': 'Canonical URL must be a valid URI',
  }),
});

/**
 * Create product validation schema
 */
const createProductSchema = Joi.object({
  name: Joi.string().required().max(200).messages({
    'string.empty': 'Product name is required',
    'string.max': 'Product name cannot exceed 200 characters',
    'any.required': 'Product name is required',
  }),
  description: Joi.string().required().max(5000).messages({
    'string.empty': 'Product description is required',
    'string.max': 'Product description cannot exceed 5000 characters',
    'any.required': 'Product description is required',
  }),
  shortDescription: Joi.string().max(500).messages({
    'string.max': 'Short description cannot exceed 500 characters',
  }),
  sku: Joi.string()
    .required()
    .uppercase()
    .pattern(/^[A-Z0-9-_]+$/)
    .messages({
      'string.empty': 'SKU is required',
      'string.pattern.base':
        'SKU can only contain uppercase letters, numbers, hyphens, and underscores',
      'any.required': 'SKU is required',
    }),
  barcode: Joi.string()
    .pattern(/^[0-9]+$/)
    .messages({
      'string.pattern.base': 'Barcode can only contain numbers',
    }),
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Category must be a valid MongoDB ObjectId',
      'any.required': 'Product category is required',
    }),
  subcategories: Joi.array().items(
    Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.pattern.base': 'Subcategory must be a valid MongoDB ObjectId',
      })
  ),
  brand: Joi.string().max(100).messages({
    'string.max': 'Brand name cannot exceed 100 characters',
  }),
  tags: Joi.array()
    .items(
      Joi.string().max(50).lowercase().messages({
        'string.max': 'Tag cannot exceed 50 characters',
      })
    )
    .max(20)
    .messages({
      'array.max': 'Cannot have more than 20 tags',
    }),
  images: Joi.array().items(imageSchema).max(10).messages({
    'array.max': 'Cannot have more than 10 images',
  }),
  variants: Joi.array().items(variantSchema).max(5).messages({
    'array.max': 'Cannot have more than 5 variants',
  }),
  specifications: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.object()
    )
  ),
  pricing: pricingSchema.required(),
  inventory: inventorySchema.required(),
  seo: seoSchema,
  status: Joi.string()
    .valid('active', 'inactive', 'draft', 'archived')
    .default('draft'),
  visibility: Joi.string()
    .valid('public', 'private', 'hidden')
    .default('public'),
  isFeatured: Joi.boolean().default(false),
  isDigital: Joi.boolean().default(false),
  requiresShipping: Joi.boolean().default(true),
  relatedProducts: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base':
            'Related product must be a valid MongoDB ObjectId',
        })
    )
    .max(10)
    .messages({
      'array.max': 'Cannot have more than 10 related products',
    }),
});

/**
 * Update product validation schema (all fields optional)
 */
const updateProductSchema = Joi.object({
  name: Joi.string().max(200).messages({
    'string.max': 'Product name cannot exceed 200 characters',
  }),
  description: Joi.string().max(5000).messages({
    'string.max': 'Product description cannot exceed 5000 characters',
  }),
  shortDescription: Joi.string().max(500).messages({
    'string.max': 'Short description cannot exceed 500 characters',
  }),
  sku: Joi.string()
    .uppercase()
    .pattern(/^[A-Z0-9-_]+$/)
    .messages({
      'string.pattern.base':
        'SKU can only contain uppercase letters, numbers, hyphens, and underscores',
    }),
  barcode: Joi.string()
    .pattern(/^[0-9]+$/)
    .messages({
      'string.pattern.base': 'Barcode can only contain numbers',
    }),
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Category must be a valid MongoDB ObjectId',
    }),
  subcategories: Joi.array().items(
    Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.pattern.base': 'Subcategory must be a valid MongoDB ObjectId',
      })
  ),
  brand: Joi.string().max(100).messages({
    'string.max': 'Brand name cannot exceed 100 characters',
  }),
  tags: Joi.array()
    .items(
      Joi.string().max(50).lowercase().messages({
        'string.max': 'Tag cannot exceed 50 characters',
      })
    )
    .max(20)
    .messages({
      'array.max': 'Cannot have more than 20 tags',
    }),
  images: Joi.array().items(imageSchema).max(10).messages({
    'array.max': 'Cannot have more than 10 images',
  }),
  variants: Joi.array().items(variantSchema).max(5).messages({
    'array.max': 'Cannot have more than 5 variants',
  }),
  specifications: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.object()
    )
  ),
  pricing: pricingSchema,
  inventory: inventorySchema,
  seo: seoSchema,
  status: Joi.string().valid('active', 'inactive', 'draft', 'archived'),
  visibility: Joi.string().valid('public', 'private', 'hidden'),
  isFeatured: Joi.boolean(),
  isDigital: Joi.boolean(),
  requiresShipping: Joi.boolean(),
  relatedProducts: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base':
            'Related product must be a valid MongoDB ObjectId',
        })
    )
    .max(10)
    .messages({
      'array.max': 'Cannot have more than 10 related products',
    }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required for update',
  });

/**
 * Product query validation schema
 */
const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(50).default(20).messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 50',
  }),
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Category must be a valid MongoDB ObjectId',
    }),
  minPrice: Joi.number().min(0).messages({
    'number.min': 'Minimum price cannot be negative',
  }),
  maxPrice: Joi.number().min(0).messages({
    'number.min': 'Maximum price cannot be negative',
  }),
  brand: Joi.string().max(100),
  tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
  featured: Joi.boolean(),
  inStock: Joi.boolean(),
  sort: Joi.string()
    .valid(
      'price',
      '-price',
      'name',
      '-name',
      'rating',
      '-rating',
      'newest',
      '-newest',
      'createdAt',
      '-createdAt',
      'salesCount',
      '-salesCount'
    )
    .default('-createdAt'),
  search: Joi.string().max(200).messages({
    'string.max': 'Search term cannot exceed 200 characters',
  }),
  status: Joi.string().valid('active', 'inactive', 'draft', 'archived'),
  visibility: Joi.string().valid('public', 'private', 'hidden'),
})
  .custom((value, helpers) => {
    // Custom validation to ensure maxPrice is greater than minPrice
    if (value.minPrice !== undefined && value.maxPrice !== undefined) {
      if (value.maxPrice <= value.minPrice) {
        return helpers.error('custom.priceRange');
      }
    }
    return value;
  })
  .messages({
    'custom.priceRange': 'Maximum price must be greater than minimum price',
  });

/**
 * Product ID param validation schema
 */
const productIdParamSchema = Joi.object({
  id: Joi.alternatives()
    .try(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
        }),
      Joi.string()
        .pattern(/^[a-z0-9-]+$/)
        .messages({
          'string.pattern.base':
            'Product slug must contain only lowercase letters, numbers, and hyphens',
        })
    )
    .required()
    .messages({
      'any.required': 'Product ID or slug is required',
    }),
});

/**
 * Bulk update validation schema
 */
const bulkUpdateSchema = Joi.object({
  productIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
        })
    )
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one product ID is required',
      'array.max': 'Cannot update more than 100 products at once',
      'any.required': 'Product IDs are required',
    }),
  updates: Joi.object({
    status: Joi.string().valid('active', 'inactive', 'draft', 'archived'),
    visibility: Joi.string().valid('public', 'private', 'hidden'),
    isFeatured: Joi.boolean(),
    category: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.pattern.base': 'Category must be a valid MongoDB ObjectId',
      }),
    'pricing.price': Joi.number().positive().precision(2).messages({
      'number.positive': 'Price must be a positive number',
      'number.precision': 'Price cannot have more than 2 decimal places',
    }),
    'inventory.quantity': Joi.number().integer().min(0).messages({
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity cannot be negative',
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
 * Image upload validation schema
 */
const imageUploadSchema = Joi.object({
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        publicId: Joi.string().required(),
        alt: Joi.string().allow('').max(200),
        isMain: Joi.boolean().default(false),
      })
    )
    .min(1)
    .max(10)
    .required()
    .messages({
      'array.min': 'At least one image is required',
      'array.max': 'Cannot upload more than 10 images at once',
      'any.required': 'Images are required',
    }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdParamSchema,
  bulkUpdateSchema,
  imageUploadSchema,
};
