const prisma = require("../../config/prisma");
const AppError = require("../../utils/AppError");

const getLesson = async (lessonId, requestedLang = "ENGLISH") => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      contents: {
        where: { language: requestedLang },
      },
      quizzes: {
        include: { questions: true },
      },
    },
  });

  if (!lesson) {
    throw AppError.notFound("Lesson not found");
  }

  // If translation doesn't exist, fallback to ENGLISH
  const content =
    lesson.contents[0] ||
    (await prisma.lessonContent.findFirst({
      where: { lessonId, language: "ENGLISH" },
    }));

  return {
    ...lesson,
    title: content?.title || "No Title",
    content: content?.content || "No Content Available",
    language: content?.language,
  };
};

module.exports = { getLesson };