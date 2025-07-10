const Category = require('../models/Category');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/errors');

/**
 * Get all categories
 */
const getCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .populate('parentCategory', 'name slug')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
    message: 'Categories retrieved successfully',
  });
});

/**
 * Get category by ID or slug
 */
const getCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  let category = await Category.findById(id).populate(
    'parentCategory',
    'name slug'
  );

  if (!category) {
    category = await Category.findOne({ slug: id }).populate(
      'parentCategory',
      'name slug'
    );
  }

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    data: category,
    message: 'Category retrieved successfully',
  });
});

/**
 * Create new category
 */
const createCategory = catchAsync(async (req, res) => {
  const category = await Category.create(req.body);
  await category.populate('parentCategory', 'name slug');

  res.status(201).json({
    success: true,
    data: category,
    message: 'Category created successfully',
  });
});

/**
 * Update category
 */
const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByIdAndUpdate(
    id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('parentCategory', 'name slug');

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    data: category,
    message: 'Category updated successfully',
  });
});

/**
 * Delete category
 */
const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    data: null,
    message: 'Category deleted successfully',
  });
});

/**
 * Get category hierarchy
 */
const getCategoryHierarchy = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .populate('subcategories', 'name slug')
    .sort({ level: 1, name: 1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
    message: 'Category hierarchy retrieved successfully',
  });
});

/**
 * Upload category image
 */
const uploadCategoryImage = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    throw new AppError('No image file provided', 400);
  }

  const imageUrl = `/uploads/categories/${req.file.filename}`;

  const category = await Category.findByIdAndUpdate(
    id,
    { image: imageUrl, updatedAt: new Date() },
    { new: true }
  );

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { imageUrl: category.image },
    message: 'Category image uploaded successfully',
  });
});

/**
 * Remove category image
 */
const removeCategoryImage = catchAsync(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByIdAndUpdate(
    id,
    { $unset: { image: 1 }, updatedAt: new Date() },
    { new: true }
  );

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.status(200).json({
    success: true,
    data: null,
    message: 'Category image removed successfully',
  });
});

/**
 * Get categories by level
 */
const getCategoriesByLevel = catchAsync(async (req, res) => {
  const { level } = req.params;

  const categories = await Category.find({
    level: parseInt(level),
    isActive: true,
  })
    .populate('parent', 'name slug')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
    message: `Level ${level} categories retrieved successfully`,
  });
});

/**
 * Bulk update categories
 */
const bulkUpdateCategories = catchAsync(async (req, res) => {
  const { categoryIds, updates } = req.body;

  if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw new AppError('Category IDs are required', 400);
  }

  updates.updatedAt = new Date();

  const result = await Category.updateMany(
    { _id: { $in: categoryIds } },
    { $set: updates }
  );

  res.status(200).json({
    success: true,
    data: {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    },
    message: 'Categories updated successfully',
  });
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryHierarchy,
  uploadCategoryImage,
  removeCategoryImage,
  getCategoriesByLevel,
  bulkUpdateCategories,
};
