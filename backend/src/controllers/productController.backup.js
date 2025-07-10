const Product = require('../models/Product');
const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/errors');
const ApiResponse = require('../utils/apiResponse');
const { logger } = require('../utils/logger');

/**
 * @desc    Get all products with filtering, sorting, and pagination
 * @route   GET /api/v1/products
 * @access  Public
 */
const getProducts = catchAsync(async (req, res, next) => {
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
    status = 'active',
    visibility = 'public'
  } = req.query;

  // Build filter object
  const filter = {};

  // Status and visibility filters
  if (req.user?.role !== 'admin') {
    filter.status = 'active';
    filter.visibility = 'public';
  } else {
    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;
  }

  // Category filter (support both ID and slug)
  if (category) {
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = category;
    } else {
      // Find category by slug
      const categoryDoc = await Category.findOne({ slug: category, isActive: true });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      } else {
        return res.status(404).json(
          ApiResponse.error('Category not found', 404)
        );
      }
    }
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter['pricing.price'] = {};
    if (minPrice !== undefined) filter['pricing.price'].$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) filter['pricing.price'].$lte = parseFloat(maxPrice);
  }

  // Brand filter
  if (brand) {
    filter.brand = new RegExp(brand, 'i');
  }

  // Tags filter
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : tags.split(',');
    filter.tags = { $in: tagArray };
  }

  // Featured filter
  if (featured !== undefined) {
    filter.isFeatured = featured === 'true';
  }

  // Stock filter
  if (inStock === 'true') {
    filter.$or = [
      { 'inventory.trackQuantity': false },
      { 'inventory.quantity': { $gt: 0 } },
      { 'inventory.allowBackorder': true }
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Handle search vs regular query
  let query;
  let products;
  let total;

  if (search && search.trim()) {
    // Text search
    filter.$text = { $search: search.trim() };
    
    query = Product.find(filter, { score: { $meta: 'textScore' } })
      .populate('category', 'name slug')
      .sort({ score: { $meta: 'textScore' }, ...parseSortParam(sort) })
      .skip(skip)
      .limit(limitNum);

    products = await query;
    total = await Product.countDocuments(filter);
  } else {
    // Regular query
    query = Product.find(filter)
      .populate('category', 'name slug')
      .sort(parseSortParam(sort))
      .skip(skip)
      .limit(limitNum);

    [products, total] = await Promise.all([
      query,
      Product.countDocuments(filter)
    ]);
  }

  const pagination = {
    page: parseInt(page),
    limit: limitNum,
    total,
    pages: Math.ceil(total / limitNum),
    hasNext: parseInt(page) < Math.ceil(total / limitNum),
    hasPrev: parseInt(page) > 1
  };

  logger.info(`Retrieved ${products.length} products`, {
    userId: req.user?.id,
    filters: filter,
    pagination
  });

  res.status(200).json(
    ApiResponse.success('Products retrieved successfully', {
      products,
      pagination
    })
  );
});

/**
 * @desc    Get single product by ID or slug
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
const getProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Determine if ID is ObjectId or slug
  let query;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { _id: id };
  } else {
    query = { slug: id };
  }

  // Add status and visibility filters for non-admin users
  if (req.user?.role !== 'admin') {
    query.status = 'active';
    query.visibility = 'public';
  }

  const product = await Product.findOne(query)
    .populate('category', 'name slug')
    .populate('relatedProducts', 'name slug pricing.price images')
    .populate({
      path: 'reviews',
      select: 'rating title comment user createdAt',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      },
      options: {
        limit: 10,
        sort: { createdAt: -1 }
      }
    });

  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Increment view count (don't await to avoid slowing response)
  product.incrementViewCount().catch(err => {
    logger.error('Failed to increment view count', { productId: product._id, error: err.message });
  });

  // Get related products if not already populated
  if (!product.relatedProducts || product.relatedProducts.length === 0) {
    const relatedProducts = await Product.getRelatedProducts(
      product._id,
      product.category._id,
      4
    );
    product.relatedProducts = relatedProducts;
  }

  logger.info(`Product retrieved`, {
    productId: product._id,
    productName: product.name,
    userId: req.user?.id
  });

  res.status(200).json(
    ApiResponse.success('Product retrieved successfully', { product })
  );
});

/**
 * @desc    Create new product
 * @route   POST /api/v1/products
 * @access  Private/Admin
 */
