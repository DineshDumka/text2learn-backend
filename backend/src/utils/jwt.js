const jwt = require("jsonwebtoken");

const getAccessSecret = () => process.env.ACCESS_TOKEN_SECRET;
const getRefreshSecret = () => process.env.REFRESH_TOKEN_SECRET;

const signAccessToken = (payload) => {
  // payload is usually { id: user.id, role: user.role }
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: "15m", // Access tokens must be short-lived
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: "7d", // Refresh tokens are long-lived
  });
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null; // If token is fake or expired, return null
  }
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  getRefreshSecret,
  getAccessSecret,
};
