const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * Image subdocument schema
 */
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    publicId: {
      type: String,
      required: [true, 'Image public ID is required'],
      trim: true,
    },
    alt: {
      type: String,
      trim: true,
      default: '',
    },
    isMain: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

/**
 * Product variant schema
 */
const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Variant name is required'],
      trim: true,
      maxlength: [50, 'Variant name cannot exceed 50 characters'],
    },
    options: [
      {
        type: String,
        required: [true, 'Variant option is required'],
        trim: true,
        maxlength: [100, 'Variant option cannot exceed 100 characters'],
      },
    ],
  },
  {
    _id: false,
  }
);

/**
 * Product specification schema (flexible structure)
 */
const specificationSchema = new mongoose.Schema(
  {},
  {
    _id: false,
    strict: false, // Allow dynamic fields
    minimize: false, // Don't remove empty objects
  }
);

/**
 * SEO schema
 */
const seoSchema = new mongoose.Schema(
  {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title cannot exceed 60 characters'],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    metaKeywords: [
      {
        type: String,
        trim: true,
      },
    ],
    canonicalUrl: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/**
 * Product rating schema
 */
const ratingSchema = new mongoose.Schema(
  {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Average rating cannot be less than 0'],
      max: [5, 'Average rating cannot be more than 5'],
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative'],
    },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 },
    },
  },
  {
    _id: false,
  }
);

/**
 * Product inventory schema
 */
const inventorySchema = new mongoose.Schema(
  {
    trackQuantity: {
      type: Boolean,
      default: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative'],
    },
    allowBackorder: {
      type: Boolean,
      default: false,
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
    },
    dimensions: {
      length: {
        type: Number,
        min: [0, 'Length cannot be negative'],
      },
      width: {
        type: Number,
        min: [0, 'Width cannot be negative'],
      },
      height: {
        type: Number,
        min: [0, 'Height cannot be negative'],
      },
      unit: {
        type: String,
        enum: ['cm', 'in', 'm', 'ft'],
        default: 'cm',
      },
    },
  },
  {
    _id: false,
  }
);

/**
 * Product pricing schema
 */
const pricingSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    comparePrice: {
      type: Number,
      min: [0, 'Compare price cannot be negative'],
      validate: {
        validator: function (value) {
          return !value || value > this.price;
        },
        message: 'Compare price must be greater than regular price',
      },
    },
    costPerItem: {
      type: Number,
      min: [0, 'Cost per item cannot be negative'],
    },
    taxable: {
      type: Boolean,
      default: true,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      match: [/^[A-Z]{3}$/, 'Currency must be a valid 3-letter ISO code'],
    },
  },
  {
    _id: false,
  }
);

