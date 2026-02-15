const { Worker } = require("bullmq");
const redisConnection = require("../../../config/redis");
const prisma = require("../../../config/prisma");
const { translateLesson } = require("../ai.service");
const logger = require("../../../config/logger");

const translationWorker = new Worker(
  "content-translation",
  async (job) => {
    const { lessonId, targetLang } = job.data;

    try {
      // 1. Fetch original English version
      const original = await prisma.lessonContent.findUnique({
        where: {
          lessonId_language: { lessonId, language: "ENGLISH" },
        },
      });

      if (!original) throw new Error("Original content not found");

      // 2. AI Translation (includes Zod validation)
      const translated = await translateLesson(
        original.title,
        original.content,
        targetLang,
      );

      // 3. Save as new LessonContent row (idempotent upsert)
      await prisma.lessonContent.upsert({
        where: {
          lessonId_language: { lessonId, language: targetLang },
        },
        update: {
          title: translated.title,
          content: translated.content,
        },
        create: {
          lessonId,
          language: targetLang,
          title: translated.title,
          content: translated.content,
        },
      });

      logger.info({ lessonId, targetLang }, "Translation completed");
    } catch (error) {
      logger.error(
        { lessonId, targetLang, error: error.message },
        "Translation failed",
      );
      throw error;
    }
  },
  { connection: redisConnection },
);
