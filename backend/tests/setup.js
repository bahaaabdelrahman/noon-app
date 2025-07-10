const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.BCRYPT_SALT_ROUNDS = '10';

  // Start in-memory MongoDB instance
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Connect to the in-memory database
  await mongoose.connect(uri);

  // Mock console.log to reduce noise in tests
  if (!process.env.DEBUG_TESTS) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

// Clean up database between tests
afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
});

// Global test cleanup
afterAll(async () => {
  // Close database connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  // Stop in-memory MongoDB instance
  if (mongod) {
    await mongod.stop();
  }

  // Restore console methods
  if (console.log.mockRestore) {
    console.log.mockRestore();
  }
  if (console.warn.mockRestore) {
    console.warn.mockRestore();
  }
});

// Increase test timeout for integration tests
jest.setTimeout(30000);
