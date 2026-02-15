const authService = require("./auth.service");
const asyncHandler = require("../../utils/asyncHandler");
const AppError = require("../../utils/AppError");
const ApiResponse = require("../../utils/ApiResponse");

const setTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
  });
};

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(
    req.body,
  );

  setTokenCookie(res, refreshToken);

  res.status(201).json(ApiResponse.success({ user, accessToken }));
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(
    req.body,
  );

  setTokenCookie(res, refreshToken);

  res.status(200).json(ApiResponse.success({ user, accessToken }));
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw AppError.unauthorized("No refresh token provided", "NO_REFRESH_TOKEN");
  }

  const { accessToken, refreshToken } =
    await authService.refreshSession(token);

  setTokenCookie(res, refreshToken);

  res.status(200).json(ApiResponse.success({ accessToken }));
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    await authService.logoutUser(token);
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.status(204).send();
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(ApiResponse.success({ user: req.user }));
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
