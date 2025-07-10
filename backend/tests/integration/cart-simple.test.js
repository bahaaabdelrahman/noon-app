const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../../src/app');

describe('Cart API Simple Test', () => {
  let app;

  beforeAll(async () => {
    app = createApp();
  });

  afterAll(async () => {
    // Cleanup handled by global setup
  });

  describe('GET /api/v1/cart - Basic Test', () => {
    it('should return empty cart when no session ID or auth provided', async () => {
      const response = await request(app).get('/api/v1/cart').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toEqual([]);
    });

    it('should work with session ID', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('x-session-id', 'test-session-simple')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toEqual([]);
    });
  });
});
