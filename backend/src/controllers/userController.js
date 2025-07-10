const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError } = require('../utils/errors');

/**
 * Add a new address to the current user's profile
 */
const addAddress = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const addressData = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  await user.addAddress(addressData);

  ApiResponse.created(res, user.addresses, 'Address added successfully');
});

/**
 * Get all addresses for the current user
 */
const getAddresses = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId).select('addresses');
  if (!user) {
    throw new NotFoundError('User not found');
  }

  ApiResponse.success(res, user.addresses, 'Addresses retrieved successfully');
});

module.exports = {
  addAddress,
  getAddresses,
};
