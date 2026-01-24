const prisma = require("../../config/prisma");
const passwordUtils = require("../../utils/password");
const tokenService = require("./token.service");

const registerUser = async (userData) => {
  const { name, email, password } = userData;

  // 1. Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User already exists with this email");
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
  // We pass the newly created 'user' to the token service
  const tokens = await tokenService.generateAuthTokens(user);

  // We don't want to send the password hash back to the frontend/controller
  delete user.password;

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const loginUser = async (credentials) => {
  const { email, password } = credentials;

  //  Find user in DB
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid Credentials");
  }

  // Password Check
  // Compare plain text input with the hashed string from the DB
  const isMatch = await passwordUtils.comparePassword(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid Credentials");
  }

  // Generate Tokens
  const tokens = await tokenService.generateAuthTokens(user);

  // Cleanup and Return
  delete user.password;

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const refreshSession = async (refreshTokenString) => {
  // Verify the token (This checks DB existence, expiry, and revocation)
  const session = await tokenService.verifyRefreshToken(refreshTokenString);

  if (!session) {
    throw new Error("Invalid or expired session. Please login again.");
  }

  // 2. TOKEN ROTATION
  // We delete the old session so it can never be used again.
  // This prevents 'Replay Attacks' where a hacker uses an old token.
  await prisma.refreshToken.delete({
    where: { id: session.id },
  });

  // 3. Issue brand new tokens for the user
  const newTokens = await tokenService.generateAuthTokens(session.user);

  return newTokens;
};

const logoutUser = async (refreshTokenString) => {
  // Use deleteMany instead of delete.
  // Why? deleteMany doesn't throw an error if the record is missing.
  // It just returns { count: 0 }. This makes our code "Idempotent."
  await prisma.refreshToken.deleteMany({
    where: {
      hashedToken: refreshTokenString,
    },
  });
};

module.exports = { registerUser, loginUser, logoutUser, refreshSession };
