const express = require("express");
const router = express.Router();
const progressController = require("../modules/progress/progress.controller");
const { protect } = require("../middlewares/auth.middleware");

router.post("/quiz/:quizId", protect, progressController.submitQuiz);
router.get("/course/:courseId", protect, progressController.getCourseStatus);

router.post("/lesson/:lessonId", protect, progressController.markAsComplete);

module.exports = router;
