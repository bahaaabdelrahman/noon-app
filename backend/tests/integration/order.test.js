const request = require('supertest');
const createApp = require('../../src/app');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');
const Cart = require('../../src/models/Cart');
const Order = require('../../src/models/Order');

describe('Order Integration Tests', () => {
  let app;
  let authToken;
  let userId;
  let testUser;
  let testProduct;
  let testCategory;

  beforeAll(async () => {
    app = createApp();
  });

  beforeEach(async () => {
    // Clean up existing test data
    await User.deleteMany({ email: /test.*@example\.com/ });
    await Product.deleteMany({ sku: /TEST-/ });
    await Category.deleteMany({ slug: /test-/ });
    await Cart.deleteMany({});
    await Order.deleteMany({});

    // Create test category
    testCategory = new Category({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category for integration tests',
      isActive: true,
    });
    await testCategory.save();

    // Create test product
    testProduct = new Product({
      name: 'Test Product',
      slug: 'test-product',
      sku: 'TEST-001',
      description: 'Test product for integration tests',
      category: testCategory._id,
      pricing: {
        price: 29.99,
        compareAtPrice: 39.99,
        cost: 15.0,
      },
      inventory: {
        quantity: 100,
        trackQuantity: true,
        allowBackorder: false,
        lowStockThreshold: 10,
      },
      status: 'active',
      visibility: 'public',
      images: [
        {
          url: 'https://example.com/test-image.jpg',
          publicId: 'test-image-123',
          alt: 'Test Product Image',
          isMain: true,
        },
      ],
    });
    await testProduct.save();

    // Register test user
    const userResponse = await request(app).post('/api/v1/auth/register').send({
      firstName: 'Test',
      lastName: 'User',
      email: 'test.order@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(userResponse.status).toBe(201);

    // Login to get auth token
    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'test.order@example.com',
      password: 'Password123!',
    });

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body.data.token;
    userId = loginResponse.body.data.user.id;
    testUser = loginResponse.body.data.user;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: /test.*@example\.com/ });
    await Product.deleteMany({ sku: /TEST-/ });
    await Category.deleteMany({ slug: /test-/ });
    await Cart.deleteMany({});
    await Order.deleteMany({});
  });

  describe('Complete Order Flow', () => {
    let cartResponse;
    let orderResponse;

    test('should add product to cart', async () => {
      const response = await request(app)
        .post('/api/v1/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(2);
      expect(response.body.data.totals.subtotal).toBe(59.98);

      cartResponse = response;
    });

    test('should get cart summary', async () => {
      const response = await request(app)
        .get('/api/v1/cart/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.itemCount).toBe(2);
      expect(response.body.data.subtotal).toBe(59.98);
    });

    test('should checkout and create order', async () => {
      const orderData = {
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          company: '',
          address1: '123 Test Street',
          address2: '',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
          phone: '+1234567890',
        },
        billingAddress: {
          firstName: 'Test',
          lastName: 'User',
          company: '',
          address1: '123 Test Street',
          address2: '',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
          phone: '+1234567890',
        },
        paymentMethod: 'stripe',
        paymentDetails: {
          token: 'test_token_123',
        },
        notes: 'Test order',
      };

      const response = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.toString()).toBe(userId);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.orderItems).toHaveLength(1);
      expect(response.body.data.orderItems[0].quantity).toBe(2);
      expect(response.body.data.totals.subtotal).toBe(59.98);
      expect(response.body.data.orderNumber).toBeDefined();

      orderResponse = response;
    });

    test('should get user orders', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].orderNumber).toBe(
        orderResponse.body.data.orderNumber
      );
    });

    test('should get order by ID', async () => {
      const orderId = orderResponse.body.data._id;
      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(orderId);
      expect(response.body.data.orderNumber).toBe(
        orderResponse.body.data.orderNumber
      );
    });

    test('should get order by order number', async () => {
      const orderNumber = orderResponse.body.data.orderNumber;
      const response = await request(app)
        .get(`/api/v1/orders/number/${orderNumber}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderNumber).toBe(orderNumber);
    });

    test('should update order status', async () => {
      const orderId = orderResponse.body.data._id;
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'confirmed',
          statusNote: 'Order confirmed by test',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');
      expect(response.body.data.statusHistory).toHaveLength(2); // pending + confirmed
    });

    test('should update payment status', async () => {
      const orderId = orderResponse.body.data._id;
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentStatus: 'paid',
          transactionId: 'test_transaction_123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.status).toBe('paid');
      expect(response.body.data.payment.transactionId).toBe(
        'test_transaction_123'
      );
    });

    test('should not allow cancelling a paid order', async () => {
      const orderId = orderResponse.body.data._id;
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Test cancellation',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('paid');
    });
  });

  describe('Order Edge Cases', () => {
    test('should fail checkout with empty cart', async () => {
      // Clear the cart first
      await request(app)
        .delete('/api/v1/cart/clear')
        .set('Authorization', `Bearer ${authToken}`);

      const orderData = {
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address1: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        billingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address1: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        paymentMethod: 'stripe',
        paymentDetails: {
          token: 'test_token_123',
        },
      };

      const response = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cart is empty');
    });

    test('should fail checkout with insufficient inventory', async () => {
      // Add more items than available
      await request(app)
        .post('/api/v1/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 150, // More than the 100 available
        });

      const orderData = {
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address1: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        billingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address1: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        paymentMethod: 'stripe',
        paymentDetails: {
          token: 'test_token_123',
        },
      };

      const response = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('sufficient inventory');
    });
  });

  describe('Order Authorization', () => {
    test('should not access orders without authentication', async () => {
      const response = await request(app).get('/api/v1/orders');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should not access other user orders', async () => {
      // Create another user
      const anotherUserResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Another',
          lastName: 'User',
          email: 'test.another@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      const anotherLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test.another@example.com',
          password: 'Password123!',
        });

      const anotherAuthToken = anotherLoginResponse.body.data.token;

      // Try to access the first user's orders
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${anotherAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0); // Should be empty for the new user
    });
  });
});
