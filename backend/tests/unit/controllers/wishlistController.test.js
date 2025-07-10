const wishlistController = require('../../../src/controllers/wishlistController');
const Wishlist = require('../../../src/models/Wishlist');
const Product = require('../../../src/models/Product');
const Cart = require('../../../src/models/Cart');
const { AppError, NotFoundError } = require('../../../src/utils/errors');
const ApiResponse = require('../../../src/utils/apiResponse');

// Mock dependencies
jest.mock('../../../src/models/Wishlist');
jest.mock('../../../src/models/Product');
jest.mock('../../../src/models/Cart');
jest.mock('../../../src/utils/apiResponse');

describe('Wishlist Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: 'userId123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getUserWishlists', () => {
    it('should get all user wishlists', async () => {
      const mockWishlists = [{ _id: 'wishlist1', name: 'My Wishlist' }];
      Wishlist.getUserWishlists.mockResolvedValue(mockWishlists);

      await wishlistController.getUserWishlists(req, res, next);

      expect(Wishlist.getUserWishlists).toHaveBeenCalledWith('userId123', { includeItems: false });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockWishlists, 'Wishlists retrieved successfully', { count: mockWishlists.length }));
    });
  });

  describe('getWishlist', () => {
    it('should get a specific wishlist by ID', async () => {
      req.params.wishlistId = 'wishlist1';
      const mockWishlist = { _id: 'wishlist1', name: 'My Wishlist' };
      const mockQuery = { populate: jest.fn().mockResolvedValue(mockWishlist) };
      Wishlist.findOne.mockReturnValue(mockQuery);

      await wishlistController.getWishlist(req, res, next);

      expect(Wishlist.findOne).toHaveBeenCalledWith({ _id: 'wishlist1', user: 'userId123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockWishlist, 'Wishlist retrieved successfully'));
    });

    it('should fail if wishlist is not found', async () => {
      req.params.wishlistId = 'nonexistent';
      Wishlist.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      await wishlistController.getWishlist(req, res, next);

      expect(next).toHaveBeenCalledWith(new NotFoundError('Wishlist not found'));
    });
  });

  describe('createWishlist', () => {
    it('should create a new wishlist', async () => {
      req.body = { name: 'New Wishlist', description: 'A new list' };
      const mockWishlist = { _id: 'newId', ...req.body };
      Wishlist.create.mockResolvedValue(mockWishlist);

      await wishlistController.createWishlist(req, res, next);

      expect(Wishlist.create).toHaveBeenCalledWith({ ...req.body, user: 'userId123' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockWishlist, 'Wishlist created successfully'));
    });
  });

  describe('updateWishlist', () => {
    it('should update a wishlist successfully', async () => {
      req.params.wishlistId = 'wishlist1';
      req.body = { name: 'Updated Name' };
      const mockWishlist = { _id: 'wishlist1', name: 'Old Name', save: jest.fn().mockResolvedValue(this) };
      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.updateWishlist(req, res, next);

      expect(mockWishlist.name).toBe('Updated Name');
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockWishlist, 'Wishlist updated successfully'));
    });
  });

  describe('deleteWishlist', () => {
    it('should delete a wishlist successfully', async () => {
      req.params.wishlistId = 'wishlist1';
      const mockWishlist = { _id: 'wishlist1', isDefault: false };
      Wishlist.findOne.mockResolvedValue(mockWishlist);
      Wishlist.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await wishlistController.deleteWishlist(req, res, next);

      expect(Wishlist.deleteOne).toHaveBeenCalledWith({ _id: 'wishlist1' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(null, 'Wishlist deleted successfully'));
    });

    it('should fail to delete the default wishlist', async () => {
      req.params.wishlistId = 'defaultWishlist';
      const mockWishlist = { _id: 'defaultWishlist', isDefault: true };
      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.deleteWishlist(req, res, next);

      expect(next).toHaveBeenCalledWith(new AppError('Cannot delete default wishlist', 400));
    });
  });

  describe('addToWishlist', () => {
    it('should add a product to a wishlist', async () => {
      req.params = { wishlistId: 'wishlist1', productId: 'product1' };
      const mockWishlist = { addProduct: jest.fn(), save: jest.fn(), populate: jest.fn().mockResolvedValue(this) };
      Wishlist.findOne.mockResolvedValue(mockWishlist);
      Product.findById.mockResolvedValue({ _id: 'product1' });

      await wishlistController.addToWishlist(req, res, next);

      expect(mockWishlist.addProduct).toHaveBeenCalledWith('product1', { notes: undefined, priority: undefined });
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should use default wishlist if ID is `default`', async () => {
        req.params = { wishlistId: 'default', productId: 'product1' };
        const mockWishlist = { addProduct: jest.fn(), save: jest.fn(), populate: jest.fn() };
        Wishlist.findOrCreateDefault.mockResolvedValue(mockWishlist);
        Product.findById.mockResolvedValue({ _id: 'product1' });
  
        await wishlistController.addToWishlist(req, res, next);
  
        expect(Wishlist.findOrCreateDefault).toHaveBeenCalledWith('userId123');
        expect(mockWishlist.addProduct).toHaveBeenCalled();
      });
  });

  describe('removeFromWishlist', () => {
    it('should remove a product from a wishlist', async () => {
      req.params = { wishlistId: 'wishlist1', productId: 'product1' };
      const mockWishlist = { removeProduct: jest.fn().mockReturnValue(true), save: jest.fn() };
      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.removeFromWishlist(req, res, next);

      expect(mockWishlist.removeProduct).toHaveBeenCalledWith('product1');
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should fail if product is not in the wishlist', async () => {
        req.params = { wishlistId: 'wishlist1', productId: 'product1' };
        const mockWishlist = { removeProduct: jest.fn().mockReturnValue(false) };
        Wishlist.findOne.mockResolvedValue(mockWishlist);
  
        await wishlistController.removeFromWishlist(req, res, next);
  
        expect(next).toHaveBeenCalledWith(new AppError('Product not found in wishlist', 404));
      });
  });

  describe('clearWishlist', () => {
    it('should clear all items from a wishlist', async () => {
      req.params.wishlistId = 'wishlist1';
      const mockWishlist = { clearItems: jest.fn(), save: jest.fn() };
      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.clearWishlist(req, res, next);

      expect(mockWishlist.clearItems).toHaveBeenCalled();
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('moveToCart', () => {
    it('should move items from wishlist to cart', async () => {
      req.params.wishlistId = 'wishlist1';
      req.body = { productIds: ['product1'] };
      const mockWishlist = { items: [{ product: { _id: 'product1' } }] };
      const mockCart = { addItem: jest.fn() };
      Wishlist.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockWishlist) });
      Cart.findOrCreateForUser.mockResolvedValue(mockCart);

      await wishlistController.moveToCart(req, res, next);

      expect(Cart.findOrCreateForUser).toHaveBeenCalledWith('userId123');
      expect(mockCart.addItem).toHaveBeenCalledWith('product1', 1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('shareWishlist', () => {
    it('should share a wishlist successfully', async () => {
      req.params.wishlistId = 'wishlist1';
      req.body = { emails: ['friend@example.com'] };
      const mockWishlist = { generateShareToken: jest.fn(), sharedWith: [], save: jest.fn() };
      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.shareWishlist(req, res, next);

      expect(mockWishlist.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getSharedWishlist', () => {
    it('should retrieve a shared wishlist', async () => {
      req.params.shareToken = 'token123';
      const mockWishlist = { _id: 'wishlist1' };
      Wishlist.findByShareToken.mockResolvedValue(mockWishlist);

      await wishlistController.getSharedWishlist(req, res, next);

      expect(Wishlist.findByShareToken).toHaveBeenCalledWith('token123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ApiResponse.success(mockWishlist, 'Shared wishlist retrieved successfully'));
    });

    it('should fail if shared wishlist is not found', async () => {
        req.params.shareToken = 'invalidToken';
        Wishlist.findByShareToken.mockResolvedValue(null);
  
        await wishlistController.getSharedWishlist(req, res, next);
  
        expect(next).toHaveBeenCalledWith(new AppError('Shared wishlist not found or no longer available', 404));
      });
  });
});
