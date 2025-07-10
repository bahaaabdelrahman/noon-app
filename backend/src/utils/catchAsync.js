/**
 * Wrapper function to catch async errors and pass them to error handling middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const catchAsync = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
