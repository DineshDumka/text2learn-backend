const { Worker } = require("bullmq");
const redisConnection = require("../../../config/redis");
const prisma = require("../../../config/prisma"); // Only one import needed
const { generateCourseContent } = require("../ai.service");

const courseWorker = new Worker(
  "course-generation",
  async (job) => {
    // 1. Extract everything we need from the job
    const { courseId, userId, rawText, language, difficulty } = job.data;

    try {
      console.log(`🚀 AI starting: ${courseId} for User: ${userId}`);

      // 2. Call AI Service
      const aiData = await generateCourseContent(rawText, language, difficulty);

      // 3. Calculate actual cost (Pre-transaction for performance)
      const totalText = JSON.stringify(aiData);
      const actualTokens = Math.ceil(totalText.split(/\s+/).length * 1.3);

      // 4. ATOMIC SAVE & RECONCILE
      await prisma.$transaction(async (tx) => {
        // --- SAVE YOUR MODULES & LESSONS HERE ---
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
                  contents: {
                    create: {
                      language: language || "ENGLISH",
                      title: lesson.title,
                      content: lesson.content,
                    },
                  },
                })),
              },
            },
          });
        }

        // --- RECONCILE QUOTA ---
// Net adjustment: actualTokens - 2000 (reserved)
// If actualTokens > 2000, this increments; if less, it decrements
await tx.userQuota.update({
  where: { userId },
  data: {
    used: {
      increment: actualTokens - 2000,
    },
  },
});


        // --- MARK COMPLETE ---
        await tx.course.update({
          where: { id: courseId },
          data: { status: "PUBLISHED" },
        });
      }, {
    timeout: 30000, 
  });

      console.log(`✅ Success! Tokens used: ${actualTokens}`);
    } catch (error) {
      console.error(`❌ Worker Error:`, error.message);

      // REFUND ON FAILURE: Only if the error happened BEFORE the quota was reconciled
      try {
        await prisma.userQuota.update({
          where: { userId },
          data: { used: { decrement: 2000 } },
        });
      } catch (refundError) {
        console.error("Critical: Could not refund quota", refundError.message);
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
