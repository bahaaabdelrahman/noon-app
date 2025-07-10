# E-Commerce API Design Specification

## API Overview

This document provides comprehensive specifications for the e-commerce REST API built with Node.js, Express.js, and MongoDB.

### Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.yourdomain.com/v1
```

### Authentication
- **Type:** Bearer Token (JWT)
- **Header:** `Authorization: Bearer <token>`
- **Token Expiry:** 24 hours (configurable)
- **Refresh Token:** 7 days (configurable)

### Response Format
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

### Error Response Format
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

## 1. Authentication & Authorization

### 1.1 User Registration
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f7b1c2d4a5e6f7g8h9i0j1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "customer",
      "isActive": true,
      "emailVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "message": "Registration successful. Please verify your email."
}
```

### 1.2 User Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f7b1c2d4a5e6f7g8h9i0j1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "customer"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "message": "Login successful"
}
```

### 1.3 Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.4 Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

### 1.5 Forgot Password
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

### 1.6 Reset Password
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "password-reset-token",
  "newPassword": "NewSecurePassword123!"
}
```

## 2. User Management

### 2.1 Get User Profile
```http
GET /api/v1/users/profile
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f7b1c2d4a5e6f7g8h9i0j1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "role": "customer",
      "addresses": [
        {
          "id": "64f7b1c2d4a5e6f7g8h9i0j2",
          "type": "home",
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA",
          "isDefault": true
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 2.2 Update User Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567891"
}
```

### 2.3 Add Address
```http
POST /api/v1/users/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "work",
  "street": "456 Business Ave",
  "city": "New York",
  "state": "NY",
  "zipCode": "10002",
  "country": "USA",
  "isDefault": false
}
```

### 2.4 Update Address
```http
PUT /api/v1/users/addresses/64f7b1c2d4a5e6f7g8h9i0j2
Authorization: Bearer <token>
Content-Type: application/json

{
  "street": "789 Updated St",
  "isDefault": true
}
```

### 2.5 Delete Address
```http
DELETE /api/v1/users/addresses/64f7b1c2d4a5e6f7g8h9i0j2
Authorization: Bearer <token>
```

## 3. Products

### 3.1 Get All Products
```http
GET /api/v1/products?page=1&limit=10&category=electronics&minPrice=100&maxPrice=1000&sort=price&search=laptop
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)
- `category` (string): Filter by category slug
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sort` (string): Sort by (price, name, rating, newest)
- `search` (string): Search term
- `featured` (boolean): Filter featured products

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "64f7b1c2d4a5e6f7g8h9i0j3",
        "name": "Gaming Laptop",
        "slug": "gaming-laptop",
        "description": "High-performance gaming laptop",
        "shortDescription": "Perfect for gaming and work",
        "sku": "LAPTOP-001",
        "price": 1299.99,
        "comparePrice": 1499.99,
        "category": {
          "id": "64f7b1c2d4a5e6f7g8h9i0j4",
          "name": "Electronics",
          "slug": "electronics"
        },
        "images": [
          {
            "url": "https://example.com/laptop-1.jpg",
            "alt": "Gaming Laptop Front View",
            "isMain": true
          }
        ],
        "inStock": true,
        "quantity": 50,
        "rating": {
          "average": 4.5,
          "count": 128
        },
        "isFeatured": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

### 3.2 Get Single Product
```http
GET /api/v1/products/gaming-laptop
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "64f7b1c2d4a5e6f7g8h9i0j3",
      "name": "Gaming Laptop",
      "slug": "gaming-laptop",
      "description": "Detailed product description...",
      "shortDescription": "Perfect for gaming and work",
      "sku": "LAPTOP-001",
      "price": 1299.99,
      "comparePrice": 1499.99,
      "category": {
        "id": "64f7b1c2d4a5e6f7g8h9i0j4",
        "name": "Electronics",
        "slug": "electronics"
      },
      "images": [
        {
          "url": "https://example.com/laptop-1.jpg",
          "alt": "Gaming Laptop Front View",
          "isMain": true
        },
        {
          "url": "https://example.com/laptop-2.jpg",
          "alt": "Gaming Laptop Side View",
          "isMain": false
        }
      ],
      "variants": [
        {
          "name": "RAM",
          "options": ["8GB", "16GB", "32GB"]
        },
        {
          "name": "Storage",
          "options": ["512GB SSD", "1TB SSD"]
        }
      ],
      "specifications": {
        "weight": 2.5,
        "dimensions": {
          "length": 35.5,
          "width": 24.2,
          "height": 2.0
        },
        "processor": "Intel Core i7",
        "graphics": "NVIDIA RTX 3070"
      },
      "inStock": true,
      "quantity": 50,
      "rating": {
        "average": 4.5,
        "count": 128
      },
      "reviews": [
        {
          "id": "64f7b1c2d4a5e6f7g8h9i0j5",
          "user": {
            "firstName": "Alice",
            "lastName": "Johnson"
          },
          "rating": 5,
          "title": "Excellent laptop!",
          "comment": "Great performance for gaming and work",
          "createdAt": "2024-01-15T00:00:00.000Z"
        }
      ],
      "relatedProducts": [
        {
          "id": "64f7b1c2d4a5e6f7g8h9i0j6",
          "name": "Gaming Mouse",
          "slug": "gaming-mouse",
          "price": 79.99,
          "image": "https://example.com/mouse-1.jpg"
        }
      ]
    }
  }
}
```

