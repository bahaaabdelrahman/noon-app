const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const { AppError, NotFoundError, ValidationError } = require('../utils/errors');
const ApiResponse = require('../utils/apiResponse');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

/**
 * Create order from cart (checkout)
 */
const createOrder = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const {
    shippingAddressId,
    billingAddressId,
    paymentMethod = 'credit_card',
    specialInstructions,
    useShippingAsBilling = true,
  } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const shippingAddress = user.addresses.id(shippingAddressId);
  if (!shippingAddress) {
    throw new ValidationError('Invalid shipping address ID');
  }

  let billingAddress;
  if (useShippingAsBilling) {
    billingAddress = shippingAddress;
  } else {
    billingAddress = user.addresses.id(billingAddressId);
    if (!billingAddress) {
      throw new ValidationError('Invalid billing address ID');
    }
  }

  // Get user's cart
  const cart = await Cart.findOne({ user: userId, status: 'active' }).populate(
    'items.product'
  );

  if (!cart || cart.items.length === 0) {
    throw new ValidationError('Cart is empty');
  }

  // Validate cart items and stock
  for (const item of cart.items) {
    if (!item.product) {
      throw new ValidationError(
        `Product ${item.productSnapshot.name} is no longer available`
      );
    }

    if (item.product.status !== 'active') {
      throw new ValidationError(
        `Product ${item.product.name} is not available`
      );
    }

    if (
      item.product.inventory.trackQuantity &&
      item.product.inventory.quantity < item.quantity
    ) {
      throw new ValidationError(
        `Insufficient stock for ${item.product.name}. Available: ${item.product.inventory.quantity}`
      );
    }
  }



  // Prepare order items
  const orderItems = cart.items.map(item => ({
    product: item.product._id,
    productSnapshot: {
      name: item.product.name,
      slug: item.product.slug,
      sku: item.product.sku,
      image: item.product.images?.[0]?.url || null,
      brand: item.product.brand,
      category: item.product.category?.name || '',
    },
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    selectedVariants: item.selectedVariants || [],
  }));

  // Create order
  const order = new Order({
    user: userId,
    userSnapshot: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.profile?.phone || '',
    },
    items: orderItems,
    totals: cart.totals,
    shippingAddress,
    billingAddress: useShippingAsBilling ? shippingAddress : billingAddress,
    paymentInfo: {
      method: paymentMethod,
      status: PAYMENT_STATUS.PENDING,
    },
    appliedCoupons: cart.appliedCoupons || [],
    specialInstructions,
    metadata: {
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  // Calculate totals (in case cart totals are outdated)
  order.calculateTotals();

  await order.save();

  // Update product inventory
  for (const item of cart.items) {
    if (item.product.inventory.trackQuantity) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { 'inventory.quantity': -item.quantity },
      });
    }
  }

  // Clear the cart
  await Cart.findByIdAndUpdate(cart._id, {
    items: [],
    totals: { subtotal: 0, tax: 0, shipping: 10, discount: 0, total: 10 },
    status: 'completed',
  });

  // Populate order for response
  await order.populate('user', 'firstName lastName email');

  ApiResponse.created(res, order, 'Order created successfully');
});

/**
 * Get all orders for current user
 */
const getUserOrders = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;

  const orders = await Order.findUserOrders(userId, {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
  });

  const totalOrders = await Order.countDocuments({
    user: userId,
    ...(status && { status }),
  });

  res.status(200).json(ApiResponse.success({ 
    count: orders.length,
    total: totalOrders,
    data: orders,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / parseInt(limit)),
      totalItems: totalOrders,
      itemsPerPage: parseInt(limit),
      hasNext: page * limit < totalOrders,
      hasPrev: page > 1,
    }
  }, 'Orders retrieved successfully'));
});

/**
 * Get single order by ID or order number
 */
const getOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

  let order;

  // Check if id is an order number (format: ORD-timestamp-random)
  if (id.startsWith('ORD-')) {
    order = await Order.findByOrderNumber(id);
  } else {
    order = await Order.findById(id).populate(
      'user',
      'firstName lastName email'
    );
  }

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check authorization (user can only see their own orders unless admin)
    if (!isAdmin && (!order.user || order.user.toString() !== userId)) {
    throw new NotFoundError('Order not found');
  }

  res.status(200).json(ApiResponse.success(order, 'Order retrieved successfully'));
});

