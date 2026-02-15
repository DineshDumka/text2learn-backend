const express = require("express");
const usersController = require("../modules/users/users.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// Protected — get current user's profile with quota info
router.get("/me", protect, usersController.getProfile);

module.exports = router;
