/**
 * A small typed error so controllers can throw rich HTTP errors instead of
 * juggling res.status(...).json(...) everywhere. The central error handler
 * (middleware/errorHandler.js) reads `statusCode` to build the response.
 *
 * Example:  throw new ApiError(404, 'Post not found');
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    // Marks errors we intentionally threw (vs. unexpected crashes) so the
    // handler knows it is safe to show this message to the client.
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
