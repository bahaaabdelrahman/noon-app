const Joi = require('joi');

/**
 * User registration validation schema
 */
const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
  }),

  lastName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
  }),

  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
      )
    )
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),

  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'string.empty': 'Password confirmation is required',
  }),

  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),
});

/**
 * User login validation schema
 */
const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  }),

  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),

  rememberMe: Joi.boolean().optional(),
});

/**
 * Forgot password validation schema
 */
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  }),
});

/**
 * Reset password validation schema
 */
const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required',
  }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
      )
    )
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),

  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'string.empty': 'Password confirmation is required',
  }),
});

/**
 * Change password validation schema
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
  }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
      )
    )
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base':
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),

  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'New passwords do not match',
      'string.empty': 'New password confirmation is required',
    }),
});

/**
 * Update profile validation schema
 */
const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
  }),

  lastName: Joi.string().trim().min(2).max(50).optional().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
  }),

  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),

  preferences: Joi.object({
    newsletter: Joi.boolean().optional(),
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
    }).optional(),
    currency: Joi.string().valid('USD', 'EUR', 'GBP').optional(),
    language: Joi.string().valid('en', 'es', 'fr', 'de').optional(),
  }).optional(),
});

/**
 * Address validation schema
 */
const addressSchema = Joi.object({
  type: Joi.string().valid('home', 'work', 'other').default('home').messages({
    'any.only': 'Address type must be home, work, or other',
  }),

  street: Joi.string().trim().required().messages({
    'string.empty': 'Street address is required',
  }),

  city: Joi.string().trim().required().messages({
    'string.empty': 'City is required',
  }),

  state: Joi.string().trim().required().messages({
    'string.empty': 'State is required',
  }),

  zipCode: Joi.string().trim().required().messages({
    'string.empty': 'ZIP code is required',
  }),

  country: Joi.string().trim().default('USA').messages({
    'string.empty': 'Country is required',
  }),

  phone: Joi.string()
    .pattern(/^\+?[\d\s-()]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),

  isDefault: Joi.boolean().default(false),
});

/**
 * Refresh token validation schema
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required',
  }),
});

/**
 * Email verification validation schema
 */
const emailVerificationSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Verification token is required',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  addressSchema,
  refreshTokenSchema,
  emailVerificationSchema,
};
