const prisma = require("../../config/prisma");
const progressService = require("./progress.service.js");
const asyncHandler = require("../../utils/asyncHandler");
const AppError = require("../../utils/AppError");
const ApiResponse = require("../../utils/ApiResponse");

const submitQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body;
  const userId = req.user.id;

  // Replay protection: check if user already passed
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { lessonId: true },
  });

  if (!quiz) {
    throw AppError.notFound("Quiz not found");
  }

  const existingProgress = await prisma.progress.findFirst({
    where: {
      userId,
      lessonId: quiz.lessonId,
      score: { not: null },
    },
  });

  if (existingProgress && existingProgress.score >= 80) {
    throw AppError.badRequest(
      "You have already passed this quiz with a high score.",
      "QUIZ_ALREADY_PASSED",
    );
  }

  const result = await progressService.evaluateQuiz(userId, quizId, answers);

  res.status(200).json(ApiResponse.success(result));
});

const getCourseStatus = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const stats = await progressService.getCourseProgress(userId, courseId);

  res.status(200).json(ApiResponse.success(stats));
});

const markAsComplete = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user.id;

  const progress = await progressService.upsertProgress(userId, lessonId, true);

  res.status(200).json(ApiResponse.success({ progress }));
});

module.exports = { submitQuiz, getCourseStatus, markAsComplete };
