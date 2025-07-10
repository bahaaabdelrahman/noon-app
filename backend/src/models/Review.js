const mongoose = require('mongoose');

/**
 * Review schema for product reviews and ratings
 */
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
      maxlength: [100, 'Review title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    },
    verified: {
      type: Boolean,
      default: false, // Set to true if user purchased the product
    },
    helpful: {
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          default: '',
        },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'approved', // Auto-approve for now, can add moderation later
    },
    moderationReason: {
      type: String,
      trim: true,
    },
    flags: {
      inappropriate: {
        count: {
          type: Number,
          default: 0,
        },
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
      spam: {
        count: {
          type: Number,
          default: 0,
        },
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    },
    response: {
      // Store seller/admin response to review
      text: {
        type: String,
        trim: true,
        maxlength: [500, 'Response cannot exceed 500 characters'],
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      respondedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ verified: 1 });

// Virtual for review age
reviewSchema.virtual('age').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // Days
});

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function () {
  const totalVotes = this.helpful.count;
  if (totalVotes === 0) return 0;
  return Math.round((this.helpful.count / totalVotes) * 100);
});

/**
 * Pre-save middleware to validate business rules
 */
reviewSchema.pre('save', async function (next) {
  // Check if user has purchased this product (verified purchase)
  if (this.isNew) {
    const Order = mongoose.model('Order');
    const hasOrdered = await Order.findOne({
      user: this.user,
      'items.product': this.product,
      status: { $in: ['delivered', 'completed'] },
    });

    this.verified = !!hasOrdered;
  }

  next();
});

/**
 * Post-save middleware to update product rating statistics
 */
reviewSchema.post('save', async function () {
  await this.constructor.updateProductRating(this.product);
});

/**
 * Post-remove middleware to update product rating statistics
 */
reviewSchema.post('remove', async function () {
  await this.constructor.updateProductRating(this.product);
});

/**
 * Static method to calculate and update product rating
 */
reviewSchema.statics.updateProductRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: {
        product: productId,
        status: 'approved',
      },
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating',
        },
      },
    },
  ]);

  if (stats.length > 0) {
    const { averageRating, totalReviews, ratingDistribution } = stats[0];

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach(rating => {
      distribution[rating]++;
    });

    // Update product with new rating statistics
    const Product = mongoose.model('Product');
    await Product.findByIdAndUpdate(productId, {
      'rating.average': Math.round(averageRating * 10) / 10, // Round to 1 decimal
      'rating.count': totalReviews,
      'rating.distribution': distribution,
    });
  } else {
    // No reviews, reset to defaults
    const Product = mongoose.model('Product');
    await Product.findByIdAndUpdate(productId, {
      'rating.average': 0,
      'rating.count': 0,
      'rating.distribution': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  }
};

/**
 * Instance method to mark review as helpful
 */
reviewSchema.methods.markHelpful = async function (userId) {
  if (this.helpful.users.includes(userId)) {
    // Remove from helpful
    this.helpful.users.pull(userId);
    this.helpful.count = Math.max(0, this.helpful.count - 1);
  } else {
    // Add to helpful
    this.helpful.users.push(userId);
    this.helpful.count++;
  }

  await this.save();
  return this;
};

/**
 * Instance method to flag review
 */
reviewSchema.methods.flagReview = async function (
  userId,
  flagType = 'inappropriate'
) {
  const flagField = this.flags[flagType];

  if (!flagField.users.includes(userId)) {
    flagField.users.push(userId);
    flagField.count++;

    // Auto-flag if too many flags
    if (flagField.count >= 5) {
      this.status = 'flagged';
    }

    await this.save();
  }

  return this;
};

/**
 * Static method to get review statistics for a product
 */
reviewSchema.statics.getProductReviewStats = async function (productId) {
  const mongoose = require('mongoose');

  const stats = await this.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: 'approved',
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        verifiedReviews: {
          $sum: { $cond: ['$verified', 1, 0] },
        },
        ratingBreakdown: {
          $push: '$rating',
        },
      },
    },
  ]);

  let result = stats[0] || {
    averageRating: 0,
    totalReviews: 0,
    verifiedReviews: 0,
    ratingBreakdown: [],
  };

  // Convert ratingBreakdown to proper format
  if (result.ratingBreakdown && result.ratingBreakdown.length > 0) {
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.ratingBreakdown.forEach(rating => {
      breakdown[rating] = (breakdown[rating] || 0) + 1;
    });
    result.ratingBreakdown = Object.entries(breakdown).map(
      ([rating, count]) => ({
        rating: parseInt(rating),
        count,
      })
    );
  }

  return result;
};

module.exports = mongoose.model('Review', reviewSchema);
