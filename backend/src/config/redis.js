const Redis = require("ioredis");
const logger = require("./logger");

// Connect to the Redis instance running in Docker
const redisConnection = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () =>
  logger.info("Successfully connected to Redis"),
);
redisConnection.on("error", (err) =>
  logger.error({ err }, "Redis Connection Error"),
);

module.exports = redisConnection;
