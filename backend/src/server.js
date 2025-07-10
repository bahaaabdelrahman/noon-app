require('dotenv').config();
const createApp = require('./app');
const database = require('./config/database');
const { logger } = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error('Error:', err);
  process.exit(1);
});

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();

    // Create Express app
    const app = createApp();

    // Start server
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
      );
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(
        `API Base URL: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`
      );
    });

    // Graceful shutdown
    const gracefulShutdown = signal => {
      logger.info(`${signal} received. Closing HTTP server...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await database.gracefulShutdown();
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
        }
        process.exit(0);
      });
    };

    // Handle unhandled promise rejections
    process.on('unhandledRejection', err => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
      logger.error('Error:', err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = startServer;
