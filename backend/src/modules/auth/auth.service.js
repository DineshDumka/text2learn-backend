const prisma = require("../../config/prisma");
const passwordUtils = require("../../utils/password");
const tokenService = require("./token.service");
const AppError = require("../../utils/AppError");

const registerUser = async (userData) => {
  const { name, email, password } = userData;

  // 1. Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw AppError.conflict("User already exists with this email", "USER_EXISTS");
  }

  // 2. Hash the password
  const hashedPassword = await passwordUtils.hashPassword(password);

  // 3. Save to DB
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  // 4. Issue Tokens
  const tokens = await tokenService.generateAuthTokens(user);

  // Don't send the password hash back
  delete user.password;

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const loginUser = async (credentials) => {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw AppError.unauthorized("Invalid credentials", "INVALID_CREDENTIALS");
  }

  const isMatch = await passwordUtils.comparePassword(password, user.password);

  if (!isMatch) {
    throw AppError.unauthorized("Invalid credentials", "INVALID_CREDENTIALS");
  }

  const tokens = await tokenService.generateAuthTokens(user);

  delete user.password;

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const refreshSession = async (refreshTokenString) => {
  const session = await tokenService.verifyRefreshToken(refreshTokenString);

  if (!session) {
    throw AppError.unauthorized(
      "Invalid or expired session. Please login again.",
      "SESSION_INVALID",
    );
  }

  // Token rotation: delete old session
  await prisma.refreshToken.delete({
    where: { id: session.id },
  });

  // Issue brand new tokens
  const newTokens = await tokenService.generateAuthTokens(session.user);

  return newTokens;
};

const logoutUser = async (refreshTokenString) => {
  // deleteMany is idempotent — no error if not found
  await prisma.refreshToken.deleteMany({
    where: {
      hashedToken: refreshTokenString,
    },
  });
};

module.exports = { registerUser, loginUser, logoutUser, refreshSession };
