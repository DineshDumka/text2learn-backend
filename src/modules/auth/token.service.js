const jwt = require("../../utils/jwt");
const prisma = require("../../config/prisma");

const generateAuthTokens = async (user) => {
  // 1. Generate the raw strings
  const accessTokenString = jwt.signAccessToken({
    id: user.id,
    role: user.role,
  });
  const refreshTokenString = jwt.signRefreshToken({ id: user.id });

  // 2. Calculate expiry (e.g., 7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // 3. DATABASE OPERATION
  // We save the token so we can "revoke" it later if needed.
  await prisma.refreshToken.create({
    data: {
      hashedToken: refreshTokenString, // For now, we store raw; we'll hash later
      userId: user.id,
      expiresAt: expiresAt,
    },
  });

  // 4. Return both strings so the Controller can send them to the user
  return { accessToken: accessTokenString, refreshToken: refreshTokenString };
};

const verifyRefreshToken = async (tokenFromUser) => {
  // 1. Search the DB for this specific token string
  const session = await prisma.refreshToken.findUnique({
    where: {
      hashedToken: tokenFromUser,
    },
    include: {
      user: true,
    },
  });

  // 2. Check if the session exists
  if (!session) {
    throw new Error("Invalid or expired session");
  }

  // 3. Check if the session was manually revoked (Logout)
  if (session.revoked) {
    throw new Error("This session has been revoked");
  }

  // 4. Check if the token has expired based on the date
  if (new Date() > session.expiresAt) {
    throw new Error("Session expired");
  }

  return session;
};

module.exports = {
  generateAuthTokens,
  verifyRefreshToken,
};
