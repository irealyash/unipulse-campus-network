import multer from 'multer';

/**
 * 404 handler for any route that didn't match. Placed just before the error
 * handler in server.js so unknown paths get a consistent JSON shape.
 */
export const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

/**
 * Central error handler. Every thrown ApiError (and unexpected error) funnels
 * here, producing one consistent JSON envelope: { success:false, message }.
 *
 * Must keep all four args (err, req, res, next) so Express recognizes it as an
 * error-handling middleware.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // --- Translate common library-specific errors into friendly messages ---

  // Mongoose: bad ObjectId in the URL (e.g. /posts/not-a-real-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose: schema validation failed
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Mongo: duplicate key (e.g. email/username already taken)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || { value: '' })[0];
    message = `That ${field} is already taken.`;
  }

  // Multer: file too large / unexpected field, etc.
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = `Upload error: ${err.message}`;
  }

  // Log unexpected (non-operational) errors with the stack for debugging.
  if (statusCode === 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({ success: false, message });
};
