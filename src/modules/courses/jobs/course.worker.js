const { Worker } = require("bullmq");
const redisConnection = require("../../../config/redis");
const { generateCourseContent } = require("../ai.service");

const courseWorker = new Worker(
  "course-generation",
  async (job) => {
    const { courseId, rawText, language, difficulty } = job.data;

    console.log(`🚀 Starting real AI generation for: ${courseId}`);

    // 1. CALL THE AI
    const aiContent = await generateCourseContent(
      rawText,
      language,
      difficulty,
    );

    // 2. LOG THE RESULT (Check your terminal!)
    console.log("✨ AI Response Received:", JSON.stringify(aiContent, null, 2));

    // NEXT STEP: We will save 'aiContent' to the database here.
  },
  { connection: redisConnection },
);
