const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateBody,
  validateParams,
  validateQuery,
} = require('../middleware/validation');
const {
  createReviewSchema,
  reviewQuerySchema,
  productIdSchema,
} = require('../validators/reviewValidator');
const {
  uploadProductImages,
  handleMulterError,
} = require('../middleware/upload');

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

/**
 * @openapi
 * /products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Product Catalog]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of featured products to return
 *     responses:
 *       200:
 *         description: List of featured products
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
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/featured', productController.getFeaturedProducts);

/**
 * @openapi
 * /products/bestsellers:
 *   get:
 *     summary: Get best-selling products
 *     tags: [Product Catalog]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of best-selling products to return
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year, all]
 *           default: month
 *         description: Time period for sales calculation
 *     responses:
 *       200:
 *         description: List of best-selling products
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Product'
 *                       - type: object
 *                         properties:
 *                           salesCount:
 *                             type: integer
 *                             example: 156
 *                           salesRank:
 *                             type: integer
 *                             example: 1
 */
router.get('/bestsellers', productController.getBestSellers);

/**
 * @openapi
 * /products/new-arrivals:
 *   get:
 *     summary: Get new arrival products
 *     tags: [Product Catalog]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of new arrival products to return
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to consider as "new"
 *     responses:
 *       200:
 *         description: List of new arrival products
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
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/new-arrivals', productController.getNewArrivals);

/**
 * @openapi
 * /products/search:
 *   get:
 *     summary: Search products
 *     tags: [Product Catalog]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *         example: "smartphone"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, price, rating, newest]
 *         description: Sort results by
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results
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
 *                         totalResults:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 */
router.get('/search', productController.searchProducts);

/**
 * @openapi
 * /products/{productId}/reviews:
 *   get:
 *     summary: Get reviews for a product
 *     tags: [Product Catalog]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: Product reviews
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
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalReviews:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       404:
 *         description: Product not found
 */
router.get(
  '/:productId/reviews',
  validateParams(productIdSchema),
  validateQuery(reviewQuerySchema),
  reviewController.getProductReviews
);

/**
 * @openapi
 * /products/{productId}/reviews:
 *   post:
 *     summary: Create a review for a product
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - title
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               title:
 *                 type: string
 *                 example: "Great product!"
 *               comment:
 *                 type: string
 *                 example: "Really satisfied with this purchase."
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.post(
  '/:productId/reviews',
  authenticate,
  validateParams(productIdSchema),
  validateBody(createReviewSchema),
  reviewController.createReview
);

// --- Admin Routes ---
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a new product (Admin only)
 *     tags: [Product Catalog]
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
 *               - price
 *               - category
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Wireless Headphones"
 *               slug:
 *                 type: string
 *                 example: "wireless-headphones"
 *               description:
 *                 type: string
 *                 example: "High-quality wireless headphones with noise cancellation"
 *               price:
 *                 type: number
 *                 example: 199.99
 *               category:
 *                 type: string
 *                 example: "60d5ecb54b24c3001f8b4567"
 *               brand:
 *                 type: string
 *                 example: "TechBrand"
 *               sku:
 *                 type: string
 *                 example: "TB-WH-001"
 *               inventory:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                     example: 50
 *                   inStock:
 *                     type: boolean
 *                     example: true
 *               specifications:
 *                 type: object
 *                 example: {"color": "Black", "weight": "250g"}
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', productController.createProduct);

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     summary: Update a product (Admin only)
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               brand:
 *                 type: string
 *               inventory:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                   inStock:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 */
router.put('/:id', productController.updateProduct);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Delete a product (Admin only)
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *         description: Product not found
 */
router.delete('/:id', productController.deleteProduct);

/**
 * @openapi
 * /products/{id}/images:
 *   post:
 *     summary: Upload product images (Admin only)
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product image files
 *     responses:
 *       200:
 *         description: Images uploaded successfully
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
 *                     uploadedImages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           alt:
 *                             type: string
 *                           isPrimary:
 *                             type: boolean
 *       400:
 *         description: Invalid files or upload error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 */
router.post(
  '/:id/images',
  uploadProductImages,
  handleMulterError,
  productController.uploadProductImages
);

