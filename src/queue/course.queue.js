const { Queue } = require("bullmq");
const redisConnection = require("../config/redis"); // This links to Docker Redis

/**
 * This is the 'Producer' side of the system.
 * It creates a named channel 'course-generation' in Redis.
 */
const courseQueue = new Queue("course-generation", {
  connection: redisConnection,
});

module.exports = courseQueue;
