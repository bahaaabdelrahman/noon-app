const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  uploadCategoryImage,
  handleMulterError,
} = require('../middleware/upload');

// Public routes
router.get('/', categoryController.getCategories);
router.get('/hierarchy', categoryController.getCategoryHierarchy);
router.get('/level/:level', categoryController.getCategoriesByLevel);
router.get('/:id', categoryController.getCategory);

// Protected routes - Admin only
router.use(authenticate);
router.use(authorize('admin'));

router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

// Image management
router.post(
  '/:id/image',
  uploadCategoryImage,
  handleMulterError,
  categoryController.uploadCategoryImage
);
router.delete('/:id/image', categoryController.removeCategoryImage);

// Bulk operations
router.patch('/bulk-update', categoryController.bulkUpdateCategories);

module.exports = router;
