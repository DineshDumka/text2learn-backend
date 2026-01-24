const express = require("express");
const courseController = require("../modules/courses/courses.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// Only logged-in users can create courses
router.post("/", protect, courseController.createCourse);
router.get("/:id", courseController.getCourseById);

module.exports = router;