const createProduct = catchAsync(async (req, res, next) => {
  // Verify category exists
  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category) {
      return next(new ApiError('Category not found', 404));
    }
  }

  // Verify subcategories exist
  if (req.body.subcategories && req.body.subcategories.length > 0) {
    const subcategories = await Category.find({ _id: { $in: req.body.subcategories } });
    if (subcategories.length !== req.body.subcategories.length) {
      return next(new ApiError('One or more subcategories not found', 404));
    }
  }

  // Check for unique SKU
  const existingSku = await Product.findOne({ sku: req.body.sku });
  if (existingSku) {
    return next(new ApiError('SKU already exists', 400));
  }

  // Set lastModifiedBy
  req.body.lastModifiedBy = req.user.id;

  const product = await Product.create(req.body);

  // Populate the response
  await product.populate('category', 'name slug');

  logger.info(`Product created`, {
    productId: product._id,
    productName: product.name,
    userId: req.user.id
  });

  res.status(201).json(
    ApiResponse.success('Product created successfully', { product })
  );
});

/**
 * @desc    Update product
 * @route   PUT /api/v1/products/:id
 * @access  Private/Admin
 */
const updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find product
  const product = await Product.findById(id);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Verify category exists if being updated
  if (req.body.category && req.body.category !== product.category.toString()) {
    const category = await Category.findById(req.body.category);
    if (!category) {
      return next(new ApiError('Category not found', 404));
    }
  }

  // Verify subcategories exist if being updated
  if (req.body.subcategories && req.body.subcategories.length > 0) {
    const subcategories = await Category.find({ _id: { $in: req.body.subcategories } });
    if (subcategories.length !== req.body.subcategories.length) {
      return next(new ApiError('One or more subcategories not found', 404));
    }
  }

  // Check for unique SKU if being updated
  if (req.body.sku && req.body.sku !== product.sku) {
    const existingSku = await Product.findOne({ sku: req.body.sku });
    if (existingSku) {
      return next(new ApiError('SKU already exists', 400));
    }
  }

  // Set lastModifiedBy
  req.body.lastModifiedBy = req.user.id;

  // Update product
  Object.assign(product, req.body);
  await product.save();

  // Populate the response
  await product.populate('category', 'name slug');

  logger.info(`Product updated`, {
    productId: product._id,
    productName: product.name,
    userId: req.user.id,
    updatedFields: Object.keys(req.body)
  });

  res.status(200).json(
    ApiResponse.success('Product updated successfully', { product })
  );
});

/**
 * @desc    Delete product (soft delete)
 * @route   DELETE /api/v1/products/:id
 * @access  Private/Admin
 */
const deleteProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Soft delete by setting status to archived
  product.status = 'archived';
  product.lastModifiedBy = req.user.id;
  await product.save();

  logger.info(`Product deleted (archived)`, {
    productId: product._id,
    productName: product.name,
    userId: req.user.id
  });

  res.status(200).json(
    ApiResponse.success('Product deleted successfully')
  );
});

/**
 * @desc    Upload product images
 * @route   POST /api/v1/products/:id/images
 * @access  Private/Admin
 */
const uploadProductImages = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { images } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Add images to product
  await product.addImages(images);

  logger.info(`Product images uploaded`, {
    productId: product._id,
    imageCount: images.length,
    userId: req.user.id
  });

  res.status(200).json(
    ApiResponse.success('Images uploaded successfully', {
      product: {
        id: product._id,
        name: product.name,
        images: product.images
      }
    })
  );
});

/**
 * @desc    Delete product image
 * @route   DELETE /api/v1/products/:id/images/:imageId
 * @access  Private/Admin
 */
