const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  uploadCategoryImage,
  handleMulterError,
} = require('../middleware/upload');

/**
 * @openapi
 * tags:
 *   name: Categories
 *   description: Category management and hierarchy operations
 */

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of all categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/', categoryController.getCategories);

/**
 * @openapi
 * /categories/hierarchy:
 *   get:
 *     summary: Get category hierarchy
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Hierarchical structure of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryHierarchy'
 */
router.get('/hierarchy', categoryController.getCategoryHierarchy);

/**
 * @openapi
 * /categories/level/{level}:
 *   get:
 *     summary: Get categories by level
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category level (0 for root categories)
 *     responses:
 *       200:
 *         description: Categories at specified level
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/level/:level', categoryController.getCategoriesByLevel);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */
router.get('/:id', categoryController.getCategory);

// Protected routes - Admin only
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @openapi
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               slug:
 *                 type: string
 *                 example: electronics
 *               description:
 *                 type: string
 *                 example: Electronic devices and accessories
 *               parentId:
 *                 type: string
 *                 example: 60d5ecb54b24c3001f8b4567
 *               image:
 *                 type: string
 *                 example: /uploads/categories/electronics.jpg
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', categoryController.createCategory);

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *               image:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 */
router.put('/:id', categoryController.updateCategory);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 */
router.delete('/:id', categoryController.deleteCategory);

/**
 * @openapi
 * /categories/{id}/image:
 *   post:
 *     summary: Upload category image
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *       400:
 *         description: Invalid file or upload error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 */
router.post(
  '/:id/image',
  uploadCategoryImage,
  handleMulterError,
  categoryController.uploadCategoryImage
);

/**
 * @openapi
 * /categories/{id}/image:
 *   delete:
 *     summary: Remove category image
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Image removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 */
router.delete('/:id/image', categoryController.removeCategoryImage);

/**
 * @openapi
 * /categories/bulk-update:
 *   patch:
 *     summary: Bulk update categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d5ecb54b24c3001f8b4567", "60d5ecb54b24c3001f8b4568"]
 *               updates:
 *                 type: object
 *                 properties:
 *                   isActive:
 *                     type: boolean
 *                   parentId:
 *                     type: string
 *     responses:
 *       200:
 *         description: Categories updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     modifiedCount:
 *                       type: integer
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.patch('/bulk-update', categoryController.bulkUpdateCategories);

module.exports = router;

/**
 * @openapi
 * components:
 *   schemas:
 *     CategoryImage:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           example: https://example.com/images/categories/electronics.jpg
 *         publicId:
 *           type: string
 *           example: categories/electronics_main
 *         alt:
 *           type: string
 *           example: Electronics category image
 * 
 *     CategoryMetaData:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: Electronics - Best Devices & Accessories
 *         description:
 *           type: string
 *           example: Shop the latest electronics including smartphones, laptops, and accessories
 *         keywords:
 *           type: array
 *           items:
 *             type: string
 *           example: ["electronics", "smartphones", "laptops", "gadgets"]
 * 
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d5ecb54b24c3001f8b4567
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: Electronics
 *           description: Category name
 *         slug:
 *           type: string
 *           example: electronics
 *           description: URL-friendly version of the category name
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: Electronic devices and accessories including smartphones, laptops, and more
 *           description: Detailed description of the category
 *         image:
 *           $ref: '#/components/schemas/CategoryImage'
 *         parentCategory:
 *           type: string
 *           example: 60d5ecb54b24c3001f8b4566
 *           description: ID of the parent category (null for root categories)
 *         level:
 *           type: integer
 *           minimum: 0
 *           maximum: 3
 *           example: 1
 *           description: Hierarchy level (0 for root categories, max 3)
 *         path:
 *           type: string
 *           example: root-category/electronics
 *           description: Full path from root to this category
 *         isActive:
 *           type: boolean
 *           example: true
 *           description: Whether the category is active and visible
 *         isFeatured:
 *           type: boolean
 *           example: false
 *           description: Whether the category is featured on homepage
 *         sortOrder:
 *           type: integer
 *           example: 0
 *           description: Sort order for displaying categories
 *         metaData:
 *           $ref: '#/components/schemas/CategoryMetaData'
 *         productCount:
 *           type: integer
 *           minimum: 0
 *           example: 245
 *           description: Number of active products in this category
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-16T14:22:00Z
 *         subcategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *           readOnly: true
 *           description: Child categories (populated when requested)
 *         products:
 *           type: array
 *           items:
 *             type: string
 *           readOnly: true
 *           description: Product IDs in this category (populated when requested)
 * 
 *     CategoryHierarchy:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d5ecb54b24c3001f8b4567
 *         name:
 *           type: string
 *           example: Electronics
 *         slug:
 *           type: string
 *           example: electronics
 *         description:
 *           type: string
 *           example: Electronic devices and accessories
 *         image:
 *           $ref: '#/components/schemas/CategoryImage'
 *         level:
 *           type: integer
 *           example: 1
 *         path:
 *           type: string
 *           example: root-category/electronics
 *         isActive:
 *           type: boolean
 *           example: true
 *         isFeatured:
 *           type: boolean
 *           example: false
 *         sortOrder:
 *           type: integer
 *           example: 0
 *         productCount:
 *           type: integer
 *           example: 245
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryHierarchy'
 *           description: Child categories in the hierarchy
 */
