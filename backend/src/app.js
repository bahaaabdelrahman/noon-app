const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const { logger } = require('./utils/logger');
const { globalErrorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerConfig');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const wishlistRoutes = require('./routes/wishlists');
const searchRoutes = require('./routes/search');
// const adminRoutes = require('./routes/admin');

/**
 * Create Express application
 */
const createApp = () => {
  const app = express();

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // CORS configuration
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  };

  // Security middleware
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    })
  );

  app.use(cors(corsOptions));

  // Rate limiting
  app.use(generalLimiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(
    hpp({
      whitelist: ['sort', 'fields', 'page', 'limit', 'category', 'tags'],
    })
  );

  // Compression middleware
  app.use(compression());

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // HTTP request logger
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: logger.stream }));
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  });

  // API routes
  const apiRouter = express.Router();

  // Mount routes
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/products', productRoutes);
  apiRouter.use('/categories', categoryRoutes);
  apiRouter.use('/cart', cartRoutes);
  apiRouter.use('/orders', orderRoutes);
  apiRouter.use('/reviews', reviewRoutes); // Standalone review operations
  apiRouter.use('/wishlists', wishlistRoutes); // Wishlist operations
  apiRouter.use('/search', searchRoutes); // Advanced search functionality
  // apiRouter.use('/admin', adminRoutes);

  // Mount API router
  app.use(`/api/${process.env.API_VERSION || 'v1'}`, apiRouter);

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Root endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to E-Commerce API',
      version: process.env.API_VERSION || 'v1',
      documentation: `/api/${process.env.API_VERSION || 'v1'}/docs`,
    });
  });

  // Handle undefined routes
  app.all('*', notFound);

  // Global error handling middleware
  app.use(globalErrorHandler);

  return app;
};

module.exports = createApp;
