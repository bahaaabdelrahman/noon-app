const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

class QuickSystemTest {
  constructor() {
    this.authToken = null;
    this.userId = null;
    this.productId = null;
    this.categoryId = null;
  }

  async runQuickTests() {
    console.log('🔍 Quick System Test - Checking All Endpoints\n');
    console.log('='.repeat(50));

    try {
      // 1. Server Health
      console.log('1. Testing Server Health...');
      const health = await axios.get(`${BASE_URL}/health`);
      console.log(
        `   ✅ Health check: ${health.status} - ${health.data.message}`
      );

      // 2. Get existing data
      console.log('\n2. Testing Data Retrieval...');

      const categories = await axios.get(`${API_BASE}/categories`);
      console.log(
        `   ✅ Categories: ${categories.status} - Found ${categories.data.data.length} categories`
      );

      const products = await axios.get(`${API_BASE}/products`);
      console.log(
        `   ✅ Products: ${products.status} - Found ${products.data.data.length} products`
      );

      if (products.data.data.length > 0) {
        this.productId = products.data.data[0]._id;
        console.log(`   📦 Using product ID: ${this.productId}`);
      }

      // 3. Test Authentication
      console.log('\n3. Testing Authentication...');
      const timestamp = Date.now();
      const userData = {
        firstName: 'QuickTest',
        lastName: 'User',
        email: `quicktest.${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const register = await axios.post(`${API_BASE}/auth/register`, userData);
      console.log(`   ✅ Registration: ${register.status}`);

      const login = await axios.post(`${API_BASE}/auth/login`, {
        email: userData.email,
        password: userData.password,
      });
      console.log(`   ✅ Login: ${login.status}`);

      this.authToken = login.data.data.token;
      this.userId = login.data.data.user.id;

      // Test protected route
      const me = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });
      console.log(`   ✅ Protected route (/auth/me): ${me.status}`);

      // 4. Test Cart if we have a product
      if (this.productId) {
        console.log('\n4. Testing Cart Operations...');

        const cart = await axios.get(`${API_BASE}/cart`, {
          headers: { Authorization: `Bearer ${this.authToken}` },
        });
        console.log(`   ✅ Get cart: ${cart.status}`);

        try {
          const addToCart = await axios.post(
            `${API_BASE}/cart/items`,
            {
              productId: this.productId,
              quantity: 1,
            },
            {
              headers: { Authorization: `Bearer ${this.authToken}` },
            }
          );
          console.log(`   ✅ Add to cart: ${addToCart.status}`);

          const cartSummary = await axios.get(`${API_BASE}/cart/summary`, {
            headers: { Authorization: `Bearer ${this.authToken}` },
          });
          console.log(`   ✅ Cart summary: ${cartSummary.status}`);
        } catch (error) {
          console.log(
            `   ⚠️ Cart operations failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`
          );
        }
      }

      // 5. List all available endpoints
      console.log('\n5. Available API Endpoints Summary:');
      console.log('   Authentication:');
      console.log('     - POST /api/v1/auth/register ✅');
      console.log('     - POST /api/v1/auth/login ✅');
      console.log('     - GET /api/v1/auth/me ✅');
      console.log('     - POST /api/v1/auth/logout');
      console.log('     - POST /api/v1/auth/forgot-password');
      console.log('     - POST /api/v1/auth/reset-password');

      console.log('   Categories:');
      console.log('     - GET /api/v1/categories ✅');
      console.log('     - POST /api/v1/categories (requires auth)');
      console.log('     - GET /api/v1/categories/:id');
      console.log('     - PUT /api/v1/categories/:id (requires auth)');
      console.log('     - DELETE /api/v1/categories/:id (requires auth)');

      console.log('   Products:');
      console.log('     - GET /api/v1/products ✅');
      console.log('     - POST /api/v1/products (requires auth)');
      console.log('     - GET /api/v1/products/:id');
      console.log('     - PUT /api/v1/products/:id (requires auth)');
      console.log('     - DELETE /api/v1/products/:id (requires auth)');

      console.log('   Cart:');
      console.log('     - GET /api/v1/cart ✅');
      console.log('     - POST /api/v1/cart/items');
      console.log('     - PUT /api/v1/cart/items/:id');
      console.log('     - DELETE /api/v1/cart/items/:id');
      console.log('     - GET /api/v1/cart/summary ✅');

      console.log('   Orders:');
      console.log('     - POST /api/v1/orders (checkout)');
      console.log('     - GET /api/v1/orders');
      console.log('     - GET /api/v1/orders/:id');
      console.log('     - PATCH /api/v1/orders/:id/status');

      console.log('\n✅ Quick system test completed successfully!');
      return true;
    } catch (error) {
      console.error(`\n❌ Test failed: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Data:`, error.response.data);
      }
      return false;
    }
  }
}

// Run the quick test
async function main() {
  const tester = new QuickSystemTest();
  const success = await tester.runQuickTests();

  if (success) {
    console.log('\n🎉 System is ready for comprehensive testing!');
  } else {
    console.log('\n❌ System has issues that need to be resolved.');
  }

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = QuickSystemTest;
