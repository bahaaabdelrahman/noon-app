# E-Commerce API

A comprehensive e-commerce REST API built with Node.js, Express.js, and MongoDB.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 👥 **User Management** - Registration, login, profile management
- 🛍️ **Product Management** - CRUD operations, search, filtering, categories
- 🛒 **Shopping Cart** - Add/remove items, persistent cart
- 📦 **Order Processing** - Complete order lifecycle management
- 💳 **Payment Integration** - Stripe payment processing
- ⭐ **Reviews & Ratings** - Product review system
- 🎫 **Coupons & Discounts** - Flexible discount system
- 📊 **Admin Dashboard** - Comprehensive admin features
- 🔒 **Security** - Rate limiting, input validation, data sanitization
- 📧 **Email Integration** - Transactional emails
- 🖼️ **Image Upload** - Cloudinary integration for image management

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT)
- **Payment:** Stripe
- **Image Upload:** Cloudinary
- **Email:** Nodemailer
- **Testing:** Jest + Supertest
- **Documentation:** Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd e-commerce
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your-super-secure-jwt-secret
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   # ... other variables
   ```

4. **Start MongoDB**

   ```bash
   # Using MongoDB service
   sudo systemctl start mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the application**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

6. **Verify installation**
   ```bash
   curl http://localhost:3000/health
   ```

## API Documentation

### Base URL

```
Development: http://localhost:3000/api/v1
```

### Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Available Endpoints

#### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

#### Users

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/addresses` - Add address
- `PUT /api/v1/users/addresses/:id` - Update address
- `DELETE /api/v1/users/addresses/:id` - Delete address

#### Products

- `GET /api/v1/products` - Get all products (with filtering)
- `GET /api/v1/products/:slug` - Get single product
- `POST /api/v1/products` - Create product (Admin)
- `PUT /api/v1/products/:id` - Update product (Admin)
- `DELETE /api/v1/products/:id` - Delete product (Admin)

#### Categories

- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/categories/:slug` - Get single category
- `POST /api/v1/categories` - Create category (Admin)
- `PUT /api/v1/categories/:id` - Update category (Admin)
- `DELETE /api/v1/categories/:id` - Delete category (Admin)

#### Shopping Cart

- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/:productId` - Update cart item
- `DELETE /api/v1/cart/items/:productId` - Remove item from cart
- `DELETE /api/v1/cart` - Clear cart

#### Orders

- `GET /api/v1/orders` - Get user's orders
- `GET /api/v1/orders/:id` - Get single order
- `POST /api/v1/orders` - Create new order
- `PUT /api/v1/orders/:id/cancel` - Cancel order

## Development

### Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── validators/      # Input validation
```

### Available Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Database
npm run seed         # Seed database with sample data
npm run migrate      # Run database migrations
```

### Environment Variables

| Variable                | Description                          | Default                             |
| ----------------------- | ------------------------------------ | ----------------------------------- |
| `NODE_ENV`              | Environment (development/production) | development                         |
| `PORT`                  | Server port                          | 3000                                |
| `MONGODB_URI`           | MongoDB connection string            | mongodb://localhost:27017/ecommerce |
| `JWT_SECRET`            | JWT secret key                       | -                                   |
| `JWT_EXPIRES_IN`        | JWT expiration time                  | 24h                                 |
| `STRIPE_SECRET_KEY`     | Stripe secret key                    | -                                   |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                | -                                   |
| `EMAIL_FROM`            | From email address                   | -                                   |
| `SMTP_HOST`             | SMTP host                            | -                                   |

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Using Docker

1. **Build the image**

   ```bash
   docker build -t ecommerce-api .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 --env-file .env ecommerce-api
   ```

### Using PM2

1. **Install PM2**

   ```bash
   npm install -g pm2
   ```

2. **Start the application**
   ```bash
   pm2 start ecosystem.config.js
   ```

## Security

- **Authentication:** JWT-based authentication
- **Authorization:** Role-based access control
- **Rate Limiting:** Configurable rate limits
- **Input Validation:** Joi-based validation
- **Data Sanitization:** MongoDB injection prevention
- **XSS Protection:** Clean user inputs
- **CORS:** Configurable CORS policies
- **Security Headers:** Helmet.js integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@yourdomain.com or create an issue in the repository.
