const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../../src/app');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');
const Cart = require('../../src/models/Cart');

describe('Cart Integration Tests', () => {
  let app;
  let userToken;
  let adminToken;
  let userId;
  let adminId;
  let testProduct;
  let testCategory;
  let sessionId;

  beforeAll(async () => {
    app = createApp();
    sessionId = 'test-session-' + Date.now();
  });

  beforeEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Cart.deleteMany({});

    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category for cart tests',
      status: 'active',
      hierarchy: {
        level: 1,
        parentId: null,
      },
    });

    // Create test product
    testProduct = await Product.create({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product for cart tests',
      images: [
        {
          url: 'https://example.com/test-image.jpg',
          publicId: 'test-image-123',
          alt: 'Test product image',
          isMain: true,
        },
      ],
      category: testCategory._id,
      pricing: {
        regular: 100,
        sale: 90,
        cost: 50,
      },
      inventory: {
        trackQuantity: true,
        quantity: 50,
        lowStockThreshold: 5,
      },
      status: 'active',
      visibility: 'public',
      sku: 'TEST-PRODUCT-001',
    });

    // Create test user
    const userResponse = await request(app).post('/api/v1/auth/register').send({
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    userId = userResponse.body.data.user._id;
    userToken = userResponse.body.data.tokens.accessToken;

    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });

    adminId = adminUser._id;

    const adminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!',
      });

    adminToken = adminLoginResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Cleanup handled by global setup
  });

  describe('GET /api/v1/cart', () => {
    it('should get empty cart for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.user).toBe(userId);
    });

    it('should get empty cart for guest user with session ID', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('x-session-id', sessionId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.sessionId).toBe(sessionId);
    });

    it('should return error when no user ID or session ID provided', async () => {
      await request(app).get('/api/v1/cart').expect(400);
    });
  });

  describe('POST /api/v1/cart/items', () => {
    it('should add item to authenticated user cart', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 2,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].product._id).toBe(
        testProduct._id.toString()
      );
      expect(response.body.data.items[0].quantity).toBe(2);
      expect(response.body.data.totals.subtotal).toBe(200); // 2 × 100
    });

    it('should add item to guest user cart', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('x-session-id', sessionId)
        .send({
          productId: testProduct._id.toString(),
          quantity: 1,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.sessionId).toBe(sessionId);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 2,
        })
        .expect(400);
    });

    it('should validate quantity limits', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 101,
        })
        .expect(400);
    });

    it('should return error for invalid product ID', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: new mongoose.Types.ObjectId().toString(),
          quantity: 1,
        })
        .expect(404);
    });
  });

  describe('PUT /api/v1/cart/items/:itemId', () => {
    let cartItemId;

    beforeEach(async () => {
      // Add item to cart first
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 1,
        });

      cartItemId = response.body.data.items[0]._id;
    });

    it('should update item quantity', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 3,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items[0].quantity).toBe(3);
      expect(response.body.data.totals.subtotal).toBe(300);
    });

    it('should remove item when quantity is 0', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 0,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
    });

    it('should return error for invalid item ID', async () => {
      await request(app)
        .put(`/api/v1/cart/items/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 2,
        })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/cart/items/:itemId', () => {
    let cartItemId;

    beforeEach(async () => {
      // Add item to cart first
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 2,
        });

      cartItemId = response.body.data.items[0]._id;
    });

    it('should remove item from cart', async () => {
      const response = await request(app)
        .delete(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
    });

    it('should return error for invalid item ID', async () => {
      await request(app)
        .delete(`/api/v1/cart/items/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/v1/cart/clear', () => {
    beforeEach(async () => {
      // Add items to cart first
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 2,
        });
    });

    it('should clear entire cart', async () => {
      const response = await request(app)
        .delete('/api/v1/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
    });
  });

  describe('GET /api/v1/cart/summary', () => {
    beforeEach(async () => {
      // Add items to cart first
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 3,
        });
    });

    it('should get cart summary', async () => {
      const response = await request(app)
        .get('/api/v1/cart/summary')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.itemCount).toBe(3);
      expect(response.body.data.uniqueItemCount).toBe(1);
      expect(response.body.data.subtotal).toBe(300);
      expect(response.body.data.total).toBe(300);
    });
  });

  describe('POST /api/v1/cart/validate', () => {
    beforeEach(async () => {
      // Add items to cart first
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 5,
        });
    });

    it('should validate cart items', async () => {
      const response = await request(app)
        .post('/api/v1/cart/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.issues).toHaveLength(0);
    });

    it('should detect invalid items when product is out of stock', async () => {
      // Update product to be out of stock
      await Product.findByIdAndUpdate(testProduct._id, {
        'inventory.quantity': 0,
      });

      const response = await request(app)
        .post('/api/v1/cart/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.issues.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/cart/merge', () => {
    let guestCart;

    beforeEach(async () => {
      // Create guest cart with items
      guestCart = await Cart.create({
        sessionId: sessionId,
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            price: testProduct.pricing.regular,
          },
        ],
        totals: {
          subtotal: 200,
          total: 200,
          itemCount: 2,
        },
      });
    });

    it('should merge guest cart with user cart after login', async () => {
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(2);
      expect(response.body.data.user).toBe(userId);

      // Guest cart should be removed
      const deletedGuestCart = await Cart.findById(guestCart._id);
      expect(deletedGuestCart).toBeNull();
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/cart/merge')
        .send({
          sessionId: sessionId,
        })
        .expect(401);
    });
  });
});
