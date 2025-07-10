const Cart = require('../models/Cart');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../utils/errors');
const ApiResponse = require('../utils/apiResponse');

/**
 * Get user's cart or create if doesn't exist
 */
const getCart = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  let sessionId = req.sessionID || req.headers['x-session-id'];

  // For guest users without session ID, generate a temporary one
  if (!userId && !sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const cart = await Cart.findOrCreateCart(userId, sessionId);

  // Populate cart with product details
  await cart.populate({
    path: 'items.product',
    select: 'name slug pricing inventory images sku status visibility',
  });

  // Remove invalid items (deleted products, inactive products)
  const validItems = cart.items.filter(
    item =>
      item.product &&
      item.product.status === 'active' &&
      item.product.visibility === 'public'
  );

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  ApiResponse.success(res, cart, 'Cart retrieved successfully');
});

/**
 * Add item to cart
 */
const addToCart = catchAsync(async (req, res) => {
  const { productId, quantity = 1, selectedVariants = [] } = req.body;
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'];

  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }

  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID is required', 400);
  }

  // Validate quantity
  if (quantity < 1 || quantity > 100) {
    throw new AppError('Quantity must be between 1 and 100', 400);
  }

  // Find or create cart
  const cart = await Cart.findOrCreateCart(userId, sessionId);

  // Add item to cart
  await cart.addItem(productId, quantity, selectedVariants);

  // Populate cart with product details
  await cart.populate({
    path: 'items.product',
    select: 'name slug pricing inventory images sku',
  });

  ApiResponse.success(res, cart, 'Item added to cart successfully');
});

/**
 * Update cart item quantity
 */
const updateCartItem = catchAsync(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'];

  if (!itemId) {
    throw new AppError('Item ID is required', 400);
  }

  if (quantity === undefined || quantity < 0) {
    throw new AppError('Valid quantity is required', 400);
  }

  // Find user's cart
  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId, status: 'active' });
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId: sessionId, status: 'active' });
  }

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // Update item quantity
  await cart.updateItemQuantity(itemId, quantity);

  // Populate cart with product details
  await cart.populate({
    path: 'items.product',
    select: 'name slug pricing inventory images sku',
  });

  ApiResponse.success(res, cart, 'Cart item updated successfully');
});

/**
 * Remove item from cart
 */
const removeFromCart = catchAsync(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'];

  if (!itemId) {
    throw new AppError('Item ID is required', 400);
  }

  // Find user's cart
  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId, status: 'active' });
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId: sessionId, status: 'active' });
  }

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // Remove item from cart
  await cart.removeItem(itemId);

  // Populate cart with product details
  await cart.populate({
    path: 'items.product',
    select: 'name slug pricing inventory images sku',
  });

  ApiResponse.success(res, cart, 'Item removed from cart successfully');
});

/**
 * Clear entire cart
 */
const clearCart = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'];

  // Find user's cart
  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId, status: 'active' });
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId: sessionId, status: 'active' });
  }

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // Clear cart
  await cart.clearCart();

  ApiResponse.success(res, cart, 'Cart cleared successfully');
});

/**
 * Apply coupon to cart
 */
const applyCoupon = catchAsync(async (req, res) => {
  const { couponCode } = req.body;
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'];

  if (!couponCode) {
    throw new AppError('Coupon code is required', 400);
  }

  // Find user's cart
  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId, status: 'active' });
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId: sessionId, status: 'active' });
  }

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  if (cart.isEmpty) {
    throw new AppError('Cannot apply coupon to empty cart', 400);
  }

  // TODO: Implement coupon validation with Coupon model
  // For now, we'll use hardcoded coupons for testing
  const testCoupons = {
    SAVE10: { discount: 10, type: 'percentage' },
    SAVE20: { discount: 20, type: 'fixed' },
    WELCOME: { discount: 15, type: 'percentage' },
  };

  const coupon = testCoupons[couponCode.toUpperCase()];
  if (!coupon) {
    throw new AppError('Invalid coupon code', 400);
  }

  // Apply coupon to cart
  await cart.applyCoupon(
    couponCode.toUpperCase(),
    coupon.discount,
    coupon.type
  );

  // Populate cart with product details
  await cart.populate({
    path: 'items.product',
    select: 'name slug pricing inventory images sku',
  });

  ApiResponse.success(res, cart, 'Coupon applied successfully');
});

