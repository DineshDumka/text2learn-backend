const express = require("express");
const courseController = require("../modules/courses/courses.controller");
const { protect } = require("../middlewares/auth.middleware");
const { aiGenerationLimiter } = require("../middlewares/rateLimiter"); // Fixed path

const router = express.Router();

// Only logged-in users can create courses (removed duplicate route)
router.post(
  "/",
  protect,  // Fixed: was 'authenticate'
  aiGenerationLimiter,
  courseController.createCourse,
);

router.get("/:id", protect, courseController.getCourseById);

router.get("/:id/status", protect, courseController.getCourseStatus); // Fixed: was 'authenticate'

module.exports = router;