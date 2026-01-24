
const prisma = require("../../config/prisma");
const progressService = require("./progress.service.js");

const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Expects { "q_uuid": "Answer", ... }
    const userId = req.user.id;

    // 🛡️ REPLAY PROTECTION
    // Check if user already has a high score for this lesson
    const existingProgress = await prisma.progress.findFirst({
      where: {
        userId,
        lesson: { quizzes: { id: quizId } },
        score: { not: null },
      },
    });

    if (existingProgress && existingProgress.score >= 80) {
      return res.status(400).json({
        status: "fail",
        message: "You have already passed this quiz with a high score.",
      });
    }

    const result = await progressService.evaluateQuiz(userId, quizId, answers);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

const getCourseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // This calls the optimized aggregation we wrote in Step 4.2
    const stats = await progressService.getCourseProgress(userId, courseId);

    res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};
const markAsComplete = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    const progress = await progressService.upsertProgress(userId, lessonId, true);

    res.status(200).json({
      status: "success",
      message: "Lesson marked as complete",
      data: { progress },
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

module.exports = { submitQuiz, getCourseStatus, markAsComplete }; 

