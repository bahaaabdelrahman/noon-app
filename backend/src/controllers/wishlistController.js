const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../utils/errors');

/**
 * Get user's wishlists
 */
const getUserWishlists = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { includeItems = false } = req.query;

  const wishlists = await Wishlist.getUserWishlists(userId, {
    includeItems: includeItems === 'true',
  });

  res.status(200).json({
    success: true,
    count: wishlists.length,
    data: wishlists,
    message: 'Wishlists retrieved successfully',
  });
});

/**
 * Get a specific wishlist
 */
const getWishlist = catchAsync(async (req, res) => {
  const { wishlistId } = req.params;
  const userId = req.user.id;

  const wishlist = await Wishlist.findOne({
    _id: wishlistId,
    user: userId,
  }).populate(
    'items.product',
    'name slug images pricing.price status inventory.quantity'
  );

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  res.status(200).json({
    success: true,
    data: wishlist,
    message: 'Wishlist retrieved successfully',
  });
});

/**
 * Create a new wishlist
 */
const createWishlist = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { name, description, privacy, tags } = req.body;

  const wishlist = await Wishlist.create({
    user: userId,
    name,
    description,
    privacy,
    tags,
  });

  res.status(201).json({
    success: true,
    data: wishlist,
    message: 'Wishlist created successfully',
  });
});

/**
 * Update a wishlist
 */
const updateWishlist = catchAsync(async (req, res) => {
  const { wishlistId } = req.params;
  const userId = req.user.id;
  const { name, description, privacy, tags } = req.body;

  const wishlist = await Wishlist.findOne({ _id: wishlistId, user: userId });

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  // Update fields
  if (name !== undefined) wishlist.name = name;
  if (description !== undefined) wishlist.description = description;
  if (privacy !== undefined) wishlist.privacy = privacy;
  if (tags !== undefined) wishlist.tags = tags;

  await wishlist.save();

  res.status(200).json({
    success: true,
    data: wishlist,
    message: 'Wishlist updated successfully',
  });
});

/**
 * Delete a wishlist
 */
const deleteWishlist = catchAsync(async (req, res) => {
  const { wishlistId } = req.params;
  const userId = req.user.id;

  const wishlist = await Wishlist.findOne({ _id: wishlistId, user: userId });

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  if (wishlist.isDefault) {
    throw new AppError('Cannot delete default wishlist', 400);
  }

  await Wishlist.deleteOne({ _id: wishlistId });

  res.status(200).json({
    success: true,
    message: 'Wishlist deleted successfully',
  });
});

/**
 * Add product to wishlist
 */
const addToWishlist = catchAsync(async (req, res) => {
  const { wishlistId } = req.params;
  const { productId } = req.params;
  const userId = req.user.id;
  const { notes, priority } = req.body;

  // Find wishlist or use default
  let wishlist;
  if (wishlistId === 'default') {
    wishlist = await Wishlist.findOrCreateDefault(userId);
  } else {
    wishlist = await Wishlist.findOne({ _id: wishlistId, user: userId });
  }

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Add product to wishlist
  const addedItem = wishlist.addProduct(productId, { notes, priority });
  await wishlist.save();

  // Populate the added item
  await wishlist.populate(
    'items.product',
    'name slug images pricing.price status'
  );

  res.status(200).json({
    success: true,
    data: {
      wishlist,
      addedItem,
    },
    message: 'Product added to wishlist successfully',
  });
});

/**
 * Remove product from wishlist
 */
const removeFromWishlist = catchAsync(async (req, res) => {
  const { wishlistId, productId } = req.params;
  const userId = req.user.id;

  // Find wishlist
  let wishlist;
  if (wishlistId === 'default') {
    wishlist = await Wishlist.findOrCreateDefault(userId);
  } else {
    wishlist = await Wishlist.findOne({ _id: wishlistId, user: userId });
  }

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  // Remove product from wishlist
  const removed = wishlist.removeProduct(productId);
  if (!removed) {
    throw new AppError('Product not found in wishlist', 404);
  }

  await wishlist.save();

  res.status(200).json({
    success: true,
    data: wishlist,
    message: 'Product removed from wishlist successfully',
  });
});

/**
 * Clear all items from wishlist
 */
const clearWishlist = catchAsync(async (req, res) => {
  const { wishlistId } = req.params;
  const userId = req.user.id;

  const wishlist = await Wishlist.findOne({ _id: wishlistId, user: userId });

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  wishlist.clearItems();
  await wishlist.save();

  res.status(200).json({
    success: true,
    data: wishlist,
    message: 'Wishlist cleared successfully',
  });
});

/**
 * Move items to cart
 */
const moveToCart = catchAsync(async (req, res) => {
  const { wishlistId } = req.params;
  const userId = req.user.id;
  const { productIds, clearAfterMove = false } = req.body;

  const wishlist = await Wishlist.findOne({
    _id: wishlistId,
    user: userId,
  }).populate('items.product');

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  // Get cart service (assuming it exists)
  const Cart = require('../models/Cart');
  const cart = await Cart.findOrCreateForUser(userId);

  const movedItems = [];
  const failedItems = [];

  // Process specified products or all items
  const itemsToMove = productIds
    ? wishlist.items.filter(item =>
        productIds.includes(item.product._id.toString())
      )
    : wishlist.items;

  for (const item of itemsToMove) {
    try {
      // Add to cart (assuming cart has addItem method)
      await cart.addItem(item.product._id, 1);
      movedItems.push(item);

      if (clearAfterMove) {
        wishlist.removeProduct(item.product._id);
      }
    } catch (error) {
      failedItems.push({
        product: item.product,
        error: error.message,
      });
    }
  }

  if (clearAfterMove) {
    await wishlist.save();
  }

  res.status(200).json({
    success: true,
    data: {
      movedItems: movedItems.length,
      failedItems: failedItems.length,
      failures: failedItems,
      wishlist,
    },
    message: `${movedItems.length} items moved to cart successfully`,
  });
});

/**
 * Share wishlist
 */
const shareWishlist = catchAsync(async (req, res) => {
  const { wishlistId } = req.params;
  const userId = req.user.id;
  const { emails, permissions = 'view' } = req.body;

  const wishlist = await Wishlist.findOne({ _id: wishlistId, user: userId });

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  // Generate share token if not exists
  if (!wishlist.shareToken) {
    wishlist.generateShareToken();
  }

  // Add emails to shared list
  if (emails && emails.length > 0) {
    emails.forEach(email => {
      const existingShare = wishlist.sharedWith.find(
        share => share.email === email
      );
      if (!existingShare) {
        wishlist.sharedWith.push({ email, permissions });
      }
    });
  }

  // Update privacy to shared
  wishlist.privacy = 'shared';
  await wishlist.save();

  res.status(200).json({
    success: true,
    data: {
      shareUrl: wishlist.shareUrl,
      shareToken: wishlist.shareToken,
      sharedWith: wishlist.sharedWith,
    },
    message: 'Wishlist shared successfully',
  });
});

/**
 * Get shared wishlist (public access)
 */
const getSharedWishlist = catchAsync(async (req, res) => {
  const { shareToken } = req.params;

  const wishlist = await Wishlist.findByShareToken(shareToken);

  if (!wishlist) {
    throw new AppError('Shared wishlist not found or no longer available', 404);
  }

  res.status(200).json({
    success: true,
    data: wishlist,
    message: 'Shared wishlist retrieved successfully',
  });
});

module.exports = {
  getUserWishlists,
  getWishlist,
  createWishlist,
  updateWishlist,
  deleteWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart,
  shareWishlist,
  getSharedWishlist,
};
