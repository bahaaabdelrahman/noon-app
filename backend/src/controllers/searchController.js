const Product = require('../models/Product');
const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../utils/errors');

/**
 * Advanced product search with filtering, sorting, and facets
 */
const advancedSearch = catchAsync(async (req, res) => {
  const {
    q, // search query
    category,
    subcategory,
    brand,
    minPrice,
    maxPrice,
    minRating,
    tags,
    inStock,
    featured,
    sortBy = 'relevance',
    page = 1,
    limit = 20,
    facets = true,
  } = req.query;

  // Build the base filter
  let filter = {
    status: 'active',
    visibility: 'public',
  };

  // Text search
  if (q && q.trim()) {
    filter.$text = { $search: q.trim() };
  }

  // Category filtering
  if (category) {
    const categoryDoc = await Category.findOne({
      $or: [{ slug: category }, { _id: category }],
    });
    if (categoryDoc) {
      filter.category = categoryDoc._id;
    }
  }

  // Subcategory filtering
  if (subcategory) {
    filter.subcategories = { $in: [subcategory] };
  }

  // Brand filtering
  if (brand) {
    if (Array.isArray(brand)) {
      filter.brand = { $in: brand };
    } else {
      filter.brand = brand;
    }
  }

  // Price range filtering
  if (minPrice || maxPrice) {
    filter['pricing.price'] = {};
    if (minPrice) filter['pricing.price'].$gte = parseFloat(minPrice);
    if (maxPrice) filter['pricing.price'].$lte = parseFloat(maxPrice);
  }

  // Rating filtering
  if (minRating) {
    filter['rating.average'] = { $gte: parseFloat(minRating) };
  }

  // Tags filtering
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    filter.tags = { $in: tagArray };
  }

  // Stock filtering
  if (inStock === 'true') {
    filter['inventory.quantity'] = { $gt: 0 };
  }

  // Featured filtering
  if (featured === 'true') {
    filter.isFeatured = true;
  }

  // Build sort options
  let sortOptions = {};
  switch (sortBy) {
    case 'price-low':
      sortOptions = { 'pricing.price': 1 };
      break;
    case 'price-high':
      sortOptions = { 'pricing.price': -1 };
      break;
    case 'rating':
      sortOptions = { 'rating.average': -1, 'rating.count': -1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    case 'popular':
      sortOptions = { salesCount: -1, viewCount: -1 };
      break;
    case 'name':
      sortOptions = { name: 1 };
      break;
    case 'relevance':
    default:
      if (q && q.trim()) {
        sortOptions = { score: { $meta: 'textScore' } };
      } else {
        sortOptions = { isFeatured: -1, salesCount: -1, createdAt: -1 };
      }
      break;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute search with projection for performance
  const projection = q && q.trim() ? { score: { $meta: 'textScore' } } : {};

  const products = await Product.find(filter, projection)
    .populate('category', 'name slug')
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get total count
  const totalProducts = await Product.countDocuments(filter);

  // Generate facets if requested
  let searchFacets = {};
  if (facets === 'true') {
    searchFacets = await generateSearchFacets(filter, q);
  }

  // Get search suggestions if query exists
  let suggestions = [];
  if (q && q.trim() && products.length < 5) {
    suggestions = await getSearchSuggestions(q);
  }

  res.status(200).json({
    success: true,
    data: {
      products,
      facets: searchFacets,
      suggestions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / limit),
        totalItems: totalProducts,
        itemsPerPage: parseInt(limit),
        hasNext: skip + products.length < totalProducts,
        hasPrev: page > 1,
      },
      searchInfo: {
        query: q || '',
        resultsCount: totalProducts,
        filters: {
          category,
          brand,
          priceRange:
            minPrice || maxPrice ? { min: minPrice, max: maxPrice } : null,
          minRating,
          tags,
          inStock: inStock === 'true',
          featured: featured === 'true',
        },
        sortBy,
      },
    },
    message: `Found ${totalProducts} products`,
  });
});

/**
 * Generate search facets for filtering
 */
