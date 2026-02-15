const logger = require("../config/logger");

/**
 * Global error handler middleware.
 * Must be mounted AFTER all routes in app.js.
 * Produces the standard response shape: { success, data, error }
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "Internal Server Error";

  // --- Prisma-specific error handling ---
  if (err.code === "P2025") {
    // Record not found
    statusCode = 404;
    code = "NOT_FOUND";
    message = "The requested resource was not found";
  } else if (err.code === "P2002") {
    // Unique constraint violation
    statusCode = 409;
    code = "CONFLICT";
    const field = err.meta?.target?.[0] || "field";
    message = `A record with this ${field} already exists`;
  } else if (err.code === "P2003") {
    // Foreign key constraint failure
    statusCode = 400;
    code = "INVALID_REFERENCE";
    message = "Referenced record does not exist";
  }

  // --- JWT errors ---
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    code = "INVALID_TOKEN";
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "TOKEN_EXPIRED";
    message = "Token has expired";
  }

  // Log the error (full stack for 500s, minimal for expected errors)
  if (statusCode >= 500) {
    logger.error({ err, url: req.originalUrl, method: req.method }, message);
  } else {
    logger.warn({ code, url: req.originalUrl, method: req.method }, message);
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: { code, message },
  });
};

module.exports = errorHandler;
