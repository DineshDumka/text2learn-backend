const express = require("express");
const courseController = require("../modules/courses/courses.controller");
const { protect } = require("../middlewares/auth.middleware");
const { aiGenerationLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

// Public — search and list published courses
router.get("/", courseController.searchAndListCourses);

// Protected — create a new AI-generated course (rate limited)
router.post("/", protect, aiGenerationLimiter, courseController.createCourse);

// Protected — get full course details
router.get("/:id", protect, courseController.getCourseById);

// Protected — poll generation status (ownership enforced in service)
router.get("/:id/status", protect, courseController.getCourseStatus);

// Protected — delete a course (ownership enforced in service)
router.delete("/:id", protect, courseController.deleteCourse);

module.exports = router;