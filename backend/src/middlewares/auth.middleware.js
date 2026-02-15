const jwt = require("../utils/jwt");
const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw AppError.unauthorized("Not authorized, no token", "NO_TOKEN");
    }

    // Verify token
    const decoded = jwt.verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
      throw AppError.unauthorized("Not authorized, token failed", "INVALID_TOKEN");
    }

    // Check if user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      throw AppError.unauthorized(
        "User belonging to this token no longer exists",
        "USER_NOT_FOUND",
      );
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    // If it's already an AppError, pass it through to error middleware
    if (error.isOperational) {
      return next(error);
    }
    next(AppError.unauthorized("Not authorized", "AUTH_FAILED"));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          "You do not have permission to perform this action",
          "ROLE_FORBIDDEN",
        ),
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
