const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default;
const redisClient = require("../config/redis");

// 1. Global API Limiter (Protection from DDoS/Bots)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// 2. Strict AI Generation Limiter
// Even if they have quota, they can't spam the "Create" button.
const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 courses per hour
  message: {
    status: "fail",
    message: "AI limit reached. Try again in an hour.",
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

module.exports = { globalLimiter, aiGenerationLimiter };
