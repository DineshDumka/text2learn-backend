const express = require("express");
const authController = require("../modules/auth/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// Public Routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);

// Protected Routes (Middleware is watching these)
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);

module.exports = router;