/**
 * Product schema
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: 'text',
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [5000, 'Product description cannot exceed 5000 characters'],
      index: 'text',
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    brand: {
      type: String,
      trim: true,
      maxlength: [100, 'Brand name cannot exceed 100 characters'],
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Tag cannot exceed 50 characters'],
      },
    ],
    images: [imageSchema],
    variants: [variantSchema],
    specifications: specificationSchema,
    pricing: {
      type: pricingSchema,
      required: true,
    },
    inventory: {
      type: inventorySchema,
      required: true,
    },
    seo: seoSchema,
    rating: {
      type: ratingSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'archived'],
      default: 'draft',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'hidden'],
      default: 'public',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDigital: {
      type: Boolean,
      default: false,
    },
    requiresShipping: {
      type: Boolean,
      default: true,
    },
    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative'],
    },
    salesCount: {
      type: Number,
      default: 0,
      min: [0, 'Sales count cannot be negative'],
    },
    publishedAt: {
      type: Date,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Compound indexes for better query performance
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'pricing.price': 1, status: 1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ createdAt: -1, status: 1 });
productSchema.index({ 'rating.average': -1, status: 1 });
productSchema.index({ salesCount: -1, status: 1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ tags: 1, status: 1 });

// Text index for search functionality
productSchema.index(
  {
    name: 'text',
    description: 'text',
    shortDescription: 'text',
    brand: 'text',
    tags: 'text',
    sku: 'text',
  },
  {
    weights: {
      name: 10,
      brand: 5,
      tags: 3,
      sku: 8,
      shortDescription: 2,
      description: 1,
    },
    name: 'product_text_index',
  }
);

// Virtual fields
productSchema.virtual('inStock').get(function () {
  if (!this.inventory.trackQuantity) return true;
  return this.inventory.quantity > 0 || this.inventory.allowBackorder;
});

productSchema.virtual('isLowStock').get(function () {
  if (!this.inventory.trackQuantity) return false;
  return this.inventory.quantity <= this.inventory.lowStockThreshold;
});

productSchema.virtual('isOnSale').get(function () {
  return (
    this.pricing.comparePrice && this.pricing.comparePrice > this.pricing.price
  );
});

productSchema.virtual('discountPercentage').get(function () {
  if (!this.isOnSale) return 0;
  return Math.round(
    ((this.pricing.comparePrice - this.pricing.price) /
      this.pricing.comparePrice) *
      100
  );
});

productSchema.virtual('mainImage').get(function () {
  if (!this.images || this.images.length === 0) return null;
  const mainImg = this.images.find(img => img.isMain);
  return mainImg || this.images[0] || null;
});

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
});

// Pre-save middleware to generate slug
productSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (true) {
      const existingProduct = await this.constructor.findOne({
        slug,
        _id: { $ne: this._id },
      });

      if (!existingProduct) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }

  next();
});

// Pre-save middleware to set publishedAt when status changes to active
productSchema.pre('save', function (next) {
  if (
    this.isModified('status') &&
    this.status === 'active' &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
  next();
});

// Pre-save middleware to ensure only one main image
productSchema.pre('save', function (next) {
  if (this.isModified('images')) {
    let hasMain = false;

    this.images.forEach((image, index) => {
      if (image.isMain) {
        if (hasMain) {
          // If we already have a main image, set this one to false
          image.isMain = false;
        } else {
          hasMain = true;
        }
      }
    });

    // If no main image is set, make the first one main
    if (!hasMain && this.images.length > 0) {
      this.images[0].isMain = true;
    }
  }
  next();
});

// Pre-save middleware to update SEO fields
productSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isModified('shortDescription')) {
    // Initialize seo object if it doesn't exist
    if (!this.seo) {
      this.seo = {};
    }
    
    if (!this.seo.metaTitle) {
      this.seo.metaTitle = this.name.substring(0, 60);
    }

    if (!this.seo.metaDescription && this.shortDescription) {
      this.seo.metaDescription = this.shortDescription.substring(0, 160);
    }
  }
  next();
});

// Post-save middleware to update category product count
productSchema.post('save', async function () {
  if (this.category) {
    const Category = mongoose.model('Category');
    await Category.findByIdAndUpdate(
      this.category,
      {},
      {
        timestamps: false,
      }
    );
  }
});

// Post-remove middleware to update category product count
productSchema.post('deleteOne', { document: true }, async function () {
  if (this.category) {
    const Category = mongoose.model('Category');
    await Category.findByIdAndUpdate(
      this.category,
      {},
      {
        timestamps: false,
      }
    );
  }
});

// Instance methods
productSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

productSchema.methods.incrementSalesCount = function (quantity = 1) {
  this.salesCount += quantity;
  return this.save({ validateBeforeSave: false });
};

productSchema.methods.updateInventory = function (quantity) {
  if (this.inventory.trackQuantity) {
    this.inventory.quantity = Math.max(0, this.inventory.quantity + quantity);
  }
  return this.save({ validateBeforeSave: false });
};

productSchema.methods.updateRating = async function () {
  const Review = mongoose.model('Review');

  const stats = await Review.aggregate([
    { $match: { product: this._id, isApproved: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        distribution: {
          $push: '$rating',
        },
      },
    },
  ]);

  if (stats.length > 0) {
    const { averageRating, totalReviews, distribution } = stats[0];

    // Calculate rating distribution
    const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach(rating => {
      ratingDist[rating] = (ratingDist[rating] || 0) + 1;
    });

    this.rating = {
      average: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      count: totalReviews,
      distribution: ratingDist,
    };
  } else {
    this.rating = {
      average: 0,
      count: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  return this.save({ validateBeforeSave: false });
};

productSchema.methods.addImages = function (imageData) {
  // imageData should be array of { url, publicId, alt, isMain }
  if (!Array.isArray(imageData)) {
    imageData = [imageData];
  }

  // If this is the first image, make it main
  if (this.images.length === 0 && imageData.length > 0) {
    imageData[0].isMain = true;
  }

  this.images.push(...imageData);
  return this.save();
};

productSchema.methods.removeImage = function (imageId) {
  const imageIndex = this.images.findIndex(
    img => img._id.toString() === imageId
  );

  if (imageIndex === -1) {
    throw new Error('Image not found');
  }

  const removedImage = this.images[imageIndex];
  this.images.splice(imageIndex, 1);

  // If we removed the main image, make the first remaining image main
  if (removedImage.isMain && this.images.length > 0) {
    this.images[0].isMain = true;
  }

  return this.save();
};

productSchema.methods.setMainImage = function (imageId) {
  let found = false;

  this.images.forEach(image => {
    if (image._id.toString() === imageId) {
      image.isMain = true;
      found = true;
    } else {
      image.isMain = false;
    }
  });

  if (!found) {
    throw new Error('Image not found');
  }

  return this.save();
};

// Static methods
productSchema.statics.findActiveProducts = function (options = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    brand,
    tags,
    featured,
    inStock,
    sort = '-createdAt',
    page = 1,
    limit = 20,
  } = options;

  const filter = {
    status: 'active',
    visibility: 'public',
  };

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter['pricing.price'] = {};
    if (minPrice !== undefined) filter['pricing.price'].$gte = minPrice;
    if (maxPrice !== undefined) filter['pricing.price'].$lte = maxPrice;
  }

  // Brand filter
  if (brand) {
    filter.brand = new RegExp(brand, 'i');
  }

  // Tags filter
  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }

  // Featured filter
  if (featured !== undefined) {
    filter.isFeatured = featured;
  }

  // Stock filter
  if (inStock) {
    filter.$or = [
      { 'inventory.trackQuantity': false },
      { 'inventory.quantity': { $gt: 0 } },
      { 'inventory.allowBackorder': true },
    ];
  }

  const skip = (page - 1) * limit;

  return this.find(filter)
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

productSchema.statics.searchProducts = function (query, options = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    brand,
    sort = { score: { $meta: 'textScore' } },
    page = 1,
    limit = 20,
  } = options;

  const filter = {
    status: 'active',
    visibility: 'public',
    $text: { $search: query },
  };

  // Apply additional filters
  if (category) filter.category = category;
  if (brand) filter.brand = new RegExp(brand, 'i');
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter['pricing.price'] = {};
    if (minPrice !== undefined) filter['pricing.price'].$gte = minPrice;
    if (maxPrice !== undefined) filter['pricing.price'].$lte = maxPrice;
  }

  const skip = (page - 1) * limit;

  return this.find(filter, { score: { $meta: 'textScore' } })
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

productSchema.statics.getFeaturedProducts = function (limit = 10) {
  return this.find({
    status: 'active',
    visibility: 'public',
    isFeatured: true,
  })
    .populate('category', 'name slug')
    .sort('-salesCount')
    .limit(limit)
    .lean();
};

productSchema.statics.getRelatedProducts = function (
  productId,
  categoryId,
  limit = 4
) {
  return this.find({
    _id: { $ne: productId },
    category: categoryId,
    status: 'active',
    visibility: 'public',
  })
    .populate('category', 'name slug')
    .sort('-rating.average')
    .limit(limit)
    .lean();
};

productSchema.statics.getBestSellers = function (limit = 10) {
  return this.find({
    status: 'active',
    visibility: 'public',
  })
    .populate('category', 'name slug')
    .sort('-salesCount')
    .limit(limit)
    .lean();
};

productSchema.statics.getNewArrivals = function (days = 30, limit = 10) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  return this.find({
    status: 'active',
    visibility: 'public',
    publishedAt: { $gte: dateThreshold },
  })
    .populate('category', 'name slug')
    .sort('-publishedAt')
    .limit(limit)
    .lean();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
