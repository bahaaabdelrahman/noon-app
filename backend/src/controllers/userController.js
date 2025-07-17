const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * Get user profile
 */
const getProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new NotFoundError('User not found');
  }

  ApiResponse.success(res, user, 'Profile retrieved successfully');
});

/**
 * Update user profile
 */
const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;

  // Remove fields that shouldn't be updated via this endpoint
  delete updates.password;
  delete updates.email;
  delete updates.role;
  delete updates.addresses;

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    throw new NotFoundError('User not found');
  }

  ApiResponse.success(res, user, 'Profile updated successfully');
});

/**
 * Update user preferences
 */
const updatePreferences = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { preferences } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { preferences },
    {
      new: true,
      runValidators: true,
    }
  ).select('-password');

  if (!user) {
    throw new NotFoundError('User not found');
  }

  ApiResponse.success(res, user.preferences, 'Preferences updated successfully');
});

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

/**
 * Get a specific address by ID
 */
const getAddress = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { addressId } = req.params;

  const user = await User.findById(userId).select('addresses');
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  ApiResponse.success(res, address, 'Address retrieved successfully');
});

/**
 * Update a specific address
 */
const updateAddress = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { addressId } = req.params;
  const updates = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  // Update address fields
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      address[key] = updates[key];
    }
  });

  await user.save();

  ApiResponse.success(res, address, 'Address updated successfully');
});

/**
 * Delete a specific address
 */
const deleteAddress = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { addressId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  address.deleteOne();
  await user.save();

  ApiResponse.success(res, null, 'Address deleted successfully');
});

/**
 * Set an address as default
 */
const setDefaultAddress = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { addressId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  // Set all addresses to non-default
  user.addresses.forEach(addr => {
    addr.isDefault = false;
  });

  // Set the specified address as default
  address.isDefault = true;

  await user.save();

  ApiResponse.success(res, user.addresses, 'Default address set successfully');
});

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  addAddress,
  getAddresses,
  getAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