/**
 * Remove coupon from cart
 */
const removeCoupon = catchAsync(async (req, res) => {
  const { couponCode } = req.body;
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'];

  if (!couponCode) {
    throw new AppError('Coupon code is required', 400);
  }

  // Find user's cart
  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId, status: 'active' });
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId: sessionId, status: 'active' });
  }

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // Remove coupon
  cart.appliedCoupons = cart.appliedCoupons.filter(
    c => c.code !== couponCode.toUpperCase()
  );
  cart.markModified('appliedCoupons');
  await cart.save();

  // Populate cart with product details
  await cart.populate({
    path: 'items.product',
    select: 'name slug pricing inventory images sku',
  });

  ApiResponse.success(res, cart, 'Coupon removed successfully');
});

/**
 * Merge guest cart with user cart (called when user logs in)
 */
const mergeCart = catchAsync(async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.id;

  if (!sessionId) {
    throw new AppError('Session ID is required', 400);
  }

  const cart = await Cart.mergeGuestCart(userId, sessionId);

  // Populate cart with product details
  await cart.populate({
    path: 'items.product',
    select: 'name slug pricing inventory images sku',
  });

  ApiResponse.success(res, cart, 'Carts merged successfully');
});

/**
 * Get cart summary (item count, total)
 */
const getCartSummary = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'];

  if (!userId && !sessionId) {
    return res.status(200).json(ApiResponse.success({
        itemCount: 0,
        total: 0,
        isEmpty: true,
      }, 'Cart summary retrieved successfully'));
  }

  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId, status: 'active' });
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId: sessionId, status: 'active' });
  }

  if (!cart) {
    return res.status(200).json(ApiResponse.success({
        itemCount: 0,
        total: 0,
        isEmpty: true,
      }, 'Cart summary retrieved successfully'));
  }

  res.status(200).json(ApiResponse.success({
      itemCount: cart.itemCount,
      total: cart.total,
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      discount: cart.discount,
      isEmpty: cart.isEmpty,
      currency: cart.currency,
    }, 'Cart summary retrieved successfully'));
});

/**
 * Validate cart before checkout
 */
const validateCart = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const sessionId = req.sessionID || req.headers['x-session-id'];

  if (!userId && !sessionId) {
    throw new AppError('User ID or session ID is required', 400);
  }

  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId, status: 'active' }).populate({
      path: 'items.product',
      select: 'name pricing inventory status visibility',
    });
  } else if (sessionId) {
    cart = await Cart.findOne({
      sessionId: sessionId,
      status: 'active',
    }).populate({
      path: 'items.product',
      select: 'name pricing inventory status visibility',
    });
  }

  if (!cart || cart.isEmpty) {
    throw new AppError('Cart is empty', 400);
  }

  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Validate each item
  for (const item of cart.items) {
    const product = item.product;

    // Check if product exists and is available
    if (!product) {
      validation.isValid = false;
      validation.errors.push(`Product in cart no longer exists`);
      continue;
    }

    if (product.status !== 'active' || product.visibility !== 'public') {
      validation.isValid = false;
      validation.errors.push(`${product.name} is no longer available`);
      continue;
    }

    // Check stock availability
    if (
      product.inventory.trackQuantity &&
      product.inventory.quantity < item.quantity
    ) {
      validation.isValid = false;
      validation.errors.push(
        `${product.name}: Only ${product.inventory.quantity} items available, but ${item.quantity} requested`
      );
      continue;
    }

    // Check if price has changed
    if (Math.abs(item.unitPrice - product.pricing.price) > 0.01) {
      validation.warnings.push(
        `${product.name}: Price has changed from $${item.unitPrice} to $${product.pricing.price}`
      );
    }

    // Check for low stock
    if (
      product.inventory.trackQuantity &&
      product.inventory.quantity <= product.inventory.lowStockThreshold
    ) {
      validation.warnings.push(`${product.name} is running low on stock`);
    }
  }

  ApiResponse.success(res, { cart, validation }, 'Cart validation completed');
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  mergeCart,
  getCartSummary,
  validateCart,
};
