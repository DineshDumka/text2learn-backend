/**
 * Standardized API response helper.
 *
 * Success: { success: true, data: ..., error: null }
 * Error:   { success: false, data: null, error: { code, message } }
 */
class ApiResponse {
  static success(data, statusCode = 200) {
    return {
      success: true,
      data,
      error: null,
    };
  }

  static error(message, code = "INTERNAL_ERROR") {
    return {
      success: false,
      data: null,
      error: { code, message },
    };
  }
}

module.exports = ApiResponse;
