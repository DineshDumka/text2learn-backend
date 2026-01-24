const prisma = require("../../config/prisma");

/**
 * 1. The Idempotent Upsert
 * Ensures we don't create duplicate rows if a user clicks 'Complete' twice.
 */
const upsertProgress = async (
  userId,
  lessonId,
  completed = true,
  score = null,
) => {
  return await prisma.progress.upsert({
    where: {
      userId_lessonId: { userId, lessonId }, // Uses the @@unique constraint
    },
    update: { completed, score },
    create: { userId, lessonId, completed, score },
  });
};

/**
 * 2. Optimized Course Aggregation
 * Use a single query to get counts instead of fetching all rows.
 */
const getCourseProgress = async (userId, courseId) => {
  // We run these in parallel for speed
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({
      where: { module: { courseId } },
    }),
    prisma.progress.count({
      where: {
        userId,
        completed: true,
        lesson: { module: { courseId } },
      },
    }),
  ]);

  const percentage =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  return {
    totalLessons,
    completedLessons,
    percentage,
  };
};


/**
 * Quiz Evaluation Logic
 */
const evaluateQuiz = async (userId, quizId, userAnswers) => {
  // 1. Fetch Quiz with Questions to get correct answers
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true, lesson: true },
  });

  if (!quiz) throw new Error("Quiz not found");

  let correctCount = 0;
  const totalQuestions = quiz.questions.length;

  // 2. Compare user answers vs Database answers
  quiz.questions.forEach((q) => {
    if (userAnswers[q.id] === q.answer) {
      correctCount++;
    }
  });

  // 3. Calculate Score (Percentage)
  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= 60; // Pass threshold: 60%

  // 4. Update Progress Table
  const progress = await upsertProgress(userId, quiz.lessonId, passed, score);

  return {
    score,
    passed,
    correctCount,
    totalQuestions,
    progress,
  };
};

module.exports = {
  upsertProgress,
  getCourseProgress,
   evaluateQuiz, 
};


