const mongoose = require('mongoose');

/**
 * Wishlist Schema
 * Manages user wishlists with products and sharing capabilities
 */
const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: 'My Wishlist',
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          trim: true,
          maxlength: 200,
        },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
      },
    ],

    privacy: {
      type: String,
      enum: ['private', 'public', 'shared'],
      default: 'private',
    },

    sharedWith: [
      {
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
        permissions: {
          type: String,
          enum: ['view', 'edit'],
          default: 'view',
        },
      },
    ],

    shareToken: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    tags: [
      {
        type: String,
        trim: true,
        maxlength: 30,
      },
    ],

    totalItems: {
      type: Number,
      default: 0,
    },

    totalValue: {
      type: Number,
      default: 0,
    },

    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
wishlistSchema.index({ user: 1, name: 1 });
wishlistSchema.index({ privacy: 1 });
wishlistSchema.index({ shareToken: 1 });
wishlistSchema.index({ 'items.product': 1 });
wishlistSchema.index({ user: 1, isDefault: 1 });

// Ensure only one default wishlist per user
wishlistSchema.index(
  { user: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
  }
);

/**
 * Virtual for total item count
 */
wishlistSchema.virtual('itemCount').get(function () {
  return this.items.length;
});

/**
 * Virtual for share URL
 */
wishlistSchema.virtual('shareUrl').get(function () {
  if (this.shareToken) {
    return `${process.env.FRONTEND_URL}/wishlists/shared/${this.shareToken}`;
  }
  return null;
});

/**
 * Pre-save middleware
 */
wishlistSchema.pre('save', function (next) {
  // Update totalItems count
  this.totalItems = this.items.length;

  // Update lastModified
  this.lastModified = new Date();

  next();
});

/**
 * Instance method to add a product to wishlist
 */
wishlistSchema.methods.addProduct = function (productId, options = {}) {
  // Check if product already exists
  const existingIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );

  if (existingIndex !== -1) {
    // Update existing item
    if (options.notes) this.items[existingIndex].notes = options.notes;
    if (options.priority) this.items[existingIndex].priority = options.priority;
    return this.items[existingIndex];
  }

  // Add new item
  const newItem = {
    product: productId,
    notes: options.notes || '',
    priority: options.priority || 'medium',
  };

  this.items.push(newItem);
  return newItem;
};

/**
 * Instance method to remove a product from wishlist
 */
wishlistSchema.methods.removeProduct = function (productId) {
  const initialLength = this.items.length;
  this.items = this.items.filter(
    item => item.product.toString() !== productId.toString()
  );
  return this.items.length < initialLength;
};

/**
 * Instance method to clear all items
 */
wishlistSchema.methods.clearItems = function () {
  this.items = [];
  this.totalItems = 0;
  this.totalValue = 0;
};

/**
 * Instance method to generate share token
 */
wishlistSchema.methods.generateShareToken = function () {
  const crypto = require('crypto');
  this.shareToken = crypto.randomBytes(32).toString('hex');
  return this.shareToken;
};

/**
 * Static method to find user's default wishlist
 */
wishlistSchema.statics.findOrCreateDefault = async function (userId) {
  let defaultWishlist = await this.findOne({ user: userId, isDefault: true });

  if (!defaultWishlist) {
    defaultWishlist = await this.create({
      user: userId,
      name: 'My Wishlist',
      isDefault: true,
    });
  }

  return defaultWishlist;
};

/**
 * Static method to get user's wishlists with product counts
 */
wishlistSchema.statics.getUserWishlists = async function (
  userId,
  options = {}
) {
  const { includeItems = false } = options;

  let query = this.find({ user: userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  if (includeItems) {
    query = query.populate(
      'items.product',
      'name slug images pricing.price status'
    );
  }

  return query.exec();
};

/**
 * Static method to find shared wishlist by token
 */
wishlistSchema.statics.findByShareToken = async function (token) {
  return this.findOne({
    shareToken: token,
    privacy: { $in: ['public', 'shared'] },
  })
    .populate('user', 'firstName lastName')
    .populate('items.product', 'name slug images pricing.price status');
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
