const logger = require("./config/logger");
const prisma = require("./config/prisma");
const redis = require("./config/redis");

logger.info("Starting worker process...");

// Import all workers to start processing jobs
require("./modules/courses/jobs/course.worker");
require("./modules/courses/jobs/translation.worker");

// Handle graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down worker process...");
  try {
    await prisma.$disconnect();
    await redis.quit();
    logger.info("Worker connections closed");
    process.exit(0);
  } catch (err) {
    logger.error({ error: err.message }, "Error during worker shutdown");
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
