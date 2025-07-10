const Joi = require('joi');

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

  isDefault: Joi.boolean().default(false).messages({
    'boolean.base': 'isDefault must be a boolean value',
  }),
});

const addAddressValidator = addressSchema;

const addressIdValidator = Joi.object({
  addressId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Address ID must be a valid MongoDB ObjectId',
      'any.required': 'Address ID is required',
    }),
});

module.exports = {
  addAddressValidator,
  addressIdValidator,
  addressSchema,
};
