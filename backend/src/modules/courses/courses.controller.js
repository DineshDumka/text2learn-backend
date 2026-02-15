const courseService = require("./courses.service");
const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const AppError = require("../../utils/AppError");
const ApiResponse = require("../../utils/ApiResponse");

/**
 * POST /courses — Create a new AI-generated course
 */
const createCourse = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw AppError.badRequest("Request body is empty", "EMPTY_BODY");
  }

  const course = await courseService.createCourse(req.body, req.user.id);

  res.status(201).json(
    ApiResponse.success({
      courseId: course.id,
      status: course.status,
    }),
  );
});

/**
 * GET /courses/:id — Get full course with modules & lessons
 */
const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        include: {
          lessons: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) {
    throw AppError.notFound("Course not found");
  }

  res.status(200).json(ApiResponse.success({ course }));
});

/**
 * GET /courses/:id/status — Poll generation status (ownership enforced)
 */
const getCourseStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const statusData = await courseService.getCourseStatusOnly(id, userId);

  res.status(200).json(ApiResponse.success(statusData));
});

/**
 * GET /courses — Search and list published courses (public)
 */
const searchAndListCourses = asyncHandler(async (req, res) => {
  const { q, difficulty, language, limit = 10, cursor } = req.query;

  const { courses, nextCursor } = await courseService.searchCourses({
    query: q,
    difficulty,
    language,
    limit,
    cursor,
  });

  res.status(200).json(
    ApiResponse.success({
      results: courses.length,
      courses,
      nextCursor,
    }),
  );
});

/**
 * GET /courses/:courseId/lessons/:lessonId/quiz — Get quiz for a lesson (answers excluded)
 */
const getQuizByLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;

  const quiz = await prisma.quiz.findFirst({
    where: { lessonId },
    include: {
      questions: {
        select: {
          id: true,
          text: true,
          options: true,
          // SECURITY: answer excluded so users can't cheat
        },
      },
    },
  });

  if (!quiz) {
    throw AppError.notFound("No quiz found for this lesson");
  }

  res.status(200).json(ApiResponse.success({ quiz }));
});

/**
 * DELETE /courses/:id — Delete a course (ownership enforced in service)
 */
const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await courseService.deleteCourse(id, userId);

  res.status(200).json(ApiResponse.success(null));
});

module.exports = {
  createCourse,
  getCourseById,
  getQuizByLesson,
  searchAndListCourses,
  getCourseStatus,
  deleteCourse,
};
