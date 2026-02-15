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

    // ─── IDEMPOTENCY GUARD ──────────────────────────────────────────────
    // If BullMQ retries a job that already succeeded, skip it.
    const existing = await prisma.course.findUnique({
      where: { id: courseId },
      select: { status: true },
    });

    if (!existing) {
      logger.warn({ courseId }, "Skipping: course record not found (deleted?)");
      return;
    }

    if (existing.status === "PUBLISHED") {
      logger.warn({ courseId }, "Skipping: course already published (retry-safe)");
      return;
    }

    // Difficulty-aware token budget (matches quota reservation)
    const reservedTokens = getTokenBudget(difficulty);

    try {
      logger.info(
        { courseId, userId, difficulty, reservedTokens, jobId: job.id },
        "AI course generation started",
      );

      // 1. Call AI Service via PromptBuilder (includes Zod validation)
      const aiData = await generateCourseContent(
        rawText,
        language,
        difficulty,
        rawText,
      );

      logger.info(
        {
          courseId,
          modules: aiData.modules.length,
          totalLessons: aiData.modules.reduce((s, m) => s + m.lessons.length, 0),
        },
        "AI response validated, resolving YouTube URLs",
      );

      // 2. Resolve YouTube keywords → URLs BEFORE transaction
      const youtubeUrls = await batchResolveYouTube(aiData.modules);

      // 3. Calculate actual token cost
      const totalText = JSON.stringify(aiData);
      const actualTokens = Math.ceil(totalText.split(/\s+/).length * 1.3);

      // 4. ATOMIC SAVE & RECONCILE
      await prisma.$transaction(
        async (tx) => {
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
                        content: lesson.theory,
                        codeExample: lesson.codeExample || null,
                      },
                    },
                  })),
                },
              },
            });
          }

          await reconcileQuota(tx, userId, actualTokens - reservedTokens);

          await tx.course.update({
            where: { id: courseId },
            data: { status: "PUBLISHED" },
          });
        },
        { timeout: 30000 },
      );

      logger.info(
        { courseId, actualTokens, jobId: job.id },
        "Course generation completed successfully",
      );
    } catch (error) {
      logger.error(
        { courseId, jobId: job.id, error: error.message, stack: error.stack },
        "Worker error — course generation failed",
      );

      // Refund reserved tokens on failure
      try {
        await refundQuota(userId, reservedTokens);
        logger.info({ userId, reservedTokens }, "Quota refunded after failure");
      } catch (refundError) {
        logger.error(
          { userId, error: refundError.message },
          "CRITICAL: could not refund quota",
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
