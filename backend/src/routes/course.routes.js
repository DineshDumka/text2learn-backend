const express = require("express");
const courseController = require("../modules/courses/courses.controller");
const { protect } = require("../middlewares/auth.middleware");
const { aiGenerationLimiter } = require("../middlewares/rateLimiter");
const { pdfUpload } = require("../middlewares/upload.middleware");

const router = express.Router();

// Public — search and list published courses
router.get("/", courseController.searchAndListCourses);

// Protected — create a new AI-generated course from text (rate limited)
router.post("/", protect, aiGenerationLimiter, courseController.createCourse);

// Protected — create a course from PDF upload (rate limited, 5MB max)
router.post(
  "/from-pdf",
  protect,
  aiGenerationLimiter,
  pdfUpload.single("pdf"),
  courseController.createCourseFromPdf,
);

// Protected — get full course details
router.get("/:id", protect, courseController.getCourseById);

// Protected — poll generation status (ownership enforced in service)
router.get("/:id/status", protect, courseController.getCourseStatus);

// Protected — delete a course (ownership enforced in service)
router.delete("/:id", protect, courseController.deleteCourse);

module.exports = router;