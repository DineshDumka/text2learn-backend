/**
 * Jest global setup — runs before each test file.
 * Mocks external dependencies to prevent real API/Redis calls.
 */

// Mock Redis connection (prevents real Redis connection)
jest.mock("../src/config/redis", () => ({
  host: "localhost",
  port: 6379,
  call: jest.fn().mockResolvedValue("OK"),
  ping: jest.fn().mockResolvedValue("PONG"),
  on: jest.fn(),
  quit: jest.fn().mockResolvedValue("OK"),
}));

// Mock BullMQ Queue (prevents real queue creation)
jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
  })),
  Worker: jest.fn().mockImplementation(() => ({})),
}));

// Suppress Pino output during tests
jest.mock("../src/config/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
  levels: {
    values: { fatal: 60, error: 50, warn: 40, info: 30, debug: 20, trace: 10 },
    labels: { 60: "fatal", 50: "error", 40: "warn", 30: "info", 20: "debug", 10: "trace" },
  },
  level: "info",
}));

// Mock pino-http to prevent logger initialization issues in tests
jest.mock("pino-http", () => {
  return jest.fn(() => (req, res, next) => {
    req.id = "test-request-id";
    req.log = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    next();
  });
});