const deleteProductImage = catchAsync(async (req, res, next) => {
  const { id, imageId } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  try {
    await product.removeImage(imageId);
    
    logger.info(`Product image deleted`, {
      productId: product._id,
      imageId,
      userId: req.user.id
    });

    res.status(200).json(
      ApiResponse.success('Image deleted successfully', {
        product: {
          id: product._id,
          name: product.name,
          images: product.images
        }
      })
    );
  } catch (error) {
    return next(new ApiError(error.message, 400));
  }
});

/**
 * @desc    Set main product image
 * @route   PUT /api/v1/products/:id/images/:imageId/main
 * @access  Private/Admin
 */
const setMainProductImage = catchAsync(async (req, res, next) => {
  const { id, imageId } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  try {
    await product.setMainImage(imageId);
    
    logger.info(`Product main image set`, {
      productId: product._id,
      imageId,
      userId: req.user.id
    });

    res.status(200).json(
      ApiResponse.success('Main image set successfully', {
        product: {
          id: product._id,
          name: product.name,
          images: product.images
        }
      })
    );
  } catch (error) {
    return next(new ApiError(error.message, 400));
  }
});

/**
 * @desc    Get featured products
 * @route   GET /api/v1/products/featured
 * @access  Public
 */
const getFeaturedProducts = catchAsync(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const products = await Product.getFeaturedProducts(parseInt(limit));

  logger.info(`Retrieved ${products.length} featured products`);

  res.status(200).json(
    ApiResponse.success('Featured products retrieved successfully', { products })
  );
});

/**
 * @desc    Get best selling products
 * @route   GET /api/v1/products/bestsellers
 * @access  Public
 */
const getBestSellers = catchAsync(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const products = await Product.getBestSellers(parseInt(limit));

  logger.info(`Retrieved ${products.length} best selling products`);

  res.status(200).json(
    ApiResponse.success('Best selling products retrieved successfully', { products })
  );
});

/**
 * @desc    Get new arrival products
 * @route   GET /api/v1/products/new-arrivals
 * @access  Public
 */
const getNewArrivals = catchAsync(async (req, res, next) => {
  const { days = 30, limit = 10 } = req.query;

  const products = await Product.getNewArrivals(parseInt(days), parseInt(limit));

  logger.info(`Retrieved ${products.length} new arrival products`);

  res.status(200).json(
    ApiResponse.success('New arrival products retrieved successfully', { products })
  );
});

/**
 * @desc    Bulk update products
 * @route   PATCH /api/v1/products/bulk
 * @access  Private/Admin
 */
const bulkUpdateProducts = catchAsync(async (req, res, next) => {
  const { productIds, updates } = req.body;

  // Add lastModifiedBy to updates
  updates.lastModifiedBy = req.user.id;

  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    updates,
    { runValidators: true }
  );

  logger.info(`Bulk updated products`, {
    productIds,
    updates,
    modifiedCount: result.modifiedCount,
    userId: req.user.id
  });

  res.status(200).json(
    ApiResponse.success('Products updated successfully', {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    })
  );
});

/**
 * @desc    Search products with advanced filters
 * @route   GET /api/v1/products/search
 * @access  Public
 */
const searchProducts = catchAsync(async (req, res, next) => {
  const {
    q,
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice,
    brand,
    sort = '-createdAt'
  } = req.query;

  // Build search filter
  const filter = {
    status: 'active',
    visibility: 'public'
  };

  // Text search
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { 'seo.keywords': { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } }
    ];
  }

  // Category filter
  if (category) {
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = category;
    } else {
      const categoryDoc = await Category.findOne({ slug: category, isActive: true });
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

  // Build sort object
  const sortOptions = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'name-asc': { name: 1 },
    'name-desc': { name: -1 },
    'newest': { createdAt: -1 },
    'oldest': { createdAt: 1 },
    'rating': { 'rating.average': -1 }
  };

  const sortQuery = sortOptions[sort] || { createdAt: -1 };

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute search
  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .sort(sortQuery)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-__v');

  // Get total count for pagination
  const total = await Product.countDocuments(filter);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    totalItems: total,
    itemsPerPage: parseInt(limit),
    hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
    hasPrev: parseInt(page) > 1
  };

  res.json(ApiResponse.success({
    products,
    pagination,
    searchQuery: q
  }, 'Search completed successfully'));
});

