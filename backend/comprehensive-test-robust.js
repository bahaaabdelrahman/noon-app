const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

class TestRunner {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.authToken = null;
    this.testUser = null;
  }

  log(message) {
    console.log(message);
    this.results.push(message);
  }

  async test(name, testFn) {
    try {
      this.log(`🔍 Testing ${name}...`);
      await testFn();
      this.passed++;
      this.log(`✅ ${name}: PASSED\n`);
    } catch (error) {
      this.failed++;
      this.log(`❌ ${name}: FAILED - ${error.message}\n`);
    }
  }

  async makeRequest(method, endpoint, data = null, token = null) {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.data = data;
    }

    return axios(config);
  }

  async runAllTests() {
    this.log('🧪 Starting Comprehensive E-Commerce Backend Tests');
    this.log('='.repeat(60));

    // Infrastructure Tests
    await this.test('Server Health', async () => {
      const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      this.log(`   Server is healthy - Status: ${response.status}`);
    });

    await this.test('Root Endpoint', async () => {
      const response = await axios.get(BASE_URL, { timeout: 5000 });
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`Root endpoint failed: ${response.status}`);
      }
      this.log(`   Root endpoint accessible`);
    });

    // Categories Tests
    await this.test('Get Categories', async () => {
      const response = await this.makeRequest('GET', '/categories');
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`Categories failed: ${response.status}`);
      }
      this.log(`   Retrieved ${response.data.count} categories`);
    });

    // Products Tests
    await this.test('Get Products', async () => {
      const response = await this.makeRequest('GET', '/products');
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`Products failed: ${response.status}`);
      }
      this.log(`   Retrieved ${response.data.count} products`);
    });

    // Authentication Tests
    const timestamp = Date.now();
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.${timestamp}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
    };

    await this.test('User Registration', async () => {
      try {
        const response = await this.makeRequest(
          'POST',
          '/auth/register',
          userData
        );
        if (response.status === 201 && response.data.success) {
          this.testUser = userData;
          this.log(`   User registered: ${userData.email}`);
        } else {
          throw new Error(
            `Registration failed: ${response.status} - ${response.data.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        if (error.response) {
          throw new Error(
            `Registration failed: ${error.response.status} - ${error.response.data?.message || error.message}`
          );
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Registration timed out - possible server issue');
        } else {
          throw error;
        }
      }
    });

    await this.test('User Login', async () => {
      if (!this.testUser) {
        throw new Error('No test user available');
      }

      const loginData = {
        email: this.testUser.email,
        password: this.testUser.password,
      };

      try {
        const response = await this.makeRequest(
          'POST',
          '/auth/login',
          loginData
        );
        if (
          response.status === 200 &&
          response.data.success &&
          response.data.data.token
        ) {
          this.authToken = response.data.data.token;
          this.log(`   Login successful, token received`);
        } else {
          throw new Error(`Login failed: ${response.status}`);
        }
      } catch (error) {
        if (error.response) {
          throw new Error(
            `Login failed: ${error.response.status} - ${error.response.data?.message || error.message}`
          );
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Login timed out - possible server issue');
        } else {
          throw error;
        }
      }
    });

    await this.test('Protected Endpoint Access', async () => {
      if (!this.authToken) {
        throw new Error('No auth token available');
      }

      const response = await this.makeRequest(
        'GET',
        '/auth/me',
        null,
        this.authToken
      );
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`Protected endpoint failed: ${response.status}`);
      }
      this.log(`   User profile retrieved successfully`);
    });

    // Cart Tests
    await this.test('Get Cart', async () => {
      const response = await this.makeRequest(
        'GET',
        '/cart',
        null,
        this.authToken
      );
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`Get cart failed: ${response.status}`);
      }
      this.log(`   Cart retrieved successfully`);
    });

    // Error Handling Tests
    await this.test('404 Error Handling', async () => {
      try {
        await this.makeRequest('GET', '/nonexistent');
        throw new Error('Should have returned 404');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          this.log(`   404 correctly returned for invalid endpoint`);
        } else {
          throw new Error(
            `Expected 404, got ${error.response?.status || 'no response'}`
          );
        }
      }
    });

    // Results Summary
    this.log('='.repeat(60));
    this.log('🎯 TEST SUMMARY');
    this.log('='.repeat(60));
    this.log(`Total Tests: ${this.passed + this.failed}`);
    this.log(`✅ Passed: ${this.passed}`);
    this.log(`❌ Failed: ${this.failed}`);
    this.log(
      `📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`
    );

    // Phase 6 Readiness
    const successRate = (this.passed / (this.passed + this.failed)) * 100;
    this.log('\\n🎯 PHASE 6 READINESS ASSESSMENT:');
    if (successRate >= 90) {
      this.log('✅ READY FOR PHASE 6 - All critical functionality working');
    } else if (successRate >= 75) {
      this.log('⚠️  MOSTLY READY - Some minor issues need attention');
    } else {
      this.log('❌ NOT READY - Major issues need to be resolved');
    }

    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.txt`;
    fs.writeFileSync(filename, this.results.join('\\n'));
    this.log(`\\n📄 Results saved to: ${filename}`);

    return this.failed === 0;
  }
}

// Run tests
const runner = new TestRunner();
runner
  .runAllTests()
  .then(success => {
    console.log(
      `\\n🏁 Testing complete - ${success ? 'All tests passed!' : 'Some tests failed'}`
    );
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  });
