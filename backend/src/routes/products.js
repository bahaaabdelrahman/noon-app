const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const { createReviewSchema, reviewQuerySchema, productIdSchema } = require('../validators/reviewValidator');
const { uploadProductImages, handleMulterError } = require('../middleware/upload');

/**
 * @openapi
 * tags:
 *   name: Product Catalog
 *   description: API for browsing and managing products.
 */

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Retrieve a list of products
 *     tags: [Product Catalog]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number to retrieve.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of products to return per page.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: The field to sort by (e.g., 'price', 'createdAt').
 *     responses:
 *       200:
 *         description: A paginated list of products.
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
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get('/', productController.getProducts);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Retrieve a single product by ID
 *     tags: [Product Catalog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The product ID.
 *     responses:
 *       200:
 *         description: Detailed information about a single product.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found.
 */
router.get('/:id', productController.getProduct);

// --- Placeholder for other public routes --- 
router.get('/featured', productController.getFeaturedProducts);
router.get('/bestsellers', productController.getBestSellers);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/search', productController.searchProducts);

// --- Product review routes ---
router.get('/:productId/reviews', validateParams(productIdSchema), validateQuery(reviewQuerySchema), reviewController.getProductReviews);
router.post('/:productId/reviews', authenticate, validateParams(productIdSchema), validateBody(createReviewSchema), reviewController.createReview);


// --- Admin Routes ---
router.use(authenticate);
router.use(authorize('admin'));

router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.post('/:id/images', uploadProductImages, handleMulterError, productController.uploadProductImages);
router.delete('/:id/images/:imageId', productController.removeProductImage);
router.put('/:id/images/:imageId/primary', productController.setPrimaryImage);
router.patch('/bulk-update', productController.bulkUpdateProducts);
router.patch('/bulk-delete', productController.bulkDeleteProducts);
router.patch('/:id/inventory', productController.updateInventory);

module.exports = router;

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6856900de8d08870077cccce
 *         name:
 *           type: string
 *           example: Casual T-Shirt
 *         slug:
 *           type: string
 *           example: casual-t-shirt
 *         description:
 *           type: string
 *           example: A comfortable and stylish t-shirt for everyday wear.
 *         price:
 *           type: number
 *           format: float
 *           example: 29.99
 *         category:
 *           type: string
 *           example: Apparel
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               alt:
 *                 type: string
 *         inventory:
 *           type: object
 *           properties:
 *             quantity:
 *               type: integer
 *               example: 100
 *             inStock:
 *               type: boolean
 *               example: true
 */
