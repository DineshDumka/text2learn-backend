const { Worker } = require("bullmq");
const redisConnection = require("../../../config/redis");
const prisma = require("../../../config/prisma");
const { generateCourseContent } = require("../ai.service");

const courseWorker = new Worker(
  "course-generation",
  async (job) => {
    const { courseId, rawText, language, difficulty } = job.data;

    try {
      console.log(`🚀 AI is designing course: ${courseId}`);
      const aiData = await generateCourseContent(rawText, language, difficulty);
      console.log(`📦 AI Response:`, JSON.stringify(aiData, null, 2)); 

      // 💾 ATOMIC TRANSACTION: Saves all modules and lessons
      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < aiData.modules.length; i++) {
          const mod = aiData.modules[i];
          await tx.module.create({
            data: {
              title: mod.title,
              order: i + 1,
              courseId: courseId,
              lessons: {
                create: mod.lessons.map((lesson, idx) => ({
                  title: lesson.title,
                  content: lesson.content,
                  order: idx + 1,
                })),
              },
            },
          });
        }

        await tx.course.update({
        where: { id: courseId },
        data: { status: "PUBLISHED" },
      });
    }, {
      timeout: 30000,  
    });


      console.log(`✅ SUCCESS! Course ${courseId} is now LIVE in Postgres.`);
    } catch (error) {
      console.error(`❌ Worker Failed:`, error.message);
      await prisma.course.update({
        where: { id: courseId },
        data: { status: "FAILED" },
      });
      throw error; // BullMQ will retry based on your 'backoff' settings
    }
  },
  { connection: redisConnection },
);
