const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");

const translationQueue = new Queue("content-translation", {
  connection: redisConnection,
});

module.exports = translationQueue;
