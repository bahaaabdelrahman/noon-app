const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

class ECommerceOrderFlowTest {
  constructor() {
    this.authToken = null;
    this.userId = null;
    this.productId = null;
    this.orderId = null;
    this.orderNumber = null;
  }

  async runCompleteTest() {
    console.log('🚀 Starting E-Commerce Order Flow Test\n');

    try {
      await this.checkServerHealth();
      await this.getProducts();
      await this.registerUser();
      await this.loginUser();
      await this.addToCart();
      await this.getCartSummary();
      await this.checkout();
      await this.getUserOrders();
      await this.getSpecificOrder();
      await this.updateOrderStatus();
      await this.updatePaymentStatus();

      console.log('✅ All tests passed! Order flow is working correctly.\n');
      return true;
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      return false;
    }
  }

  async checkServerHealth() {
    console.log('1. Checking server health...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('   ✅ Server is healthy\n');
  }

  async getProducts() {
    console.log('2. Getting available products...');
    const response = await axios.get(`${API_BASE}/products`);

    if (response.data.data && response.data.data.length > 0) {
      this.productId = response.data.data[0]._id;
      console.log(
        `   ✅ Found ${response.data.data.length} products, using: ${this.productId}\n`
      );
    } else {
      throw new Error('No products found in database');
    }
  }

  async registerUser() {
    console.log('3. Registering test user...');
    const timestamp = Date.now();
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.flow.${timestamp}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
    };

    const response = await axios.post(`${API_BASE}/auth/register`, userData);
    console.log('   ✅ User registered successfully\n');
    this.userEmail = userData.email;
  }

  async loginUser() {
    console.log('4. Logging in user...');
    const loginData = {
      email: this.userEmail,
      password: 'Password123!',
    };

    const response = await axios.post(`${API_BASE}/auth/login`, loginData);
    this.authToken = response.data.data.token;
    this.userId = response.data.data.user.id;
    console.log('   ✅ User logged in successfully\n');
  }

  async addToCart() {
    console.log('5. Adding product to cart...');
    const cartData = {
      productId: this.productId,
      quantity: 2,
    };

    const response = await axios.post(`${API_BASE}/cart/items`, cartData, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });

    console.log(`   ✅ Added ${cartData.quantity} items to cart\n`);
  }

  async getCartSummary() {
    console.log('6. Getting cart summary...');
    const response = await axios.get(`${API_BASE}/cart/summary`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });

    const { itemCount, subtotal } = response.data.data;
    console.log(`   ✅ Cart has ${itemCount} items, subtotal: $${subtotal}\n`);
  }

  async checkout() {
    console.log('7. Creating order (checkout)...');
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
        token: 'test_token_automated_test',
      },
      notes: 'Automated test order',
    };

    const response = await axios.post(`${API_BASE}/orders`, orderData, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });

    this.orderId = response.data.data._id;
    this.orderNumber = response.data.data.orderNumber;
    console.log(
      `   ✅ Order created: ${this.orderNumber} (ID: ${this.orderId})\n`
    );
  }

  async getUserOrders() {
    console.log('8. Getting user orders...');
    const response = await axios.get(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });

    console.log(`   ✅ User has ${response.data.data.length} orders\n`);
  }

  async getSpecificOrder() {
    console.log('9. Getting specific order...');
    const response = await axios.get(`${API_BASE}/orders/${this.orderId}`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });

    console.log(`   ✅ Retrieved order ${response.data.data.orderNumber}\n`);
  }

  async updateOrderStatus() {
    console.log('10. Updating order status...');
    const statusData = {
      status: 'confirmed',
      statusNote: 'Order confirmed by automated test',
    };

    const response = await axios.patch(
      `${API_BASE}/orders/${this.orderId}/status`,
      statusData,
      {
        headers: { Authorization: `Bearer ${this.authToken}` },
      }
    );

    console.log(
      `   ✅ Order status updated to: ${response.data.data.status}\n`
    );
  }

  async updatePaymentStatus() {
    console.log('11. Updating payment status...');
    const paymentData = {
      paymentStatus: 'paid',
      transactionId: 'test_txn_automated_' + Date.now(),
    };

    const response = await axios.patch(
      `${API_BASE}/orders/${this.orderId}/payment`,
      paymentData,
      {
        headers: { Authorization: `Bearer ${this.authToken}` },
      }
    );

    console.log(
      `   ✅ Payment status updated to: ${response.data.data.payment.status}\n`
    );
  }
}

// Run the test
async function main() {
  const test = new ECommerceOrderFlowTest();
  const success = await test.runCompleteTest();

  if (success) {
    console.log('🎉 Complete order flow test PASSED!');
    process.exit(0);
  } else {
    console.log('💥 Complete order flow test FAILED!');
    process.exit(1);
  }
}

// Install axios if not available
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ECommerceOrderFlowTest;
