const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

/**
 * Database connection configuration
 */
class Database {
  constructor() {
    this.mongoUrl =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    this.options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      await mongoose.connect(this.mongoUrl, this.options);
      logger.info('Connected to MongoDB successfully');

      // Handle connection events
      mongoose.connection.on('error', error => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', this.gracefulShutdown);
      process.on('SIGTERM', this.gracefulShutdown);
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during MongoDB shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }
}

module.exports = new Database();
