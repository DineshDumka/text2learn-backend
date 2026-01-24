const ApiResponse = require("../utils/ApiResponse");

const errorHandler = (err, req, res, next) => {
  console.error("🔥 Global Error:", err.stack);

  // If it's a known error (like Quota), use its message
  const message = err.message || "Internal Server Error";
  const code = err.code || "SERVER_ERROR";
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json(ApiResponse.error(message, code));
};

module.exports = errorHandler;