/**
 * @desc    Remove product image
 * @route   DELETE /api/v1/products/:id/images/:imageId
 * @access  Private/Admin
 */
const removeProductImage = catchAsync(async (req, res, next) => {
  const { id, imageId } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Find and remove the image
  const imageIndex = product.images.findIndex(img => img._id.toString() === imageId);
  if (imageIndex === -1) {
    return next(new ApiError('Image not found', 404));
  }

  product.images.splice(imageIndex, 1);

  // If removed image was primary, set first image as primary
  if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
    product.images[0].isPrimary = true;
  }

  await product.save();

  res.json(ApiResponse.success(
    { images: product.images },
    'Image removed successfully'
  ));
});

/**
 * @desc    Set primary product image
 * @route   PUT /api/v1/products/:id/images/:imageId/primary
 * @access  Private/Admin
 */
const setPrimaryImage = catchAsync(async (req, res, next) => {
  const { id, imageId } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Find the image
  const image = product.images.find(img => img._id.toString() === imageId);
  if (!image) {
    return next(new ApiError('Image not found', 404));
  }

  // Reset all images to non-primary
  product.images.forEach(img => {
    img.isPrimary = false;
  });

  // Set the selected image as primary
  image.isPrimary = true;

  await product.save();

  res.json(ApiResponse.success(
    { images: product.images },
    'Primary image updated successfully'
  ));
});

/**
 * @desc    Bulk delete products
 * @route   PATCH /api/v1/products/bulk-delete
 * @access  Private/Admin
 */
const bulkDeleteProducts = catchAsync(async (req, res, next) => {
  const { productIds, permanent = false } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return next(new ApiError('Product IDs are required', 400));
  }

  let result;
  if (permanent === true) {
    // Permanent deletion
    result = await Product.deleteMany({ _id: { $in: productIds } });
  } else {
    // Soft deletion - set status to inactive
    result = await Product.updateMany(
      { _id: { $in: productIds } },
      { 
        status: 'inactive',
        updatedAt: new Date()
      }
    );
  }

  res.json(ApiResponse.success({
    deletedCount: result.deletedCount || result.modifiedCount,
    permanent
  }, `Products ${permanent ? 'permanently deleted' : 'deactivated'} successfully`));
});

/**
 * @desc    Update product inventory
 * @route   PATCH /api/v1/products/:id/inventory
 * @access  Private/Admin
 */
const updateInventory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { stock, lowStockThreshold, trackInventory } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Update inventory fields
  const updates = {};
  if (stock !== undefined) updates['inventory.stock'] = parseInt(stock);
  if (lowStockThreshold !== undefined) updates['inventory.lowStockThreshold'] = parseInt(lowStockThreshold);
  if (trackInventory !== undefined) updates['inventory.trackInventory'] = trackInventory;

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { 
      ...updates,
      updatedAt: new Date()
    },
    { new: true, runValidators: true }
  ).populate('category', 'name slug');

  res.json(ApiResponse.success(
    updatedProduct,
    'Product inventory updated successfully'
  ));
});

/**
 * Helper function to parse sort parameter
 */
function parseSortParam(sort) {
  const sortObj = {};
  
  if (sort.startsWith('-')) {
    const field = sort.substring(1);
    if (field === 'rating') {
      sortObj['rating.average'] = -1;
    } else if (field === 'price') {
      sortObj['pricing.price'] = -1;
    } else if (field === 'newest') {
      sortObj.createdAt = -1;
    } else {
      sortObj[field] = -1;
    }
  } else {
    if (sort === 'rating') {
      sortObj['rating.average'] = 1;
    } else if (sort === 'price') {
      sortObj['pricing.price'] = 1;
    } else if (sort === 'newest') {
      sortObj.createdAt = 1;
    } else {
      sortObj[sort] = 1;
    }
  }
  
  return sortObj;
}

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  setMainProductImage,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  bulkUpdateProducts,
  searchProducts,
  removeProductImage,
  setPrimaryImage,
  bulkDeleteProducts,
  updateInventory
};
