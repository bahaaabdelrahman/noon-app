const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * Category schema for organizing products
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Category description cannot exceed 500 characters'],
    },
    image: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
      alt: {
        type: String,
        default: '',
      },
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 3, // Maximum 4 levels (0, 1, 2, 3)
    },
    path: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    metaData: {
      title: {
        type: String,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      keywords: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    productCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isFeatured: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory',
});

// Virtual for products
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
});

/**
 * Pre-save middleware to generate slug
 */
categorySchema.pre('save', async function (next) {
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
      const existingCategory = await this.constructor.findOne({
        slug,
        _id: { $ne: this._id },
      });

      if (!existingCategory) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }

  next();
});

/**
 * Pre-save middleware to calculate level and path
 */
categorySchema.pre('save', async function (next) {
  if (this.isModified('parentCategory') || this.isNew) {
    if (this.parentCategory) {
      const parent = await this.constructor.findById(this.parentCategory);

      if (!parent) {
        return next(new Error('Parent category not found'));
      }

      if (parent.level >= 3) {
        return next(new Error('Maximum category depth exceeded'));
      }

      this.level = parent.level + 1;
      this.path = parent.path ? `${parent.path}/${parent.slug}` : parent.slug;
    } else {
      this.level = 0;
      this.path = '';
    }
  }

  next();
});

/**
 * Post-save middleware to update product count
 */
categorySchema.post('save', async function () {
  await this.updateProductCount();
});

/**
 * Instance method to update product count
 */
categorySchema.methods.updateProductCount = async function () {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({
    category: this._id,
    isActive: true,
  });

  await this.constructor.findByIdAndUpdate(this._id, { productCount: count });
};

/**
 * Instance method to get category hierarchy
 */
categorySchema.methods.getHierarchy = async function () {
  const hierarchy = [this];
  let current = this;

  while (current.parentCategory) {
    current = await this.constructor.findById(current.parentCategory);
    if (current) {
      hierarchy.unshift(current);
    } else {
      break;
    }
  }

  return hierarchy;
};

/**
 * Instance method to get all descendants
 */
categorySchema.methods.getDescendants = async function () {
  const descendants = [];

  const findChildren = async categoryId => {
    const children = await this.constructor.find({
      parentCategory: categoryId,
    });

    for (const child of children) {
      descendants.push(child);
      await findChildren(child._id);
    }
  };

  await findChildren(this._id);
  return descendants;
};

/**
 * Static method to get category tree
 */
categorySchema.statics.getCategoryTree = async function (
  parentId = null,
  maxLevel = 3
) {
  const categories = await this.find({
    parentCategory: parentId,
    isActive: true,
  }).sort({ sortOrder: 1, name: 1 });

  const tree = [];

  for (const category of categories) {
    const categoryObj = category.toObject();

    if (category.level < maxLevel) {
      categoryObj.children = await this.getCategoryTree(category._id, maxLevel);
    } else {
      categoryObj.children = [];
    }

    tree.push(categoryObj);
  }

  return tree;
};

/**
 * Static method to get featured categories
 */
categorySchema.statics.getFeaturedCategories = function (limit = 10) {
  return this.find({
    isFeatured: true,
    isActive: true,
  })
    .sort({ sortOrder: 1, name: 1 })
    .limit(limit)
    .populate('subcategories', 'name slug image productCount');
};

/**
 * Static method to search categories
 */
categorySchema.statics.searchCategories = function (query, options = {}) {
  const { limit = 20, skip = 0, level = null, parentCategory = null } = options;

  const filter = {
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { 'metaData.keywords': { $regex: query, $options: 'i' } },
    ],
  };

  if (level !== null) {
    filter.level = level;
  }

  if (parentCategory) {
    filter.parentCategory = parentCategory;
  }

  return this.find(filter)
    .sort({ productCount: -1, name: 1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Pre-remove middleware to handle category deletion
 */
categorySchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    // Check if category has products
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ category: this._id });

    if (productCount > 0) {
      return next(new Error('Cannot delete category with existing products'));
    }

    // Move subcategories to parent or make them root categories
    await this.constructor.updateMany(
      { parentCategory: this._id },
      { parentCategory: this.parentCategory || null }
    );

    next();
  }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
