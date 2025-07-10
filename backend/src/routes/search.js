const express = require('express');
const searchController = require('../controllers/searchController');
const { validateQuery } = require('../middleware/validation');
const {
  advancedSearchSchema,
  autocompleteSchema,
} = require('../validators/searchValidator');

const router = express.Router();

/**
 * @route   GET /api/v1/search
 * @desc    Advanced product search with filtering and facets
 * @access  Public
 */
router.get(
  '/',
  validateQuery(advancedSearchSchema),
  searchController.advancedSearch
);

/**
 * @route   GET /api/v1/search/autocomplete
 * @desc    Get search autocomplete suggestions
 * @access  Public
 */
router.get(
  '/autocomplete',
  validateQuery(autocompleteSchema),
  searchController.autocomplete
);

/**
 * @route   GET /api/v1/search/popular
 * @desc    Get popular search terms
 * @access  Public
 */
router.get('/popular', searchController.getPopularSearches);

module.exports = router;
