class ApiResponse {
  static success(data, message = "Success") {
    return {
      success: true,
      data,
      message,
      error: null,
    };
  }

  static error(message, code = "INTERNAL_ERROR", statusCode = 500) {
    return {
      success: false,
      data: null,
      error: { code, message },
    };
  }
}

module.exports = ApiResponse;
