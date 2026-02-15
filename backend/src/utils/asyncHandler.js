/**
 * Wraps an async Express route handler to catch promise rejections
 * and forward them to Express error middleware via next(err).
 *
 * Usage: router.get('/path', asyncHandler(myController.handler));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
