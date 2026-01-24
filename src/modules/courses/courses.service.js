const prisma = require("../../config/prisma");
const courseQueue = require("../../queue/course.queue");

const createCourse = async (courseData, userId) => {
  const { title, description, difficulty, language, rawText } = courseData;

  // 1. Save the 'Shell' of the course in DB
  const course = await prisma.course.create({
    data: {
      title,
      description,
      difficulty,
      language,
      rawText,
      creatorId: userId,
      status: "GENERATING", // From  enum
    },
  });

  // 2. Put the job in the queue for the Worker to find
  await courseQueue.add("COURSE_GENERATION", {
    courseId: course.id,
    rawText: rawText || title,
    language,
    difficulty,
  });

  return course;
};

module.exports = { createCourse };