### 3.3 Create Product (Admin)
```http
POST /api/v1/products
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "New Gaming Laptop",
  "description": "Latest gaming laptop with RTX 4080",
  "shortDescription": "Next-gen gaming performance",
  "sku": "LAPTOP-002",
  "price": 1899.99,
  "comparePrice": 2199.99,
  "category": "64f7b1c2d4a5e6f7g8h9i0j4",
  "quantity": 25,
  "variants": [
    {
      "name": "RAM",
      "options": ["16GB", "32GB"]
    }
  ],
  "specifications": {
    "weight": 2.8,
    "processor": "Intel Core i9",
    "graphics": "NVIDIA RTX 4080"
  },
  "isFeatured": true
}
```

### 3.4 Update Product (Admin)
```http
PUT /api/v1/products/64f7b1c2d4a5e6f7g8h9i0j3
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "price": 1199.99,
  "quantity": 75
}
```

### 3.5 Delete Product (Admin)
```http
DELETE /api/v1/products/64f7b1c2d4a5e6f7g8h9i0j3
Authorization: Bearer <admin-token>
```

### 3.6 Upload Product Images (Admin)
```http
POST /api/v1/products/64f7b1c2d4a5e6f7g8h9i0j3/images
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

FormData:
- images: [File1, File2, File3]
- alts: ["Front view", "Side view", "Back view"]
```

## 4. Categories

### 4.1 Get All Categories
```http
GET /api/v1/categories
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "64f7b1c2d4a5e6f7g8h9i0j4",
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices and gadgets",
        "image": "https://example.com/electronics.jpg",
        "parentCategory": null,
        "subcategories": [
          {
            "id": "64f7b1c2d4a5e6f7g8h9i0j7",
            "name": "Laptops",
            "slug": "laptops",
            "description": "Portable computers"
          }
        ],
        "productCount": 245,
        "isActive": true
      }
    ]
  }
}
```

### 4.2 Get Single Category
```http
GET /api/v1/categories/electronics
```

### 4.3 Create Category (Admin)
```http
POST /api/v1/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Smartphones",
  "description": "Mobile phones and accessories",
  "parentCategory": "64f7b1c2d4a5e6f7g8h9i0j4"
}
```

## 5. Shopping Cart

### 5.1 Get Cart
```http
GET /api/v1/cart
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "64f7b1c2d4a5e6f7g8h9i0j8",
      "items": [
        {
          "id": "64f7b1c2d4a5e6f7g8h9i0j9",
          "product": {
            "id": "64f7b1c2d4a5e6f7g8h9i0j3",
            "name": "Gaming Laptop",
            "slug": "gaming-laptop",
            "price": 1299.99,
            "image": "https://example.com/laptop-1.jpg",
            "inStock": true
          },
          "quantity": 2,
          "price": 1299.99,
          "total": 2599.98
        }
      ],
      "subtotal": 2599.98,
      "tax": 207.99,
      "shipping": 0.00,
      "totalItems": 2,
      "totalAmount": 2807.97,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 5.2 Add Item to Cart
```http
POST /api/v1/cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "64f7b1c2d4a5e6f7g8h9i0j3",
  "quantity": 1
}
```

### 5.3 Update Cart Item
```http
PUT /api/v1/cart/items/64f7b1c2d4a5e6f7g8h9i0j3
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

### 5.4 Remove Item from Cart
```http
DELETE /api/v1/cart/items/64f7b1c2d4a5e6f7g8h9i0j3
Authorization: Bearer <token>
```

### 5.5 Clear Cart
```http
DELETE /api/v1/cart
Authorization: Bearer <token>
```

## 6. Orders

