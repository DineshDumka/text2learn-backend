const lessonService = require("./lesson.service");
const translationQueue = require("../courses/jobs/translation.queue"); // Create this similarly to course.queue.js

const getLessonData = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang = "ENGLISH" } = req.query;

    // 1. Fetch lesson with fallback logic
    const lessonData = await lessonService.getLesson(id, lang);

    // 2. JIT Translation Trigger
    // If the content returned is NOT in the requested language, trigger translation
    if (lessonData.language !== lang) {
      console.log(`🌍 Triggering async translation for ${id} to ${lang}`);
      await translationQueue.add("TRANSLATE_LESSON", {
        lessonId: id,
        targetLang: lang,
      });
    }

    res.status(200).json({
      status: "success",
      data: { lesson: lessonData },
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};
