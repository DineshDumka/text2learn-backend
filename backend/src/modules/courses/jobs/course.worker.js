const { Worker } = require("bullmq");
const redisConnection = require("../../../config/redis");
const prisma = require("../../../config/prisma");
const { generateCourseContent } = require("../ai.service");
const { reconcileQuota, refundQuota } = require("../quota.service");
const { getTokenBudget } = require("../promptBuilder.service");
const { batchResolveYouTube } = require("../media.service");
const logger = require("../../../config/logger");

const courseWorker = new Worker(
  "course-generation",
  async (job) => {
    const { courseId, userId, rawText, language, difficulty } = job.data;

    // Difficulty-aware token budget (matches quota reservation)
    const reservedTokens = getTokenBudget(difficulty);

    try {
      logger.info(
        { courseId, userId, difficulty, reservedTokens },
        "AI course generation started",
      );

      // 1. Call AI Service via PromptBuilder (includes Zod validation)
      const aiData = await generateCourseContent(
        rawText,
        language,
        difficulty,
        rawText,
      );

      // 2. Resolve YouTube keywords → URLs BEFORE transaction (network calls outside tx)
      const youtubeUrls = await batchResolveYouTube(aiData.modules);

      logger.info(
        { courseId, resolvedVideos: youtubeUrls.size },
        "YouTube URLs resolved",
      );

      // 3. Calculate actual token cost
      const totalText = JSON.stringify(aiData);
      const actualTokens = Math.ceil(totalText.split(/\s+/).length * 1.3);

      // 4. ATOMIC SAVE & RECONCILE
      await prisma.$transaction(
        async (tx) => {
          // Save modules & lessons with mixed content
          for (let i = 0; i < aiData.modules.length; i++) {
            const mod = aiData.modules[i];
            await tx.module.create({
              data: {
                title: mod.title,
                order: i + 1,
                courseId: courseId,
                lessons: {
                  create: mod.lessons.map((lesson, idx) => ({
                    order: idx + 1,
                    youtubeUrl: youtubeUrls.get(`${i}-${idx}`) || null,
                    contents: {
                      create: {
                        language: language || "ENGLISH",
                        title: lesson.title,
                        content: lesson.theory, // theory → DB content field
                        codeExample: lesson.codeExample || null,
                      },
                    },
                  })),
                },
              },
            });
          }

          // Reconcile quota (adjust from estimate to actual)
          await reconcileQuota(tx, userId, actualTokens - reservedTokens);

          // Mark course as published
          await tx.course.update({
            where: { id: courseId },
            data: { status: "PUBLISHED" },
          });
        },
        { timeout: 30000 },
      );

      logger.info({ courseId, actualTokens }, "Course generation completed");
    } catch (error) {
      logger.error({ courseId, error: error.message }, "Worker error");

      // Refund reserved tokens on failure
      try {
        await refundQuota(userId, reservedTokens);
      } catch (refundError) {
        logger.error(
          { userId, error: refundError.message },
          "Critical: could not refund quota",
        );
      }

      await prisma.course.update({
        where: { id: courseId },
        data: { status: "FAILED" },
      });

      throw error; // Let BullMQ handle retries
    }
  },
  { connection: redisConnection },
);