### 6.1 Get User Orders
```http
GET /api/v1/orders?page=1&limit=10&status=delivered
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "64f7b1c2d4a5e6f7g8h9i0j10",
        "orderNumber": "ORD-2024-001",
        "items": [
          {
            "product": {
              "id": "64f7b1c2d4a5e6f7g8h9i0j3",
              "name": "Gaming Laptop",
              "image": "https://example.com/laptop-1.jpg"
            },
            "quantity": 1,
            "price": 1299.99,
            "total": 1299.99
          }
        ],
        "orderStatus": "delivered",
        "paymentStatus": "paid",
        "subtotal": 1299.99,
        "tax": 103.99,
        "shipping": 0.00,
        "totalAmount": 1403.98,
        "shippingAddress": {
          "firstName": "John",
          "lastName": "Doe",
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA"
        },
        "trackingNumber": "1Z999AA1234567890",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "deliveredAt": "2024-01-05T00:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 6.2 Get Single Order
```http
GET /api/v1/orders/64f7b1c2d4a5e6f7g8h9i0j10
Authorization: Bearer <token>
```

### 6.3 Create Order
```http
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product": "64f7b1c2d4a5e6f7g8h9i0j3",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "phone": "+1234567890"
  },
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "stripe",
  "couponCode": "SAVE10"
}
```

### 6.4 Cancel Order
```http
PUT /api/v1/orders/64f7b1c2d4a5e6f7g8h9i0j10/cancel
Authorization: Bearer <token>
```

## 7. Reviews

### 7.1 Get Product Reviews
```http
GET /api/v1/products/64f7b1c2d4a5e6f7g8h9i0j3/reviews?page=1&limit=10&rating=5
```

### 7.2 Create Review
```http
POST /api/v1/products/64f7b1c2d4a5e6f7g8h9i0j3/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "title": "Amazing product!",
  "comment": "Exceeded my expectations. Highly recommended!",
  "orderId": "64f7b1c2d4a5e6f7g8h9i0j10"
}
```

### 7.3 Update Review
```http
PUT /api/v1/reviews/64f7b1c2d4a5e6f7g8h9i0j11
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "title": "Good product",
  "comment": "Updated review after using for a month"
}
```

### 7.4 Delete Review
```http
DELETE /api/v1/reviews/64f7b1c2d4a5e6f7g8h9i0j11
Authorization: Bearer <token>
```

## 8. Payments

### 8.1 Create Payment Intent
```http
POST /api/v1/payments/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "64f7b1c2d4a5e6f7g8h9i0j10",
  "amount": 1403.98,
  "currency": "usd",
  "paymentMethod": "stripe"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_1234567890_secret_abcdef",
    "paymentIntentId": "pi_1234567890"
  }
}
```

### 8.2 Confirm Payment
```http
POST /api/v1/payments/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890",
  "orderId": "64f7b1c2d4a5e6f7g8h9i0j10"
}
```

### 8.3 Payment Webhook
```http
POST /api/v1/payments/webhook
Content-Type: application/json
Stripe-Signature: signature

{
  "id": "evt_1234567890",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "amount": 140398,
      "currency": "usd",
      "status": "succeeded"
    }
  }
}
```

## 9. Admin Routes

### 9.1 Get All Orders (Admin)
```http
GET /api/v1/admin/orders?page=1&limit=10&status=pending
Authorization: Bearer <admin-token>
```

### 9.2 Update Order Status (Admin)
```http
PUT /api/v1/admin/orders/64f7b1c2d4a5e6f7g8h9i0j10/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "1Z999AA1234567890",
  "notes": "Shipped via UPS"
}
```

### 9.3 Get Analytics (Admin)
```http
GET /api/v1/admin/analytics?period=30days
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "sales": {
        "total": 125000.00,
        "orders": 450,
        "averageOrderValue": 277.78
      },
      "products": {
        "total": 1250,
        "outOfStock": 25,
        "lowStock": 50
      },
      "customers": {
        "total": 2500,
        "new": 150,
        "returning": 300
      },
      "topProducts": [
        {
          "id": "64f7b1c2d4a5e6f7g8h9i0j3",
          "name": "Gaming Laptop",
          "sales": 50,
          "revenue": 64999.50
        }
      ]
    }
  }
}
```

## HTTP Status Codes

### Success Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content returned

### Client Error Codes
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded

### Server Error Codes
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## Rate Limiting

### Default Limits
- **General API:** 100 requests per 15 minutes per IP
- **Authentication:** 5 requests per 15 minutes per IP
- **Admin API:** 200 requests per 15 minutes per authenticated user

### Headers
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset time (Unix timestamp)

This comprehensive API specification provides a solid foundation for implementing a robust e-commerce platform with clear, consistent endpoints and proper error handling.
