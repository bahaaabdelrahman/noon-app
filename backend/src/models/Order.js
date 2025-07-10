const mongoose = require('mongoose');
const {
  CURRENCY_CODES,
  ORDER_STATUS,
  PAYMENT_STATUS,
  FULFILLMENT_STATUS,
} = require('../config/constants');

/**
 * Order Item Schema for products in an order
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productSnapshot: {
      name: { type: String, required: true },
      slug: { type: String, required: true },
      sku: { type: String, required: true },
      image: { type: String },
      brand: { type: String },
      category: { type: String },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    selectedVariants: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: Object.values(FULFILLMENT_STATUS),
      default: FULFILLMENT_STATUS.PENDING,
    },
    trackingInfo: {
      carrier: String,
      trackingNumber: String,
      trackingUrl: String,
      estimatedDelivery: Date,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Shipping Address Schema
 */
const shippingAddressSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  company: { type: String, trim: true },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  isDefault: { type: Boolean, default: false },
});

/**
 * Payment Information Schema
 */
const paymentInfoSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      enum: [
        'credit_card',
        'debit_card',
        'paypal',
        'stripe',
        'bank_transfer',
        'cash_on_delivery',
      ],
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    transactionId: String,
    paymentGateway: String,
    paidAt: Date,
    failedAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    currency: {
      type: String,
      enum: Object.values(CURRENCY_CODES),
      default: CURRENCY_CODES.USD,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Order Schema
 */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userSnapshot: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
    },
    items: [orderItemSchema],
    totals: {
      subtotal: { type: Number, required: true, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      shipping: { type: Number, default: 0, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    currency: {
      type: String,
      enum: Object.values(CURRENCY_CODES),
      default: CURRENCY_CODES.USD,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    shippingAddress: shippingAddressSchema,
    billingAddress: shippingAddressSchema,
    paymentInfo: paymentInfoSchema,
    appliedCoupons: [
      {
        code: String,
        discount: Number,
        type: { type: String, enum: ['percentage', 'fixed'] },
      },
    ],
    notes: String,
    specialInstructions: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    refundRequested: { type: Boolean, default: false },
    refundReason: String,
    tags: [String],
    metadata: {
      source: { type: String, default: 'web' }, // web, mobile, api
      ipAddress: String,
      userAgent: String,
      affiliateCode: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'paymentInfo.status': 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for total item count
orderSchema.virtual('itemCount').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for order status display
orderSchema.virtual('statusDisplay').get(function () {
  return (
    this.status.charAt(0).toUpperCase() + this.status.slice(1).replace('_', ' ')
  );
});

// Virtual for full customer name
orderSchema.virtual('customerName').get(function () {
  return `${this.userSnapshot.firstName} ${this.userSnapshot.lastName}`.trim();
});

// Virtual for shipping address full
orderSchema.virtual('shippingAddressFull').get(function () {
  if (!this.shippingAddress) return '';
  const addr = this.shippingAddress;
  return `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
});

// Virtual for days since order
orderSchema.virtual('daysSinceOrder').get(function () {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const prefix = 'ORD';
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.orderNumber = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

// Instance methods
orderSchema.methods.canBeCancelled = function () {
  return [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
  ].includes(this.status);
};

orderSchema.methods.canBeRefunded = function () {
  return (
    [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED].includes(this.status) &&
    this.paymentInfo.status === PAYMENT_STATUS.PAID
  );
};

orderSchema.methods.updateStatus = function (newStatus, reason = null) {
  this.status = newStatus;

  if (newStatus === ORDER_STATUS.CANCELLED) {
    this.cancelledAt = new Date();
    if (reason) this.cancelReason = reason;
  } else if (newStatus === ORDER_STATUS.DELIVERED) {
    this.deliveredAt = new Date();
  }

  return this.save();
};

orderSchema.methods.updatePaymentStatus = function (
  status,
  transactionId = null
) {
  this.paymentInfo.status = status;

  if (status === PAYMENT_STATUS.PAID) {
    this.paymentInfo.paidAt = new Date();
    if (transactionId) this.paymentInfo.transactionId = transactionId;
  } else if (status === PAYMENT_STATUS.FAILED) {
    this.paymentInfo.failedAt = new Date();
  } else if (status === PAYMENT_STATUS.REFUNDED) {
    this.paymentInfo.refundedAt = new Date();
  }

  return this.save();
};

orderSchema.methods.calculateTotals = function () {
  this.totals.subtotal = this.items.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  // Calculate tax (10% for now)
  this.totals.tax = this.totals.subtotal * 0.1;

  // Calculate shipping (free over $100)
  this.totals.shipping = this.totals.subtotal >= 100 ? 0 : 10;

  // Apply discounts
  let discount = 0;
  this.appliedCoupons.forEach(coupon => {
    if (coupon.type === 'percentage') {
      discount += (this.totals.subtotal * coupon.discount) / 100;
    } else {
      discount += coupon.discount;
    }
  });
  this.totals.discount = discount;

  // Calculate final total
  this.totals.total =
    this.totals.subtotal +
    this.totals.tax +
    this.totals.shipping -
    this.totals.discount;
};

// Static methods
orderSchema.statics.findByOrderNumber = function (orderNumber) {
  return this.findOne({ orderNumber }).populate(
    'user',
    'firstName lastName email'
  );
};

orderSchema.statics.findUserOrders = function (userId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;

  let query = { user: userId };
  if (status) query.status = status;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'firstName lastName email');
};

orderSchema.statics.getOrderStats = function (startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totals.total' },
        avgOrderValue: { $avg: '$totals.total' },
      },
    },
  ]);
};

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
