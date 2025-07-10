const Product = require('../models/Product');
const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/errors');

/**
 * Get all products with filtering and pagination
 */
const getProducts = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice,
    brand,
    tags,
    featured,
    inStock,
    sort = '-createdAt',
    search,
  } = req.query;

  // Build filter object
  const filter = { status: 'active', visibility: 'public' };

  // Category filter
  if (category) {
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = category;
    } else {
      const categoryDoc = await Category.findOne({
        slug: category,
        isActive: true,
      });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      }
    }
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  // Brand filter
  if (brand) {
    filter.brand = new RegExp(brand, 'i');
  }

  // Tags filter
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    filter.tags = { $in: tagArray };
  }

  // Featured filter
  if (featured === 'true') {
    filter.isFeatured = true;
  }

  // In stock filter
  if (inStock === 'true') {
    filter['inventory.stock'] = { $gt: 0 };
  }

  // Search filter
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }

  // Build sort object
  const sortOptions = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'name-asc': { name: 1 },
    'name-desc': { name: -1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
  };

  const sortQuery = sortOptions[sort] || { createdAt: -1 };

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query
  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .sort(sortQuery)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-__v');

  // Get total count
  const total = await Product.countDocuments(filter);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    totalItems: total,
    itemsPerPage: parseInt(limit),
    hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
    hasPrev: parseInt(page) > 1,
  };

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
    pagination,
    message: 'Products retrieved successfully',
  });
});

/**
 * Get single product
 */
const getProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  let product = await Product.findById(id).populate('category', 'name slug');

  if (!product) {
    product = await Product.findOne({ slug: id }).populate(
      'category',
      'name slug'
    );
  }

  if (!product || product.status !== 'active') {
    throw new AppError('Product not found', 404);
  }

  res.status(200).json({
    success: true,
    data: product,
    message: 'Product retrieved successfully',
  });
});

/**
 * Create new product
 */
const createProduct = catchAsync(async (req, res) => {
  const product = await Product.create(req.body);
  await product.populate('category', 'name slug');

  res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully',
  });
});

/**
 * Update product
 */
const updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndUpdate(
    id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('category', 'name slug');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.status(200).json({
    success: true,
    data: product,
    message: 'Product updated successfully',
  });
});

/**
 * Delete product
 */
const deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.status(200).json({
    success: true,
    data: null,
    message: 'Product deleted successfully',
  });
});

/**
 * Get featured products
 */
const getFeaturedProducts = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({
    isFeatured: true,
    status: 'active',
    visibility: 'public',
  })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
    message: 'Featured products retrieved successfully',
  });
});

/**
 * Get bestseller products
 */
const getBestSellers = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({
    status: 'active',
    visibility: 'public',
  })
    .populate('category', 'name slug')
    .sort({ soldCount: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
    message: 'Best seller products retrieved successfully',
  });
});

/**
 * Get new arrival products
 */
const getNewArrivals = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({
    status: 'active',
    visibility: 'public',
  })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
    message: 'New arrival products retrieved successfully',
  });
});

/**
 * Search products
 */
const searchProducts = catchAsync(async (req, res) => {
  const {
    q,
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice,
    brand,
    sort = '-createdAt',
  } = req.query;

  const filter = { status: 'active', visibility: 'public' };

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
    ];
  }

  if (category) {
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = category;
    } else {
      const categoryDoc = await Category.findOne({
        slug: category,
        isActive: true,
      });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      }
    }
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  if (brand) {
    filter.brand = new RegExp(brand, 'i');
  }

  const sortOptions = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'name-asc': { name: 1 },
    'name-desc': { name: -1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
  };

  const sortQuery = sortOptions[sort] || { createdAt: -1 };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .sort(sortQuery)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Product.countDocuments(filter);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    totalItems: total,
    itemsPerPage: parseInt(limit),
    hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
    hasPrev: parseInt(page) > 1,
  };

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
    pagination,
    searchQuery: q,
    message: 'Search completed successfully',
  });
});

/**
 * Upload product images
 */
const uploadProductImages = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!req.files || req.files.length === 0) {
    throw new AppError('No image files provided', 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const newImages = req.files.map((file, index) => ({
    url: `/uploads/products/${file.filename}`,
    alt: req.body.alt || `${product.name} image ${index + 1}`,
    isPrimary: index === 0 && product.images.length === 0,
  }));

  product.images.push(...newImages);
  await product.save();

  res.status(200).json({
    success: true,
    data: { images: product.images },
    message: 'Product images uploaded successfully',
  });
});

/**
 * Remove product image
 */
const removeProductImage = catchAsync(async (req, res) => {
  const { id, imageId } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const imageIndex = product.images.findIndex(
    img => img._id.toString() === imageId
  );
  if (imageIndex === -1) {
    throw new AppError('Image not found', 404);
  }

  product.images.splice(imageIndex, 1);

  if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
    product.images[0].isPrimary = true;
  }

  await product.save();

  res.status(200).json({
    success: true,
    data: { images: product.images },
    message: 'Image removed successfully',
  });
});

/**
 * Set primary product image
 */
const setPrimaryImage = catchAsync(async (req, res) => {
  const { id, imageId } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const image = product.images.find(img => img._id.toString() === imageId);
  if (!image) {
    throw new AppError('Image not found', 404);
  }

  product.images.forEach(img => {
    img.isPrimary = false;
  });

  image.isPrimary = true;
  await product.save();

  res.status(200).json({
    success: true,
    data: { images: product.images },
    message: 'Primary image updated successfully',
  });
});

/**
 * Bulk update products
 */
const bulkUpdateProducts = catchAsync(async (req, res) => {
  const { productIds, updates } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new AppError('Product IDs are required', 400);
  }

  updates.updatedAt = new Date();

  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    { $set: updates }
  );

  res.status(200).json({
    success: true,
    data: {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    },
    message: 'Products updated successfully',
  });
});

/**
 * Bulk delete products
 */
const bulkDeleteProducts = catchAsync(async (req, res) => {
  const { productIds, permanent = false } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new AppError('Product IDs are required', 400);
  }

  let result;
  if (permanent === true) {
    result = await Product.deleteMany({ _id: { $in: productIds } });
  } else {
    result = await Product.updateMany(
      { _id: { $in: productIds } },
      { status: 'inactive', updatedAt: new Date() }
    );
  }

  res.status(200).json({
    success: true,
    data: {
      deletedCount: result.deletedCount || result.modifiedCount,
      permanent,
    },
    message: `Products ${permanent ? 'permanently deleted' : 'deactivated'} successfully`,
  });
});

/**
 * Update product inventory
 */
const updateInventory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { stock, lowStockThreshold, trackInventory } = req.body;

  const updates = {};
  if (stock !== undefined) updates['inventory.stock'] = parseInt(stock);
  if (lowStockThreshold !== undefined)
    updates['inventory.lowStockThreshold'] = parseInt(lowStockThreshold);
  if (trackInventory !== undefined)
    updates['inventory.trackInventory'] = trackInventory;

  const product = await Product.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('category', 'name slug');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.status(200).json({
    success: true,
    data: product,
    message: 'Product inventory updated successfully',
  });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  removeProductImage,
  setPrimaryImage,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  bulkUpdateProducts,
  searchProducts,
  bulkDeleteProducts,
  updateInventory,
};
