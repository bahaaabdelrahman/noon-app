const Joi = require('joi');

/**
 * Validator for adding items to cart
 */
const addToCartValidator = Joi.object({
  productId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
      'any.required': 'Product ID is required',
    }),

  quantity: Joi.number().integer().min(1).max(100).default(1).messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Quantity cannot exceed 100',
  }),

  selectedVariants: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().messages({
          'any.required': 'Variant name is required',
        }),
        value: Joi.string().required().messages({
          'any.required': 'Variant value is required',
        }),
      })
    )
    .optional()
    .default([])
    .messages({
      'array.base': 'Selected variants must be an array',
    }),
});

/**
 * Validator for updating cart item quantity
 */
const updateCartItemValidator = Joi.object({
  quantity: Joi.number().integer().min(0).max(100).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 0',
    'number.max': 'Quantity cannot exceed 100',
    'any.required': 'Quantity is required',
  }),
});

/**
 * Validator for applying coupons
 */
const applyCouponValidator = Joi.object({
  couponCode: Joi.string().trim().min(3).max(50).required().messages({
    'string.base': 'Coupon code must be a string',
    'string.empty': 'Coupon code cannot be empty',
    'string.min': 'Coupon code must be at least 3 characters long',
    'string.max': 'Coupon code cannot exceed 50 characters',
    'any.required': 'Coupon code is required',
  }),
});

/**
 * Validator for merging carts
 */
const mergeCartsValidator = Joi.object({
  guestCartId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Guest cart ID must be a valid MongoDB ObjectId',
    }),

  sessionId: Joi.string().trim().min(10).max(128).optional().messages({
    'string.base': 'Session ID must be a string',
    'string.min': 'Session ID must be at least 10 characters long',
    'string.max': 'Session ID cannot exceed 128 characters',
  }),
})
  .or('guestCartId', 'sessionId')
  .messages({
    'object.missing': 'Either guest cart ID or session ID is required',
  });

/**
 * Validator for cart item parameters
 */
const cartItemParamsValidator = Joi.object({
  itemId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Item ID must be a valid MongoDB ObjectId',
      'any.required': 'Item ID is required',
    }),
});

module.exports = {
  addToCartValidator,
  updateCartItemValidator,
  applyCouponValidator,
  mergeCartsValidator,
  cartItemParamsValidator,
};