/**
 * @openapi
 * /products/{id}/images/{imageId}:
 *   delete:
 *     summary: Remove product image (Admin only)
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
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
 *         description: Product or image not found
 */
router.delete('/:id/images/:imageId', productController.removeProductImage);

/**
 * @openapi
 * /products/{id}/images/{imageId}/primary:
 *   put:
 *     summary: Set primary product image (Admin only)
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Primary image set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product or image not found
 */
router.put('/:id/images/:imageId/primary', productController.setPrimaryImage);

/**
 * @openapi
 * /products/bulk-update:
 *   patch:
 *     summary: Bulk update products (Admin only)
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d5ecb54b24c3001f8b4567", "60d5ecb54b24c3001f8b4568"]
 *               updates:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   price:
 *                     type: number
 *     responses:
 *       200:
 *         description: Products updated successfully
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
router.patch('/bulk-update', productController.bulkUpdateProducts);

/**
 * @openapi
 * /products/bulk-delete:
 *   patch:
 *     summary: Bulk delete products (Admin only)
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d5ecb54b24c3001f8b4567", "60d5ecb54b24c3001f8b4568"]
 *     responses:
 *       200:
 *         description: Products deleted successfully
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
 *                     deletedCount:
 *                       type: integer
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.patch('/bulk-delete', productController.bulkDeleteProducts);

/**
 * @openapi
 * /products/{id}/inventory:
 *   patch:
 *     summary: Update product inventory (Admin only)
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 100
 *               inStock:
 *                 type: boolean
 *                 example: true
 *               reorderLevel:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 */
router.patch('/:id/inventory', productController.updateInventory);

module.exports = router;

