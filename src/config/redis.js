const Redis = require("ioredis");

// Connect to the Redis instance running in Docker
const redisConnection = new Redis({
  host: "127.0.0.1", // localhost
  port: 6379,
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () =>
  console.log("✅ Successfully connected to Redis (Docker)"),
);
redisConnection.on("error", (err) =>
  console.error("❌ Redis Connection Error:", err),
);

module.exports = redisConnection;
