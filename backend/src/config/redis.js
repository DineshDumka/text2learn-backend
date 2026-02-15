const Redis = require("ioredis");
const logger = require("./logger");

// Parse Redis connection from REDIS_URL or fall back to localhost
const redisUrl = process.env.REDIS_URL;

let redisConfig;
if (redisUrl) {
  // Production: parse URL (e.g., redis://redis:6379)
  const url = new URL(redisUrl);
  redisConfig = {
    host: url.hostname,
    port: parseInt(url.port, 10) || 6379,
    maxRetriesPerRequest: null,
  };
} else {
  // Development: localhost
  redisConfig = {
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
  };
}

const redisConnection = new Redis(redisConfig);

redisConnection.on("connect", () =>
  logger.info("Successfully connected to Redis"),
);
redisConnection.on("error", (err) =>
  logger.error({ err }, "Redis Connection Error"),
);

module.exports = redisConnection;