const generateSearchFacets = async (baseFilter, searchQuery = '') => {
  const facets = {};

  try {
    // Remove filters to get all possible facet values
    const cleanFilter = { ...baseFilter };
    delete cleanFilter.category;
    delete cleanFilter.brand;
    delete cleanFilter['pricing.price'];
    delete cleanFilter['rating.average'];
    delete cleanFilter.tags;

    // Categories facet
    const categoryFacets = await Product.aggregate([
      { $match: cleanFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: '$categoryInfo' },
      {
        $project: {
          _id: 1,
          name: '$categoryInfo.name',
          slug: '$categoryInfo.slug',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    facets.categories = categoryFacets;

    // Brands facet
    const brandFacets = await Product.aggregate([
      { $match: cleanFilter },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    facets.brands = brandFacets.map(item => ({
      name: item._id,
      count: item.count,
    }));

    // Price ranges facet
    const priceStats = await Product.aggregate([
      { $match: cleanFilter },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$pricing.price' },
          maxPrice: { $max: '$pricing.price' },
          avgPrice: { $avg: '$pricing.price' },
        },
      },
    ]);

    if (priceStats.length > 0) {
      const { minPrice, maxPrice } = priceStats[0];
      facets.priceRanges = generatePriceRanges(minPrice, maxPrice);
    }

    // Rating facets
    const ratingFacets = await Product.aggregate([
      { $match: cleanFilter },
      {
        $bucket: {
          groupBy: '$rating.average',
          boundaries: [0, 1, 2, 3, 4, 5],
          default: 'unrated',
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    facets.ratings = ratingFacets.map(item => ({
      rating: item._id === 'unrated' ? 0 : item._id,
      count: item.count,
    }));

    // Tags facet
    const tagFacets = await Product.aggregate([
      { $match: cleanFilter },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    facets.tags = tagFacets.map(item => ({
      name: item._id,
      count: item.count,
    }));
  } catch (error) {
    console.error('Error generating facets:', error);
  }

  return facets;
};

/**
 * Generate price range buckets
 */
const generatePriceRanges = (minPrice, maxPrice) => {
  const ranges = [];
  const diff = maxPrice - minPrice;
  const step = diff / 5; // Create 5 ranges

  for (let i = 0; i < 5; i++) {
    const min = Math.floor(minPrice + step * i);
    const max =
      i === 4 ? Math.ceil(maxPrice) : Math.floor(minPrice + step * (i + 1));
    ranges.push({
      label: `$${min} - $${max}`,
      min,
      max,
      query: `minPrice=${min}&maxPrice=${max}`,
    });
  }

  return ranges;
};

/**
 * Get search suggestions based on partial query
 */
const getSearchSuggestions = async query => {
  try {
    // Get suggestions from product names
    const productSuggestions = await Product.aggregate([
      {
        $match: {
          status: 'active',
          visibility: 'public',
          name: { $regex: query, $options: 'i' },
        },
      },
      {
        $project: {
          suggestion: '$name',
          type: { $literal: 'product' },
          score: { $size: { $split: ['$name', ' '] } },
        },
      },
      { $sort: { score: 1 } },
      { $limit: 5 },
    ]);

    // Get suggestions from categories
    const categorySuggestions = await Category.aggregate([
      {
        $match: {
          name: { $regex: query, $options: 'i' },
        },
      },
      {
        $project: {
          suggestion: '$name',
          type: { $literal: 'category' },
          slug: '$slug',
        },
      },
      { $limit: 3 },
    ]);

    // Get suggestions from brands
    const brandSuggestions = await Product.aggregate([
      {
        $match: {
          status: 'active',
          visibility: 'public',
          brand: { $regex: query, $options: 'i' },
        },
      },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          suggestion: '$_id',
          type: { $literal: 'brand' },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    return [
      ...productSuggestions,
      ...categorySuggestions,
      ...brandSuggestions,
    ].slice(0, 8);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
};

/**
 * Get popular search terms
 */
const getPopularSearches = catchAsync(async (req, res) => {
  // This would typically come from a search analytics collection
  // For now, return some sample popular searches
  const popularSearches = [
    { term: 't-shirt', count: 1250 },
    { term: 'jeans', count: 980 },
    { term: 'sneakers', count: 850 },
    { term: 'dress', count: 720 },
    { term: 'jacket', count: 650 },
    { term: 'bag', count: 540 },
    { term: 'watch', count: 480 },
    { term: 'shoes', count: 420 },
  ];

  res.status(200).json({
    success: true,
    data: popularSearches,
    message: 'Popular searches retrieved successfully',
  });
});

/**
 * Search autocomplete endpoint
 */
const autocomplete = catchAsync(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Query too short for autocomplete',
    });
  }

  const suggestions = await getSearchSuggestions(q.trim());

  res.status(200).json({
    success: true,
    data: suggestions.slice(0, parseInt(limit)),
    message: 'Autocomplete suggestions retrieved successfully',
  });
});

module.exports = {
  advancedSearch,
  getPopularSearches,
  autocomplete,
};
