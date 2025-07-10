# E-commerce API Documentation

## Introduction

Welcome to the E-commerce API documentation. This guide provides a comprehensive overview of all available endpoints, how to use them, and what to expect in return. It is designed to help frontend developers quickly integrate with our backend services.

### Base URL

All API endpoints are relative to the following base URL:

```
http://localhost:3000/api/v1
```

### Authentication

Most endpoints require authentication using a JSON Web Token (JWT). To access protected routes, you must include an `Authorization` header with the value `Bearer YOUR_JWT_TOKEN` in your request.

Tokens are obtained through the login endpoint and should be stored securely on the client-side.

---

## 1. Authentication (`/auth`)

These endpoints handle user registration, login, and token management.

### 1.1. User Registration

Creates a new user account.

- **Endpoint:** `POST /auth/register`
- **Description:** Registers a new user with the provided credentials.
- **Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "yourSecurePassword123"
}
```

- **Successful Response (201 - Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "686a689bc8f7365ac4333afe",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "user"
    },
    "token": "your_jwt_token"
  },
  "message": "User registered successfully"
}
```

### 1.2. User Login

Authenticates a user and returns a JWT.

- **Endpoint:** `POST /auth/login`
- **Description:** Logs in a user with their email and password.
- **Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "yourSecurePassword123"
}
```

- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": {
    "token": "your_new_jwt_token"
  },
  "message": "Login successful"
}
```

### 1.3. Get Current User

Retrieves the profile of the currently authenticated user.

- **Endpoint:** `GET /auth/me`
- **Authentication:** Required
- **Description:** Fetches the details of the user associated with the provided JWT.
- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": {
    "_id": "686a689bc8f7365ac4333afe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "user"
  },
  "message": "User profile retrieved successfully"
}
```

---

## 2. User Management (`/users`)

These endpoints are for managing user-specific data, such as shipping addresses.

### 2.1. Add a New Address

Adds a new shipping address to the user's profile.

- **Endpoint:** `POST /users/addresses`
- **Authentication:** Required
- **Description:** Saves a new address to the authenticated user's address book.
- **Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "addressLine1": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "postalCode": "12345",
  "country": "USA",
  "phone": "555-123-4567",
  "isDefault": true
}
```

- **Successful Response (201 - Created):**

```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "_id": "686a71848bb0b29e92425000",
        "firstName": "Jane",
        "lastName": "Doe",
        "addressLine1": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "postalCode": "12345",
        "country": "USA",
        "phone": "555-123-4567",
        "isDefault": true
      }
    ]
  },
  "message": "Address added successfully"
}
```

### 2.2. Get All Addresses

Retrieves all saved addresses for the authenticated user.

- **Endpoint:** `GET /users/addresses`
- **Authentication:** Required
- **Description:** Fetches a list of all addresses associated with the user.
- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "686a71848bb0b29e92425000",
      "firstName": "Jane",
      "lastName": "Doe",
      "addressLine1": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "postalCode": "12345",
      "country": "USA",
      "phone": "555-123-4567",
      "isDefault": true
    }
  ],
  "message": "Addresses retrieved successfully"
}
```

---

## 3. Product Catalog (`/products`, `/categories`)

Endpoints for browsing products and categories.

### 3.1. Get All Products

Retrieves a paginated list of all available products.

- **Endpoint:** `GET /products`
- **Query Parameters:**
  - `page` (number, optional): The page number to retrieve.
  - `limit` (number, optional): The number of products per page.
  - `sortBy` (string, optional): The field to sort by (e.g., `createdAt`, `price`).
  - `sortOrder` (string, optional): The sort order (`asc` or `desc`).
- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "6856900de8d08870077cccce",
        "name": "Casual T-Shirt",
        "price": 29.99
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 50
    }
  },
  "message": "Products retrieved successfully"
}
```

### 3.2. Get a Single Product

Retrieves the full details of a specific product by its slug.

- **Endpoint:** `GET /products/:slug`
- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": {
    "_id": "6856900de8d08870077cccce",
    "name": "Casual T-Shirt",
    "description": "A comfortable and stylish t-shirt.",
    "price": 29.99,
    "images": [],
    "category": "Apparel"
  },
  "message": "Product retrieved successfully"
}
```

### 3.3. Get All Categories

Retrieves a list of all product categories.

- **Endpoint:** `GET /categories`
- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6856900de8d08870077cc001",
      "name": "Apparel",
      "slug": "apparel"
    }
  ],
  "message": "Categories retrieved successfully"
}

---

## 4. Shopping Cart (`/cart`)

Endpoints for managing the user's shopping cart.

### 4.1. Add Item to Cart

- **Endpoint:** `POST /cart/items`
- **Authentication:** Required
- **Description:** Adds a product to the user's cart. If the item already exists, its quantity is updated.
- **Request Body:**

```json
{
  "productId": "6856900de8d08870077cccce",
  "quantity": 1
}
```

- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": { ...cartObject... },
  "message": "Item added to cart successfully"
}
```

### 4.2. Get Cart

- **Endpoint:** `GET /cart`
- **Authentication:** Required
- **Description:** Retrieves the contents of the user's current cart.
- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": {
    "_id": "686a75c48bb0b29e9242500d",
    "user": "686a689bc8f7365ac4333afe",
    "items": [
      {
        "product": { ...productObject... },
        "quantity": 1,
        "unitPrice": 29.99
      }
    ],
    "totals": {
      "subtotal": 29.99,
      "tax": 3.00,
      "shipping": 10.00,
      "total": 42.99
    }
  },
  "message": "Cart retrieved successfully"
}
```

### 4.3. Update Item Quantity

- **Endpoint:** `PUT /cart/items/:itemId`
- **Authentication:** Required
- **Description:** Updates the quantity of a specific item in the cart.
- **Request Body:**

```json
{
  "quantity": 2
}
```

- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": { ...cartObject... },
  "message": "Cart updated successfully"
}
```

### 4.4. Remove Item from Cart

- **Endpoint:** `DELETE /cart/items/:itemId`
- **Authentication:** Required
- **Description:** Removes an item completely from the cart.
- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": { ...cartObject... },
  "message": "Item removed from cart successfully"
}
```

---

## 5. Order Management (`/orders`)

Endpoints for creating and viewing orders.

### 5.1. Create Order

- **Endpoint:** `POST /orders`
- **Authentication:** Required
- **Description:** Creates an order from the user's cart. This is the final step in the checkout process. The cart will be cleared upon successful order creation.
- **Request Body:**

```json
{
  "shippingAddressId": "686a71848bb0b29e92425000",
  "useShippingAsBilling": true,
  "paymentMethod": "credit_card"
}
```

- **Successful Response (201 - Created):**

```json
{
  "success": true,
  "data": { ...orderObject... },
  "message": "Order created successfully"
}
```

### 5.2. Get User Orders

- **Endpoint:** `GET /orders`
- **Authentication:** Required
- **Description:** Retrieves a paginated list of the authenticated user's past orders.
- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": {
    "orders": [
      { ...orderSummaryObject... }
    ],
    "pagination": { ...paginationObject... }
  },
  "message": "Orders retrieved successfully"
}
```

### 5.3. Get a Single Order

- **Endpoint:** `GET /orders/:id`
- **Authentication:** Required
- **Description:** Retrieves the full details of a single order by its ID.
- **Successful Response (200 - OK):**

```json
{
  "success": true,
  "data": { ...fullOrderObject... },
  "message": "Order retrieved successfully"
}
