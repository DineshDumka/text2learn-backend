const { Worker } = require("bullmq");
const redisConnection = require("../../../config/redis");
const prisma = require("../../../config/prisma");
const { translateLesson } = require("../ai.service");

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

      // 2. AI Translation
      const translated = await translateLesson(
        original.title,
        original.content,
        targetLang,
      );

      // 3. Save as new LessonContent row
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

      console.log(`✅ Translated lesson ${lessonId} to ${targetLang}`);
    } catch (error) {
      console.error(`❌ Translation Failed for ${lessonId}:`, error.message);
      throw error;
    }
  },
  { connection: redisConnection },
);
