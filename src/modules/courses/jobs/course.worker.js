const { Worker } = require("bullmq");
const redisConnection = require("../../../config/redis");
const prisma = require("../../../config/prisma");
const { generateCourseContent } = require("../ai.service");

const courseWorker = new Worker(
  "course-generation",
  async (job) => {
    const { courseId, rawText, language, difficulty } = job.data;

    // IDEMPOTENCY CHECK - Skip if already processed
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { modules: true } } },
    });
    if (
      existingCourse?.status === "PUBLISHED" ||
      existingCourse?._count.modules > 0
    ) {
      console.log(`⏩ Skipping job: Course ${courseId} is already generated.`);
      return;
    }

    try {
      console.log(`🚀 AI is designing course: ${courseId}`);
      const aiData = await generateCourseContent(rawText, language, difficulty);
      console.log(`📦 AI Response:`, JSON.stringify(aiData, null, 2));

      // 💾 ATOMIC TRANSACTION: Saves all modules, lessons, and quizzes
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
                  order: idx + 1,
                  // 🎯 NEW: Create localized content instead of raw fields
                  contents: {
                    create: {
                      language: language || "ENGLISH", // Use the language from the job data
                      title: lesson.title,
                      content: lesson.content,
                    },
                  },
                  quizzes: {
                    create: {
                      questions: {
                        create: lesson.quiz.questions.map((q) => ({
                          text: q.text,
                          options: q.options,
                          answer: q.answer,
                        })),
                      },
                    },
                  },
                })),
              },
            },
          });
        }
        // ... update status to PUBLISHED
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
