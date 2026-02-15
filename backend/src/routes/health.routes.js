const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const redis = require("../config/redis");
const ApiResponse = require("../utils/ApiResponse");

router.get("/health", async (req, res) => {
  const status = {
    uptime: process.uptime(),
    timestamp: new Date(),
    services: {
      database: "unknown",
      redis: "unknown",
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    status.services.database = "up";
  } catch (err) {
    status.services.database = "down";
  }

  try {
    const redisPing = await redis.ping();
    status.services.redis = redisPing === "PONG" ? "up" : "down";
  } catch (err) {
    status.services.redis = "down";
  }

  const isHealthy =
    status.services.database === "up" && status.services.redis === "up";

  res
    .status(isHealthy ? 200 : 503)
    .json(ApiResponse.success(status, isHealthy ? "Healthy" : "Unhealthy"));
});

router.get("/metrics", async (req, res) => {
  // Simple metrics - can be expanded for Prometheus later
  const metrics = {
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    activeConnections: "TODO - via server.getConnections()", 
  };
  
  res.status(200).json(ApiResponse.success(metrics));
});

module.exports = router;
