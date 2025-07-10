const orderController = require('../../../src/controllers/orderController');
const Order = require('../../../src/models/Order');
const Cart = require('../../../src/models/Cart');
const Product = require('../../../src/models/Product');
const User = require('../../../src/models/User');
const { AppError, NotFoundError, ValidationError } = require('../../../src/utils/errors');
const ApiResponse = require('../../../src/utils/apiResponse');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../../src/config/constants');
const mongoose = require('mongoose');

// Mock models and utilities
jest.mock('../../../src/models/Order');
jest.mock('../../../src/models/Cart');
jest.mock('../../../src/models/Product');
jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/apiResponse');

describe('Order Controller', () => {
  let req, res, next;
  const validMongoId = '507f191e810c19729de860ea';

  beforeEach(() => {
    req = {
      user: { id: 'userId123', role: 'user' },
      params: {},
      body: {},
      query: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test Agent'),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const mockCart = {
        _id: 'cartId123',
        user: 'userId123',
        items: [
          {
            product: { _id: 'prodId123', name: 'Test Product', status: 'active', inventory: { trackQuantity: true, quantity: 10 }, images: [{ url: 'image.jpg' }] },
            quantity: 1,
            unitPrice: 100,
          },
        ],
        totals: { subtotal: 100, tax: 10, shipping: 5, discount: 0, total: 115 },
      };
      const mockUser = { _id: 'userId123', firstName: 'Test', lastName: 'User' };
      const mockOrderInstance = { calculateTotals: jest.fn(), save: jest.fn().mockResolvedValue(true), populate: jest.fn().mockResolvedValue(true) }; 

      Cart.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockCart) });
      User.findById.mockResolvedValue(mockUser);
      Order.mockImplementation(() => mockOrderInstance);
      Product.findByIdAndUpdate.mockResolvedValue(true);
      Cart.findByIdAndUpdate.mockResolvedValue(true);

      req.body = { shippingAddress: { city: 'Test City' } };
      await orderController.createOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockOrderInstance, 'Order created successfully'));
    });

    it('should throw ValidationError for insufficient stock', async () => {
      const mockCart = {
        items: [{ product: { name: 'Test Product', status: 'active', inventory: { quantity: 0, trackQuantity: true } }, quantity: 1 }],
      };
      Cart.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockCart) });

      await orderController.createOrder(req, res, next);

      expect(next).toHaveBeenCalledWith(new ValidationError('Insufficient stock for Test Product. Available: 0'));
    });
  });

  describe('getOrder', () => {
    it('should retrieve an order by ID for the owner', async () => {
      const mockOrder = { _id: validMongoId, user: { toString: () => 'userId123' } };
      Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockOrder) });
      req.params.id = validMongoId;

      await orderController.getOrder(req, res, next);

      expect(Order.findById).toHaveBeenCalledWith(validMongoId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockOrder, 'Order retrieved successfully'));
    });

    it('should throw NotFoundError if user is not authorized', async () => {
      const mockOrder = { _id: validMongoId, user: { toString: () => 'otherUser' } };
      Order.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockOrder) });
      req.params.id = validMongoId;

      await orderController.getOrder(req, res, next);

      expect(Order.findById).toHaveBeenCalledWith(validMongoId);
      expect(next).toHaveBeenCalledWith(new NotFoundError('Order not found'));
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order successfully', async () => {
      const mockOrder = {
        user: { toString: () => 'userId123' },
        canBeCancelled: jest.fn().mockReturnValue(true),
        updateStatus: jest.fn().mockResolvedValue(true),
        items: [{ product: 'prodId123', quantity: 1 }],
      };
      Order.findById.mockResolvedValue(mockOrder);
      Product.findById.mockResolvedValue({ inventory: { trackQuantity: true } });
      req.params.id = 'orderId123';

      await orderController.cancelOrder(req, res, next);

      expect(mockOrder.updateStatus).toHaveBeenCalledWith(ORDER_STATUS.CANCELLED, undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockOrder, 'Order cancelled successfully'));
    });

    it('should throw ValidationError if order cannot be cancelled', async () => {
      const mockOrder = {
        user: { toString: () => 'userId123' },
        canBeCancelled: jest.fn().mockReturnValue(false),
      };
      Order.findById.mockResolvedValue(mockOrder);
      req.params.id = 'orderId123';

      await orderController.cancelOrder(req, res, next);

      expect(next).toHaveBeenCalledWith(new ValidationError('Order cannot be cancelled in its current status'));
    });
  });
});
