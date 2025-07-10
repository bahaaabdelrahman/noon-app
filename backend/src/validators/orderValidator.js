const Joi = require('joi');

/**
 * Address schema for shipping and billing addresses
 */
const addressSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required',
  }),

  lastName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required',
  }),

  company: Joi.string().trim().max(100).optional().allow('').messages({
    'string.max': 'Company name cannot exceed 100 characters',
  }),

  addressLine1: Joi.string().trim().min(5).max(100).required().messages({
    'string.empty': 'Address line 1 is required',
    'string.min': 'Address line 1 must be at least 5 characters long',
    'string.max': 'Address line 1 cannot exceed 100 characters',
    'any.required': 'Address line 1 is required',
  }),

  addressLine2: Joi.string().trim().max(100).optional().allow('').messages({
    'string.max': 'Address line 2 cannot exceed 100 characters',
  }),

  city: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'City is required',
    'string.min': 'City must be at least 2 characters long',
    'string.max': 'City cannot exceed 50 characters',
    'any.required': 'City is required',
  }),

  state: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'State/Province is required',
    'string.min': 'State/Province must be at least 2 characters long',
    'string.max': 'State/Province cannot exceed 50 characters',
    'any.required': 'State/Province is required',
  }),

  postalCode: Joi.string().trim().min(3).max(20).required().messages({
    'string.empty': 'Postal code is required',
    'string.min': 'Postal code must be at least 3 characters long',
    'string.max': 'Postal code cannot exceed 20 characters',
    'any.required': 'Postal code is required',
  }),

  country: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Country is required',
    'string.min': 'Country must be at least 2 characters long',
    'string.max': 'Country cannot exceed 50 characters',
    'any.required': 'Country is required',
  }),

  phone: Joi.string().trim().min(10).max(20).optional().allow('').messages({
    'string.min': 'Phone number must be at least 10 characters long',
    'string.max': 'Phone number cannot exceed 20 characters',
  }),
});

/**
 * Validator for creating an order (checkout)
 */
const createOrderValidator = Joi.object({
  shippingAddressId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Shipping address ID must be a valid MongoDB ObjectId',
      'any.required': 'Shipping address ID is required',
    }),

  billingAddressId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Billing address ID must be a valid MongoDB ObjectId',
    }),

  useShippingAsBilling: Joi.boolean().default(true).messages({
    'boolean.base': 'Use shipping as billing must be a boolean value',
  }),

  paymentMethod: Joi.string()
    .valid(
      'credit_card',
      'debit_card',
      'paypal',
      'stripe',
      'bank_transfer',
      'cash_on_delivery'
    )
    .default('credit_card')
    .messages({
      'any.only': 'Invalid payment method',
    }),

  specialInstructions: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Special instructions cannot exceed 500 characters',
    }),
}).when(Joi.object({ useShippingAsBilling: Joi.valid(false) }).unknown(), {
  then: Joi.object({
    billingAddressId: Joi.required().messages({
      'any.required':
        'Billing address ID is required when not using shipping address for billing.',
    }),
  }),
});

/**
 * Validator for updating order status
 */
const updateOrderStatusValidator = Joi.object({
  status: Joi.string()
    .valid(
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'returned',
      'refunded'
    )
    .required()
    .messages({
      'any.only': 'Invalid order status',
      'any.required': 'Status is required',
    }),

  reason: Joi.string().trim().max(200).optional().allow('').messages({
    'string.max': 'Reason cannot exceed 200 characters',
  }),
});

/**
 * Validator for cancelling an order
 */
const cancelOrderValidator = Joi.object({
  reason: Joi.string().trim().min(5).max(200).required().messages({
    'string.empty': 'Cancellation reason is required',
    'string.min': 'Reason must be at least 5 characters long',
    'string.max': 'Reason cannot exceed 200 characters',
    'any.required': 'Cancellation reason is required',
  }),
});

/**
 * Validator for requesting a refund
 */
const requestRefundValidator = Joi.object({
  reason: Joi.string().trim().min(10).max(500).required().messages({
    'string.empty': 'Refund reason is required',
    'string.min': 'Reason must be at least 10 characters long',
    'string.max': 'Reason cannot exceed 500 characters',
    'any.required': 'Refund reason is required',
  }),
});

/**
 * Validator for updating payment status
 */
const updatePaymentStatusValidator = Joi.object({
  status: Joi.string()
    .valid(
      'pending',
      'paid',
      'failed',
      'cancelled',
      'refunded',
      'partially_refunded'
    )
    .required()
    .messages({
      'any.only': 'Invalid payment status',
      'any.required': 'Payment status is required',
    }),

  transactionId: Joi.string().trim().min(5).max(100).optional().messages({
    'string.min': 'Transaction ID must be at least 5 characters long',
    'string.max': 'Transaction ID cannot exceed 100 characters',
  }),
});

/**
 * Validator for order query parameters
 */
const orderQueryValidator = Joi.object({
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

  status: Joi.string()
    .valid(
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'returned',
      'refunded'
    )
    .optional()
    .messages({
      'any.only': 'Invalid order status filter',
    }),

  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'User ID must be a valid MongoDB ObjectId',
    }),

  orderNumber: Joi.string().trim().min(3).max(50).optional().messages({
    'string.min': 'Order number must be at least 3 characters long',
    'string.max': 'Order number cannot exceed 50 characters',
  }),
});

/**
 * Validator for date range queries
 */
const dateRangeValidator = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
    'date.base': 'Start date must be a valid date',
  }),

  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
    'date.base': 'End date must be a valid date',
    'date.min': 'End date must be after start date',
  }),
});

/**
 * Validator for adding tracking information
 */
const addTrackingInfoValidator = Joi.object({
  carrier: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Carrier is required',
    'string.min': 'Carrier must be at least 2 characters long',
    'string.max': 'Carrier cannot exceed 50 characters',
    'any.required': 'Carrier is required',
  }),

  trackingNumber: Joi.string().trim().min(5).max(50).required().messages({
    'string.empty': 'Tracking number is required',
    'string.min': 'Tracking number must be at least 5 characters long',
    'string.max': 'Tracking number cannot exceed 50 characters',
    'any.required': 'Tracking number is required',
  }),

  estimatedDelivery: Joi.date().iso().min('now').optional().messages({
    'date.format': 'Estimated delivery must be in ISO format (YYYY-MM-DD)',
    'date.base': 'Estimated delivery must be a valid date',
    'date.min': 'Estimated delivery must be in the future',
  }),
});

/**
 * Validator for order ID parameters
 */
const orderIdValidator = Joi.object({
  id: Joi.alternatives()
    .try(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId
      Joi.string().pattern(/^ORD-\d+-[A-Z0-9]{5}$/) // Order Number format
    )
    .required()
    .messages({
      'alternatives.match': 'Invalid order ID or order number format',
      'any.required': 'Order ID is required',
    }),
});

module.exports = {
  createOrderValidator,
  updateOrderStatusValidator,
  cancelOrderValidator,
  requestRefundValidator,
  updatePaymentStatusValidator,
  orderQueryValidator,
  dateRangeValidator,
  addTrackingInfoValidator,
  orderIdValidator,
  addressSchema,
};