/**
 * @openapi
 * components:
 *   schemas:
 *     ProductImage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         url:
 *           type: string
 *           example: https://example.com/images/product1.jpg
 *         publicId:
 *           type: string
 *           example: products/product1_main
 *         alt:
 *           type: string
 *           example: Casual T-Shirt front view
 *         isMain:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00Z
 *
 *     ProductVariant:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Size
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Small", "Medium", "Large", "XL"]
 *
 *     ProductDimensions:
 *       type: object
 *       properties:
 *         length:
 *           type: number
 *           example: 25.5
 *         width:
 *           type: number
 *           example: 20.0
 *         height:
 *           type: number
 *           example: 0.5
 *         unit:
 *           type: string
 *           enum: [cm, in, m, ft]
 *           example: cm
 *
 *     ProductInventory:
 *       type: object
 *       properties:
 *         trackQuantity:
 *           type: boolean
 *           example: true
 *           description: Whether to track inventory quantity (if false, product is always available)
 *         quantity:
 *           type: integer
 *           minimum: 0
 *           example: 100
 *           description: Current stock quantity available for sale
 *         lowStockThreshold:
 *           type: integer
 *           minimum: 0
 *           example: 10
 *           description: Quantity threshold below which the product is considered low stock
 *         allowBackorder:
 *           type: boolean
 *           example: false
 *           description: Whether customers can order when out of stock (backorder)
 *         weight:
 *           type: number
 *           minimum: 0
 *           example: 0.25
 *         dimensions:
 *           $ref: '#/components/schemas/ProductDimensions'
 *
 *     ProductPricing:
 *       type: object
 *       required:
 *         - price
 *       properties:
 *         price:
 *           type: number
 *           minimum: 0
 *           example: 29.99
 *         comparePrice:
 *           type: number
 *           minimum: 0
 *           example: 39.99
 *         costPerItem:
 *           type: number
 *           minimum: 0
 *           example: 15.50
 *         taxable:
 *           type: boolean
 *           example: true
 *         currency:
 *           type: string
 *           pattern: '^[A-Z]{3}$'
 *           example: USD
 *
 *     ProductSEO:
 *       type: object
 *       properties:
 *         metaTitle:
 *           type: string
 *           maxLength: 60
 *           example: Comfortable Casual T-Shirt - Premium Quality
 *         metaDescription:
 *           type: string
 *           maxLength: 160
 *           example: Shop our premium casual t-shirt made from 100% cotton. Perfect for everyday wear with a comfortable fit.
 *         metaKeywords:
 *           type: array
 *           items:
 *             type: string
 *           example: ["t-shirt", "casual", "cotton", "comfortable"]
 *         canonicalUrl:
 *           type: string
 *           example: https://example.com/products/casual-t-shirt
 *
 *     ProductRating:
 *       type: object
 *       properties:
 *         average:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           example: 4.3
 *         count:
 *           type: integer
 *           minimum: 0
 *           example: 127
 *         distribution:
 *           type: object
 *           properties:
 *             '5':
 *               type: integer
 *               example: 65
 *             '4':
 *               type: integer
 *               example: 42
 *             '3':
 *               type: integer
 *               example: 15
 *             '2':
 *               type: integer
 *               example: 3
 *             '1':
 *               type: integer
 *               example: 2
 *
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - sku
 *         - category
 *         - pricing
 *       properties:
 *         _id:
 *           type: string
 *           example: 6856900de8d08870077cccce
 *         name:
 *           type: string
 *           maxLength: 200
 *           example: Casual T-Shirt
 *         slug:
 *           type: string
 *           example: casual-t-shirt
 *         description:
 *           type: string
 *           maxLength: 5000
 *           example: A comfortable and stylish t-shirt for everyday wear. Made from 100% premium cotton with a perfect fit.
 *         shortDescription:
 *           type: string
 *           maxLength: 500
 *           example: Comfortable casual t-shirt made from 100% premium cotton.
 *         sku:
 *           type: string
 *           example: TSH-001-BLU-M
 *         barcode:
 *           type: string
 *           example: 1234567890123
 *         category:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         subcategories:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *         brand:
 *           type: string
 *           maxLength: 100
 *           example: FashionBrand
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["casual", "cotton", "comfortable", "summer"]
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariant'
 *         specifications:
 *           type: object
 *           additionalProperties: true
 *           example:
 *             material: "100% Cotton"
 *             care: "Machine wash cold"
 *             origin: "Made in USA"
 *             weight: "180gsm"
 *         pricing:
 *           $ref: '#/components/schemas/ProductPricing'
 *         inventory:
 *           $ref: '#/components/schemas/ProductInventory'
 *         seo:
 *           $ref: '#/components/schemas/ProductSEO'
 *         rating:
 *           $ref: '#/components/schemas/ProductRating'
 *         status:
 *           type: string
 *           enum: [active, inactive, draft, archived]
 *           example: active
 *           description: Product status - only 'active' products are available for purchase
 *         visibility:
 *           type: string
 *           enum: [public, private, hidden]
 *           example: public
 *           description: Product visibility - only 'public' products are shown to customers
 *         isFeatured:
 *           type: boolean
 *           example: false
 *           description: Whether the product is featured on homepage/promotions
 *         isDigital:
 *           type: boolean
 *           example: false
 *           description: Whether the product is digital (no shipping required)
 *         requiresShipping:
 *           type: boolean
 *           example: true
 *           description: Whether the product requires physical shipping
 *         relatedProducts:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
 *         viewCount:
 *           type: integer
 *           minimum: 0
 *           example: 1247
 *         salesCount:
 *           type: integer
 *           minimum: 0
 *           example: 156
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00Z
 *         lastModifiedBy:
 *           type: string
 *           example: 507f1f77bcf86cd799439016
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-16T14:22:00Z
 *         # Virtual fields (computed) - Availability & Status Indicators
 *         inStock:
 *           type: boolean
 *           readOnly: true
 *           example: true
 *           description: Whether the product is currently in stock (considers inventory.quantity and allowBackorder)
 *         isLowStock:
 *           type: boolean
 *           readOnly: true
 *           example: false
 *           description: Whether the product stock is below the low stock threshold
 *         isOnSale:
 *           type: boolean
 *           readOnly: true
 *           example: true
 *           description: Whether the product has a compare price higher than current price
 *         discountPercentage:
 *           type: integer
 *           readOnly: true
 *           example: 25
 *           description: Percentage discount when on sale
 *         mainImage:
 *           allOf:
 *             - $ref: '#/components/schemas/ProductImage'
 *           readOnly: true
 */
