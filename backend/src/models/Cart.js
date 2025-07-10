const mongoose = require('mongoose');

/**
 * Cart Item Schema
 * Represents individual items in a shopping cart
 */
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [100, 'Quantity cannot exceed 100'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    // Store selected variant options if applicable
    selectedVariants: [
      {
        name: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],
    // Additional product details for cart display
    productSnapshot: {
      name: String,
      slug: String,
      image: String,
      sku: String,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Shopping Cart Schema
 * Manages user shopping carts with items and calculations
 */
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return !this.sessionId; // Required if not a guest cart
      },
    },
    // For guest users - session-based cart
    sessionId: {
      type: String,
      required: function () {
        return !this.user; // Required if not a user cart
      },
    },
    items: [cartItemSchema],

    // Cart totals
    subtotal: {
      type: Number,
      default: 0,
      min: [0, 'Subtotal cannot be negative'],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    shipping: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    total: {
      type: Number,
      default: 0,
      min: [0, 'Total cannot be negative'],
    },

    // Applied coupons/discounts
    appliedCoupons: [
      {
        code: String,
        discount: Number,
        type: {
          type: String,
          enum: ['percentage', 'fixed'],
          default: 'percentage',
        },
      },
    ],

    // Cart status
    status: {
      type: String,
      enum: ['active', 'abandoned', 'converted'],
      default: 'active',
    },

    // Expiration for guest carts
    expiresAt: {
      type: Date,
      default: function () {
        // Guest carts expire in 7 days, user carts in 30 days
        const days = this.user ? 30 : 7;
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      },
    },

    // Metadata
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ status: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired carts

// Virtual for item count
cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual to check if cart is empty
cartSchema.virtual('isEmpty').get(function () {
  return this.items.length === 0;
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function (next) {
  this.calculateTotals();
  next();
});

// Instance method to calculate cart totals
cartSchema.methods.calculateTotals = function () {
  // Calculate subtotal
  this.subtotal = this.items.reduce(
    (total, item) => total + item.totalPrice,
    0
  );

  // Calculate tax (assuming 10% tax rate - this should be configurable)
  const taxRate = process.env.TAX_RATE || 0.1;
  this.tax = this.subtotal * taxRate;

  // Calculate shipping (free shipping over $100)
  const freeShippingThreshold = process.env.FREE_SHIPPING_THRESHOLD || 100;
  this.shipping = this.subtotal >= freeShippingThreshold ? 0 : 10;

  // Apply discount from coupons
  this.discount = this.appliedCoupons.reduce((total, coupon) => {
    if (coupon.type === 'percentage') {
      return total + (this.subtotal * coupon.discount) / 100;
    } else {
      return total + coupon.discount;
    }
  }, 0);

  // Calculate final total
  this.total = Math.max(
    0,
    this.subtotal + this.tax + this.shipping - this.discount
  );
};

// Instance method to add item to cart
cartSchema.methods.addItem = async function (
  productId,
  quantity,
  selectedVariants = []
) {
  const Product = mongoose.model('Product');
    const product = await Product.findById(productId).select(
    'name slug pricing inventory images sku status visibility'
  );

  if (!product) {
    throw new Error('Product not found');
  }

  // Check if product is active and available
  if (product.status !== 'active' || product.visibility !== 'public') {
    throw new Error('Product is not available');
  }

  // Check stock availability
  if (
    product.inventory.trackQuantity &&
    product.inventory.quantity < quantity
  ) {
    throw new Error('Insufficient stock available');
  }

  // Check if item already exists in cart
  const existingItemIndex = this.items.findIndex(
    item =>
      item.product.toString() === productId.toString() &&
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
  );

  const unitPrice = product.pricing.price;

  if (existingItemIndex > -1) {
    // Update existing item
    const newQuantity = this.items[existingItemIndex].quantity + quantity;

    // Check quantity limits
    if (newQuantity > 100) {
      throw new Error('Maximum quantity per item is 100');
    }

    // Check stock for new quantity
    if (
      product.inventory.trackQuantity &&
      product.inventory.quantity < newQuantity
    ) {
      throw new Error('Insufficient stock for requested quantity');
    }

    this.items[existingItemIndex].quantity = newQuantity;
    this.items[existingItemIndex].totalPrice = unitPrice * newQuantity;
  } else {
    // Add new item
    const newItem = {
      product: productId,
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: unitPrice * quantity,
      selectedVariants: selectedVariants,
      productSnapshot: {
        name: product.name,
        slug: product.slug,
        image:
          product.images.find(img => img.isPrimary)?.url ||
          product.images[0]?.url,
        sku: product.sku,
      },
    };

    this.items.push(newItem);
  }

  this.markModified('items');
  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function (itemId) {
  this.items.id(itemId).deleteOne();
  this.markModified('items');
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = async function (itemId, newQuantity) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Item not found in cart');
  }

  if (newQuantity <= 0) {
    return this.removeItem(itemId);
  }

  if (newQuantity > 100) {
    throw new Error('Maximum quantity per item is 100');
  }

  // Check stock availability
  const Product = mongoose.model('Product');
  const product = await Product.findById(item.product);

  if (
    product &&
    product.inventory.trackQuantity &&
    product.inventory.quantity < newQuantity
  ) {
    throw new Error('Insufficient stock for requested quantity');
  }

  item.quantity = newQuantity;
  item.totalPrice = item.unitPrice * newQuantity;

  this.markModified('items');
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  this.appliedCoupons = [];
  this.markModified('items');
  this.markModified('appliedCoupons');
  return this.save();
};

// Instance method to apply coupon
cartSchema.methods.applyCoupon = function (
  couponCode,
  discount,
  type = 'percentage'
) {
  // Check if coupon already applied
  const existingCoupon = this.appliedCoupons.find(c => c.code === couponCode);
  if (existingCoupon) {
    throw new Error('Coupon already applied');
  }

  this.appliedCoupons.push({
    code: couponCode,
    discount: discount,
    type: type,
  });

  this.markModified('appliedCoupons');
  return this.save();
};

// Static method to find or create cart
cartSchema.statics.findOrCreateCart = async function (userId, sessionId) {
  let cart;

  if (userId) {
    cart = await this.findOne({ user: userId, status: 'active' });
    if (!cart) {
      cart = new this({ user: userId });
      await cart.save();
    }
  } else if (sessionId) {
    cart = await this.findOne({ sessionId: sessionId, status: 'active' });
    if (!cart) {
      cart = new this({ sessionId: sessionId });
      await cart.save();
    }
  } else {
    throw new Error('Either userId or sessionId is required');
  }

  return cart;
};

// Static method to merge guest cart with user cart
cartSchema.statics.mergeGuestCart = async function (userId, sessionId) {
  const userCart = await this.findOne({ user: userId, status: 'active' });
  const guestCart = await this.findOne({
    sessionId: sessionId,
    status: 'active',
  });

  if (!guestCart) {
    return userCart || new this({ user: userId });
  }

  if (!userCart) {
    // Convert guest cart to user cart
    guestCart.user = userId;
    guestCart.sessionId = undefined;
    return guestCart.save();
  }

  // Merge guest cart items into user cart
  for (const guestItem of guestCart.items) {
    await userCart.addItem(
      guestItem.product,
      guestItem.quantity,
      guestItem.selectedVariants
    );
  }

  // Delete guest cart
  await this.findByIdAndDelete(guestCart._id);

  return userCart;
};

// Ensure virtual fields are serialized
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
