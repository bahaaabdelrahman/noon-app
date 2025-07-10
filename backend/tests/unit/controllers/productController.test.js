const productController = require('../../../src/controllers/productController');
const Product = require('../../../src/models/Product');
const { AppError } = require('../../../src/utils/errors');

// Mock dependencies
jest.mock('../../../src/models/Product');

describe('Product Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const mockProduct = { _id: 'productId123', name: 'Updated Product' };
      req.params.id = 'productId123';
      req.body = { name: 'Updated Product' };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockProduct),
      };
      Product.findByIdAndUpdate.mockReturnValue(mockQuery);

      await productController.updateProduct(req, res, next);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'productId123',
        { ...req.body, updatedAt: expect.any(Date) },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProduct,
        message: 'Product updated successfully',
      });
    });

    it('should return an error if the product is not found', async () => {
      req.params.id = 'nonExistentId';
      req.body = { name: 'Updated Name' };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null),
      };
      Product.findByIdAndUpdate.mockReturnValue(mockQuery);

      await productController.updateProduct(req, res, next);

      expect(next).toHaveBeenCalledWith(new AppError('Product not found', 404));
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      req.params.id = 'productId123';
      Product.findByIdAndDelete.mockResolvedValue({ _id: 'productId123' });

      await productController.deleteProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Product deleted successfully',
      });
    });

    it('should return an error if the product to delete is not found', async () => {
      req.params.id = 'nonExistentId';
      Product.findByIdAndDelete.mockResolvedValue(null);

      await productController.deleteProduct(req, res, next);

      expect(next).toHaveBeenCalledWith(new AppError('Product not found', 404));
    });
  });

  describe('updateInventory', () => {
    it('should update inventory successfully', async () => {
      req.params.id = 'productId123';
      req.body = { stock: 50 };
      const mockProduct = { _id: 'productId123', inventory: { stock: 50 } };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockProduct),
      };
      Product.findByIdAndUpdate.mockReturnValue(mockQuery);

      await productController.updateInventory(req, res, next);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'productId123',
        { 'inventory.stock': 50, updatedAt: expect.any(Date) },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProduct,
        message: 'Product inventory updated successfully',
      });
    });

    it('should return an error if the product for inventory update is not found', async () => {
      req.params.id = 'nonExistentId';
      req.body = { stock: 50 };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null),
      };
      Product.findByIdAndUpdate.mockReturnValue(mockQuery);

      await productController.updateInventory(req, res, next);

      expect(next).toHaveBeenCalledWith(new AppError('Product not found', 404));
    });
  });

  describe('bulkUpdateProducts', () => {
    it('should bulk update products successfully', async () => {
      req.body = {
        productIds: ['id1', 'id2'],
        updates: { status: 'inactive' },
      };
      Product.updateMany.mockResolvedValue({ modifiedCount: 2, matchedCount: 2 });

      await productController.bulkUpdateProducts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { modifiedCount: 2, matchedCount: 2 },
        message: 'Products updated successfully',
      });
    });

    it('should return an error if productIds are not provided', async () => {
      req.body = { updates: { status: 'inactive' } };

      await productController.bulkUpdateProducts(req, res, next);

      expect(next).toHaveBeenCalledWith(
        new AppError('Product IDs are required', 400)
      );
    });
  });
});