/**
 * Update order status (admin only)
 */
const updateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw new ValidationError('Invalid order status');
  }

  await order.updateStatus(status, reason);

  res.status(200).json(ApiResponse.success(order, 'Order status updated successfully'));
});

/**
 * Cancel order
 */
const cancelOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

  const order = await Order.findById(id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check authorization
  if (!isAdmin && (!order.user || order.user.toString() !== userId)) {
    throw new NotFoundError('Order not found');
  }

  if (!order.canBeCancelled()) {
    throw new ValidationError(
      'Order cannot be cancelled in its current status'
    );
  }

  // Restore inventory
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { 'inventory.quantity': item.quantity },
    });
  }

  await order.updateStatus(ORDER_STATUS.CANCELLED, reason);

  res.status(200).json(ApiResponse.success(order, 'Order cancelled successfully'));
});

/**
 * Request refund for order
 */
const requestRefund = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const order = await Order.findById(id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check authorization
  if (!order.user || order.user.toString() !== userId) {
    throw new NotFoundError('Order not found');
  }

  if (!order.canBeRefunded()) {
    throw new ValidationError('Order is not eligible for refund');
  }

  if (order.refundRequested) {
    throw new ValidationError(
      'Refund has already been requested for this order'
    );
  }

  order.refundRequested = true;
  order.refundReason = reason;
  await order.save();

  res.status(200).json(ApiResponse.success(order, 'Refund request submitted successfully'));
});

/**
 * Update payment status (admin/webhook only)
 */
const updatePaymentStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, transactionId } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (!Object.values(PAYMENT_STATUS).includes(status)) {
    throw new ValidationError('Invalid payment status');
  }

  await order.updatePaymentStatus(status, transactionId);

  // Update order status based on payment status
  if (status === PAYMENT_STATUS.PAID && order.status === ORDER_STATUS.PENDING) {
    await order.updateStatus(ORDER_STATUS.CONFIRMED);
  }

  res.status(200).json(ApiResponse.success(order, 'Payment status updated successfully'));
});

/**
 * Get all orders (admin only)
 */
const getAllOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, userId, orderNumber } = req.query;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (status) query.status = status;
  if (userId) query.user = userId;
  if (orderNumber) query.orderNumber = new RegExp(orderNumber, 'i');

  const orders = await Order.find(query)
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalOrders = await Order.countDocuments(query);

  res.status(200).json(ApiResponse.success({ 
    count: orders.length,
    total: totalOrders,
    data: orders,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / parseInt(limit)),
      totalItems: totalOrders,
      itemsPerPage: parseInt(limit),
      hasNext: page * limit < totalOrders,
      hasPrev: page > 1,
    }
  }, 'Orders retrieved successfully'));
});

/**
 * Get order statistics (admin only)
 */
const getOrderStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const stats = await Order.getOrderStats(startDate, endDate);

  // Calculate total revenue and order count
  const summary = stats.reduce(
    (acc, stat) => {
      acc.totalOrders += stat.count;
      acc.totalRevenue += stat.totalRevenue;
      return acc;
    },
    { totalOrders: 0, totalRevenue: 0 }
  );

  res.status(200).json(ApiResponse.success({ summary, byStatus: stats }, 'Order statistics retrieved successfully'));
});

/**
 * Add tracking information to order item
 */
const addTrackingInfo = catchAsync(async (req, res) => {
  const { id, itemId } = req.params;
  const { carrier, trackingNumber, estimatedDelivery } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const item = order.items.id(itemId);
  if (!item) {
    throw new NotFoundError('Order item not found');
  }

  item.trackingInfo = {
    carrier,
    trackingNumber,
    trackingUrl: `https://tracking.${carrier.toLowerCase()}.com/${trackingNumber}`,
    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
  };

  item.status = 'shipped';
  await order.save();

  res.status(200).json(ApiResponse.success(order, 'Tracking information added successfully'));
});

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  requestRefund,
  updatePaymentStatus,
  getAllOrders,
  getOrderStats,
  addTrackingInfo,
};
