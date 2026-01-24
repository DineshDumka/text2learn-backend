const courseService = require("./courses.service");

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

module.exports = { createCourse };
