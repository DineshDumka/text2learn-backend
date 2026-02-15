const lessonService = require("./lessons.service");
const translationQueue = require("../courses/jobs/translation.queue");
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const logger = require("../../config/logger");

/**
 * GET /lessons/:id?lang=ENGLISH
 * Fetch lesson content with language fallback + JIT translation trigger
 */
const getLessonData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { lang = "ENGLISH" } = req.query;

  const lessonData = await lessonService.getLesson(id, lang);

  // JIT translation trigger — if fallback was used, queue a translation
  if (lessonData.language !== lang) {
    logger.info(
      { lessonId: id, targetLang: lang },
      "Triggering async translation",
    );
    await translationQueue.add("TRANSLATE_LESSON", {
      lessonId: id,
      targetLang: lang,
    });
  }

  res.status(200).json(ApiResponse.success({ lesson: lessonData }));
});

module.exports = { getLessonData };