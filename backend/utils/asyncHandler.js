/**
 * Wraps an async Express handler so any rejected promise is forwarded to
 * Express's error middleware via next(err). Without this, a thrown error
 * inside an async controller would become an unhandled rejection.
 *
 * Usage:  router.get('/', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
