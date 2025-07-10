const cartController = require('../../../src/controllers/cartController');
const Cart = require('../../../src/models/Cart');
const Product = require('../../../src/models/Product');
const { AppError, NotFoundError } = require('../../../src/utils/errors');
const ApiResponse = require('../../../src/utils/apiResponse');

jest.mock('../../../src/models/Cart');
jest.mock('../../../src/models/Product');
jest.mock('../../../src/utils/apiResponse');

describe('Cart Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: 'userId123' },
      sessionID: 'sessionId123',
      headers: { 'x-session-id': 'sessionId123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  // Mock cart instance methods
  const mockCartInstance = {
    populate: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(true),
    addItem: jest.fn().mockResolvedValue(true),
    updateItemQuantity: jest.fn().mockResolvedValue(true),
    removeItem: jest.fn().mockResolvedValue(true),
    clearCart: jest.fn().mockResolvedValue(true),
    applyCoupon: jest.fn().mockResolvedValue(true),
    removeCoupon: jest.fn().mockResolvedValue(true),
    items: [],
    isEmpty: false,
  };

  describe('getCart', () => {
    it('should get or create a cart and return it', async () => {
      Cart.findOrCreateCart.mockResolvedValue(mockCartInstance);

      await cartController.getCart(req, res, next);

      expect(Cart.findOrCreateCart).toHaveBeenCalledWith('userId123', 'sessionId123');
      expect(mockCartInstance.populate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockCartInstance, 'Cart retrieved successfully'));
    });
  });

  describe('addToCart', () => {
    it('should add an item to the cart', async () => {
      req.body = { productId: 'prod1', quantity: 2, selectedVariants: [] };
      Cart.findOrCreateCart.mockResolvedValue(mockCartInstance);

      await cartController.addToCart(req, res, next);

      expect(Cart.findOrCreateCart).toHaveBeenCalledWith('userId123', 'sessionId123');
      expect(mockCartInstance.addItem).toHaveBeenCalledWith('prod1', 2, []);
      expect(mockCartInstance.populate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockCartInstance, 'Item added to cart successfully'));
    });

    it('should return an error if productId is missing', async () => {
      req.body = {};
      await cartController.addToCart(req, res, next);
      expect(next).toHaveBeenCalledWith(new AppError('Product ID is required', 400));
    });
  });

  describe('updateCartItem', () => {
    it('should update an item quantity', async () => {
      req.params.itemId = 'item1';
      req.body.quantity = 5;
      Cart.findOne.mockResolvedValue(mockCartInstance);

      await cartController.updateCartItem(req, res, next);

      expect(Cart.findOne).toHaveBeenCalledWith({ user: 'userId123', status: 'active' });
      expect(mockCartInstance.updateItemQuantity).toHaveBeenCalledWith('item1', 5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockCartInstance, 'Cart item updated successfully'));
    });

    it('should return error if cart not found', async () => {
      req.params.itemId = 'item1';
      req.body.quantity = 5;
      Cart.findOne.mockResolvedValue(null);
      await cartController.updateCartItem(req, res, next);
      expect(next).toHaveBeenCalledWith(new NotFoundError('Cart not found'));
    });
  });

  describe('removeFromCart', () => {
    it('should remove an item from the cart', async () => {
      req.params.itemId = 'item1';
      Cart.findOne.mockResolvedValue(mockCartInstance);

      await cartController.removeFromCart(req, res, next);

      expect(Cart.findOne).toHaveBeenCalledWith({ user: 'userId123', status: 'active' });
      expect(mockCartInstance.removeItem).toHaveBeenCalledWith('item1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockCartInstance, 'Item removed from cart successfully'));
    });
  });

  describe('clearCart', () => {
    it('should clear the cart', async () => {
      Cart.findOne.mockResolvedValue(mockCartInstance);

      await cartController.clearCart(req, res, next);

      expect(Cart.findOne).toHaveBeenCalledWith({ user: 'userId123', status: 'active' });
      expect(mockCartInstance.clearCart).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockCartInstance, 'Cart cleared successfully'));
    });
  });

  describe('applyCoupon', () => {
    it('should apply a coupon to the cart', async () => {
      req.body.couponCode = 'SAVE10';
      Cart.findOne.mockResolvedValue(mockCartInstance);

      await cartController.applyCoupon(req, res, next);

      expect(Cart.findOne).toHaveBeenCalledWith({ user: 'userId123', status: 'active' });
      expect(mockCartInstance.applyCoupon).toHaveBeenCalledWith('SAVE10');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockCartInstance, 'Coupon applied successfully'));
    });

    it('should return error if cart is empty', async () => {
        req.body.couponCode = 'SAVE10';
        Cart.findOne.mockResolvedValue({ ...mockCartInstance, isEmpty: true });
        await cartController.applyCoupon(req, res, next);
        expect(next).toHaveBeenCalledWith(new AppError('Cannot apply coupon to an empty cart', 400));
    });
  });

  describe('removeCoupon', () => {
    it('should remove a coupon from the cart', async () => {
        req.body.couponCode = 'SAVE10';
        Cart.findOne.mockResolvedValue(mockCartInstance);
  
        await cartController.removeCoupon(req, res, next);
  
        expect(Cart.findOne).toHaveBeenCalledWith({ user: 'userId123', status: 'active' });
        expect(mockCartInstance.removeCoupon).toHaveBeenCalledWith('SAVE10');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockCartInstance, 'Coupon removed successfully'));
      });
  });

  describe('mergeCart', () => {
    it('should merge guest cart with user cart', async () => {
        req.body.sessionId = 'guestSession';
        Cart.mergeGuestCart.mockResolvedValue(mockCartInstance);

        await cartController.mergeCart(req, res, next);

        expect(Cart.mergeGuestCart).toHaveBeenCalledWith('userId123', 'guestSession');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockCartInstance, 'Carts merged successfully'));
    });
  });

  describe('getCartSummary', () => {
    it('should get cart summary', async () => {
        const summary = { itemCount: 2, total: 100 };
        Cart.findOne.mockResolvedValue({ ...mockCartInstance, ...summary });

        await cartController.getCartSummary(req, res, next);

        expect(Cart.findOne).toHaveBeenCalledWith({ user: 'userId123', status: 'active' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(ApiResponse.success(expect.any(Object), 'Cart summary retrieved successfully'));
    });
  });

  describe('validateCart', () => {
    it('should validate the cart successfully', async () => {
      const mockPopulatedCart = {
        ...mockCartInstance,
        items: [{ 
            product: { _id: 'prod1', status: 'active', visibility: 'public', inventory: { trackQuantity: false }, pricing: { price: 100 } }, 
            quantity: 1, 
            unitPrice: 100 
        }],
        isEmpty: false,
      };
      Cart.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockPopulatedCart) });

      await cartController.validateCart(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(
        expect.objectContaining({
            validation: expect.objectContaining({ isValid: true })
        }),
        'Cart validation completed'
      ));
    });

    it('should return error if cart is empty', async () => {
        const mockPopulatedCart = { ...mockCartInstance, isEmpty: true };
        Cart.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockPopulatedCart) });

        await cartController.validateCart(req, res, next);

        expect(next).toHaveBeenCalledWith(new AppError('Cart is empty', 400));
    });
  });
});
