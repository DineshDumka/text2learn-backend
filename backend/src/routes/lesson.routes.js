const express = require("express");
const lessonController = require("../modules/lessons/lessons.controller");
const courseController = require("../modules/courses/courses.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// Protected — get lesson content with language fallback + JIT translation
router.get("/:id", protect, lessonController.getLessonData);

// Protected — get quiz for a lesson (answers excluded for security)
router.get("/:lessonId/quiz", protect, courseController.getQuizByLesson);

module.exports = router;
