const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

class ComprehensiveECommerceTest {
  constructor() {
    this.authToken = null;
    this.adminToken = null;
    this.userId = null;
    this.productId = null;
    this.categoryId = null;
    this.orderId = null;
    this.cartItemId = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive E-Commerce Backend Tests\n');
    console.log('='.repeat(60));

    try {
      // Infrastructure Tests
      await this.testServerHealth();

      // Authentication Tests
      await this.testAuthenticationFlow();

      // Category Tests
      await this.testCategoryManagement();

      // Product Tests
      await this.testProductManagement();

      // Cart Tests
      await this.testCartFunctionality();

      // Order Tests
      await this.testOrderManagement();

      // Error Handling Tests
      await this.testErrorHandling();

      this.printTestSummary();
      return this.testResults.failed === 0;
    } catch (error) {
      console.error('❌ Critical test failure:', error.message);
      return false;
    }
  }

  async testServerHealth() {
    console.log('\n📊 Testing Server Infrastructure');
    console.log('-'.repeat(40));

    await this.runTest('Server Health Check', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      this.assertStatus(response, 200);
      this.assert(
        response.data.success === true,
        'Health check should return success'
      );
    });
  }

  async testAuthenticationFlow() {
    console.log('\n🔐 Testing Authentication System');
    console.log('-'.repeat(40));

    const timestamp = Date.now();
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.${timestamp}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
    };

    await this.runTest('User Registration', async () => {
      const response = await axios.post(`${API_BASE}/auth/register`, userData);
      this.assertStatus(response, 201);
      this.assert(
        response.data.success === true,
        'Registration should succeed'
      );
      this.assert(
        response.data.data.user.email === userData.email,
        'Email should match'
      );
    });

    await this.runTest('User Login', async () => {
      const loginData = {
        email: userData.email,
        password: userData.password,
      };
      const response = await axios.post(`${API_BASE}/auth/login`, loginData);
      this.assertStatus(response, 200);
      this.assert(response.data.success === true, 'Login should succeed');
      this.assert(response.data.data.token, 'Should return auth token');

      this.authToken = response.data.data.token;
      this.userId = response.data.data.user.id;
    });

    await this.runTest('Protected Route Access', async () => {
      const response = await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });
      this.assertStatus(response, 200);
      this.assert(
        response.data.data.email === userData.email,
        'Profile should match logged in user'
      );
    });

    await this.runTest('Invalid Login', async () => {
      try {
        await axios.post(`${API_BASE}/auth/login`, {
          email: userData.email,
          password: 'wrongpassword',
        });
        this.assert(false, 'Should not login with wrong password');
      } catch (error) {
        this.assertStatus(error.response, 401);
      }
    });
  }

  async testCategoryManagement() {
    console.log('\n📁 Testing Category Management');
    console.log('-'.repeat(40));

    const categoryData = {
      name: 'Test Category',
      description: 'A test category for integration testing',
      isActive: true,
      isFeatured: false,
    };

    await this.runTest('Create Category', async () => {
      const response = await axios.post(
        `${API_BASE}/categories`,
        categoryData,
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
        }
      );
      this.assertStatus(response, 201);
      this.assert(
        response.data.success === true,
        'Category creation should succeed'
      );
      this.assert(
        response.data.data.name === categoryData.name,
        'Category name should match'
      );

      this.categoryId = response.data.data._id;
    });

    await this.runTest('Get All Categories', async () => {
      const response = await axios.get(`${API_BASE}/categories`);
      this.assertStatus(response, 200);
      this.assert(
        Array.isArray(response.data.data),
        'Should return array of categories'
      );
      this.assert(
        response.data.data.length > 0,
        'Should have at least one category'
      );
    });

    await this.runTest('Get Single Category', async () => {
      const response = await axios.get(
        `${API_BASE}/categories/${this.categoryId}`
      );
      this.assertStatus(response, 200);
      this.assert(
        response.data.data._id === this.categoryId,
        'Should return correct category'
      );
    });

    await this.runTest('Update Category', async () => {
      const updateData = { name: 'Updated Test Category' };
      const response = await axios.put(
        `${API_BASE}/categories/${this.categoryId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
        }
      );
      this.assertStatus(response, 200);
      this.assert(
        response.data.data.name === updateData.name,
        'Category name should be updated'
      );
    });
  }

  async testProductManagement() {
    console.log('\n📦 Testing Product Management');
    console.log('-'.repeat(40));

    const productData = {
      name: 'Test Product',
      description: 'A comprehensive test product for integration testing',
      category: this.categoryId,
      sku: `TEST-${Date.now()}`,
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
    };

    await this.runTest('Create Product', async () => {
      const response = await axios.post(`${API_BASE}/products`, productData, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });
      this.assertStatus(response, 201);
      this.assert(
        response.data.success === true,
        'Product creation should succeed'
      );
      this.assert(
        response.data.data.name === productData.name,
        'Product name should match'
      );

      this.productId = response.data.data._id;
    });

    await this.runTest('Get All Products', async () => {
      const response = await axios.get(`${API_BASE}/products`);
      this.assertStatus(response, 200);
      this.assert(
        Array.isArray(response.data.data),
        'Should return array of products'
      );
      this.assert(
        response.data.data.length > 0,
        'Should have at least one product'
      );
    });

    await this.runTest('Get Single Product', async () => {
      const response = await axios.get(
        `${API_BASE}/products/${this.productId}`
      );
      this.assertStatus(response, 200);
      this.assert(
        response.data.data._id === this.productId,
        'Should return correct product'
      );
    });

    await this.runTest('Update Product', async () => {
      const updateData = {
        name: 'Updated Test Product',
        pricing: { ...productData.pricing, price: 34.99 },
      };
      const response = await axios.put(
        `${API_BASE}/products/${this.productId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
        }
      );
      this.assertStatus(response, 200);
      this.assert(
        response.data.data.name === updateData.name,
        'Product name should be updated'
      );
    });

    await this.runTest('Search Products', async () => {
      const response = await axios.get(`${API_BASE}/products?search=Test`);
      this.assertStatus(response, 200);
      this.assert(response.data.data.length > 0, 'Should find test products');
    });

    await this.runTest('Filter Products by Category', async () => {
      const response = await axios.get(
        `${API_BASE}/products?category=${this.categoryId}`
      );
      this.assertStatus(response, 200);
      this.assert(
        response.data.data.length > 0,
        'Should find products in category'
      );
    });
  }

  async testCartFunctionality() {
    console.log('\n🛒 Testing Shopping Cart');
    console.log('-'.repeat(40));

    await this.runTest('Get Empty Cart', async () => {
      const response = await axios.get(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });
      this.assertStatus(response, 200);
      this.assert(
        response.data.success === true,
        'Cart retrieval should succeed'
      );
    });

    await this.runTest('Add Item to Cart', async () => {
      const cartData = {
        productId: this.productId,
        quantity: 2,
      };
      const response = await axios.post(`${API_BASE}/cart/items`, cartData, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });
      this.assertStatus(response, 200);
      this.assert(
        response.data.data.items.length > 0,
        'Cart should have items'
      );
      this.assert(
        response.data.data.items[0].quantity === 2,
        'Quantity should match'
      );

      this.cartItemId = response.data.data.items[0]._id;
    });

    await this.runTest('Get Cart Summary', async () => {
      const response = await axios.get(`${API_BASE}/cart/summary`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });
      this.assertStatus(response, 200);
      this.assert(response.data.data.itemCount === 2, 'Item count should be 2');
      this.assert(
        response.data.data.subtotal > 0,
        'Subtotal should be greater than 0'
      );
    });

    await this.runTest('Update Cart Item', async () => {
      const updateData = { quantity: 3 };
      const response = await axios.put(
        `${API_BASE}/cart/items/${this.cartItemId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
        }
      );
      this.assertStatus(response, 200);
      this.assert(
        response.data.data.items[0].quantity === 3,
        'Quantity should be updated'
      );
    });

    await this.runTest('Validate Cart', async () => {
      const response = await axios.post(
        `${API_BASE}/cart/validate`,
        {},
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
        }
      );
      this.assertStatus(response, 200);
      this.assert(
        response.data.success === true,
        'Cart validation should succeed'
      );
    });
  }

  async testOrderManagement() {
    console.log('\n📋 Testing Order Management');
    console.log('-'.repeat(40));

    const orderData = {
      shippingAddress: {
        firstName: 'Test',
        lastName: 'User',
        address1: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US',
        phone: '+1234567890',
      },
      billingAddress: {
        firstName: 'Test',
        lastName: 'User',
        address1: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US',
        phone: '+1234567890',
      },
      paymentMethod: 'stripe',
      paymentDetails: {
        token: 'test_token_comprehensive_test',
      },
      notes: 'Comprehensive test order',
    };

    await this.runTest('Create Order (Checkout)', async () => {
      const response = await axios.post(`${API_BASE}/orders`, orderData, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });
      this.assertStatus(response, 201);
      this.assert(
        response.data.success === true,
        'Order creation should succeed'
      );
      this.assert(
        response.data.data.orderNumber,
        'Order should have order number'
      );
      this.assert(
        response.data.data.orderItems.length > 0,
        'Order should have items'
      );

      this.orderId = response.data.data._id;
      this.orderNumber = response.data.data.orderNumber;
    });

    await this.runTest('Get User Orders', async () => {
      const response = await axios.get(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });
      this.assertStatus(response, 200);
      this.assert(response.data.data.length > 0, 'User should have orders');
    });

    await this.runTest('Get Order by ID', async () => {
      const response = await axios.get(`${API_BASE}/orders/${this.orderId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });
      this.assertStatus(response, 200);
      this.assert(
        response.data.data._id === this.orderId,
        'Should return correct order'
      );
    });

    await this.runTest('Get Order by Number', async () => {
      const response = await axios.get(
        `${API_BASE}/orders/number/${this.orderNumber}`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
        }
      );
      this.assertStatus(response, 200);
      this.assert(
        response.data.data.orderNumber === this.orderNumber,
        'Should return correct order'
      );
    });

    await this.runTest('Update Order Status', async () => {
      const statusData = {
        status: 'confirmed',
        statusNote: 'Order confirmed by comprehensive test',
      };
      const response = await axios.patch(
        `${API_BASE}/orders/${this.orderId}/status`,
        statusData,
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
        }
      );
      this.assertStatus(response, 200);
      this.assert(
        response.data.data.status === 'confirmed',
        'Order status should be updated'
      );
    });

    await this.runTest('Update Payment Status', async () => {
      const paymentData = {
        paymentStatus: 'paid',
        transactionId: 'test_txn_comprehensive_' + Date.now(),
      };
      const response = await axios.patch(
        `${API_BASE}/orders/${this.orderId}/payment`,
        paymentData,
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
        }
      );
      this.assertStatus(response, 200);
      this.assert(
        response.data.data.payment.status === 'paid',
        'Payment status should be updated'
      );
    });
  }

  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling');
    console.log('-'.repeat(40));

    await this.runTest('Unauthorized Access', async () => {
      try {
        await axios.post(`${API_BASE}/products`, { name: 'Test' });
        this.assert(false, 'Should require authentication');
      } catch (error) {
        this.assertStatus(error.response, 401);
      }
    });

    await this.runTest('Invalid Product ID', async () => {
      try {
        await axios.get(`${API_BASE}/products/invalid-id`);
        this.assert(false, 'Should return 404 for invalid ID');
      } catch (error) {
        this.assertStatus(error.response, 400);
      }
    });

    await this.runTest('Validation Error', async () => {
      try {
        await axios.post(`${API_BASE}/auth/register`, {
          email: 'invalid-email',
          password: '123',
        });
        this.assert(false, 'Should fail validation');
      } catch (error) {
        this.assertStatus(error.response, 422);
      }
    });

    await this.runTest('Non-existent Endpoint', async () => {
      try {
        await axios.get(`${API_BASE}/nonexistent`);
        this.assert(false, 'Should return 404 for non-existent endpoint');
      } catch (error) {
        this.assertStatus(error.response, 404);
      }
    });
  }

  // Utility methods
  async runTest(testName, testFunction) {
    try {
      await testFunction();
      console.log(`   ✅ ${testName}`);
      this.testResults.passed++;
      this.testResults.tests.push({ name: testName, status: 'PASS' });
    } catch (error) {
      console.log(`   ❌ ${testName}: ${error.message}`);
      this.testResults.failed++;
      this.testResults.tests.push({
        name: testName,
        status: 'FAIL',
        error: error.message,
      });
    }
  }

  assertStatus(response, expectedStatus) {
    if (response.status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, got ${response.status}`
      );
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  printTestSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(
      `Total Tests: ${this.testResults.passed + this.testResults.failed}`
    );
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(
      `Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`
    );

    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => console.log(`   - ${test.name}: ${test.error}`));
    }

    console.log(
      '\n' +
        (this.testResults.failed === 0
          ? '🎉 ALL TESTS PASSED!'
          : '⚠️ SOME TESTS FAILED')
    );
    console.log('='.repeat(60));
  }
}

// Run the comprehensive tests
async function main() {
  const tester = new ComprehensiveECommerceTest();
  const success = await tester.runAllTests();

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ComprehensiveECommerceTest;
