const authService = require("./auth.service");

const setTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true, // Prevents JS from reading the token (Protects against XSS)
    secure: process.env.NODE_ENV === "production", // Only sends over HTTPS in prod
    sameSite: "strict", // Prevents CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days in milliseconds
  });
};

const register = async (req, res) => {
  try {
    //register the user
    const { user, accessToken, refreshToken } = await authService.registerUser(
      req.body,
    );

    //  Set the secure cookie
    setTokenCookie(res, refreshToken);

    //  Send back only what the frontend needs
    res.status(201).json({
      status: "success",
      data: { user, accessToken },
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(
      req.body,
    );

    setTokenCookie(res, refreshToken);

    res.status(200).json({
      status: "success",
      data: { user, accessToken },
    });
  } catch (error) {
    res.status(401).json({ status: "fail", message: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      throw new Error("No refresh token provided");
    }

    //refresh token
    const { accessToken, refreshToken } =
      await authService.refreshSession(token);

    // Set the NEW rotated refresh token in the cookie
    setTokenCookie(res, refreshToken);

    // Send the new Access Token to the frontend
    res.status(200).json({
      status: "success",
      data: { accessToken },
    });
  } catch (err) {
    res.status(401).json({ status: "fail", message: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // Delete the token from our Database
      await authService.logoutUser(token);
    }

    // Clear the cookie from the browser
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(204).send(); // 204 means "No Content" - successful logout
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message }); // 400 means client sent someting invalid , malfunctioned or incorrect
  }
};

module.exports = {
  register,
  login,
};
