const courseService = require("./courses.service");
const prisma = require("../../config/prisma");

const ApiResponse = require("../../utils/ApiResponse");

/**
 * Specialized endpoint for Frontend Polling
 */
const getCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From auth middleware

    const statusData = await courseService.getCourseStatusOnly(id, userId);

    res.status(200).json(ApiResponse.success(statusData));
  } catch (error) {
    const statusCode = error.message === "NOT_FOUND" ? 404 : 403;
    res
      .status(statusCode)
      .json(ApiResponse.error(error.message, "STATUS_CHECK_FAILED"));
  }
};

const createCourse = async (req, res) => {
  try {
    // Debug line
    console.log("Request Body:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ status: "fail", message: "Request body is empty" });
    }

    // req.user comes from 'protect' middleware
    const course = await courseService.createCourse(req.body, req.user.id);

    res.status(201).json({
      status: "success",
      message: "Course generation started",
      data: {
        courseId: course.id,
        status: course.status,
      },
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    // We use 'include' to fetch the modules and lessons too!
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: true,
          },
          orderBy: { order: "asc" }, // Keep them in order
        },
      },
    });

    if (!course) {
      return res
        .status(404)
        .json({ status: "fail", message: "Course not found" });
    }
    

    res.status(200).json({ status: "success", data: { course } });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

const getQuizByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const quiz = await prisma.quiz.findFirst({
      where: { lessonId },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            options: true,
            // 🛡️ SECURITY: We do NOT select the 'answer' field here.
            // Users should not be able to see the answer in the API response!
          },
        },
      },
    });

    if (!quiz) {
      return res
        .status(404)
        .json({ status: "fail", message: "No quiz found for this lesson" });
    }

    res.status(200).json({ status: "success", data: { quiz } });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

const searchAndListCourses = async (req, res) => {
  try {
    const { q, difficulty, language, limit = 10, cursor } = req.query;

    // Call the optimized service logic we designed
    const { courses, nextCursor } = await courseService.searchCourses({
      query: q,
      difficulty,
      language,
      limit,
      cursor,
    });

    res.status(200).json({
      status: "success",
      results: courses.length,
      data: {
        courses,
        nextCursor, // The client sends this back to get the next page
      },
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

module.exports = {
  createCourse,
  getCourseById,
  getQuizByLesson,
  searchAndListCourses,
  getCourseStatus,
};
