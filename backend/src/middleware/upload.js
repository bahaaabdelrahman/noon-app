const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/errors');

// Ensure uploads directory exists
const createUploadsDir = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Product images storage configuration
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/products');
    createUploadsDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${extension}`);
  },
});

// Category images storage configuration
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/categories');
    createUploadsDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `category-${uniqueSuffix}${extension}`);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400), false);
  }
};

// Multer configuration
const multerConfig = {
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Max 10 files at once
  },
};

// Product image upload middleware
const uploadProductImages = multer({
  storage: productStorage,
  ...multerConfig,
}).array('images', 10);

// Single product image upload
const uploadProductImage = multer({
  storage: productStorage,
  ...multerConfig,
}).single('image');

// Category image upload middleware
const uploadCategoryImage = multer({
  storage: categoryStorage,
  ...multerConfig,
}).single('image');

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new AppError('File size too large. Maximum size is 5MB', 400)
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files. Maximum is 10 files', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field name for file upload', 400));
    }
  }
  next(err);
};

module.exports = {
  uploadProductImages,
  uploadProductImage,
  uploadCategoryImage,
  handleMulterError,
};
