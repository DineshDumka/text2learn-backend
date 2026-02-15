/**
 * Jest global setup — runs before each test file.
 * Mocks external dependencies to prevent real API/Redis calls.
 */

// Mock Redis connection (prevents real Redis connection)
jest.mock("../src/config/redis", () => ({
  host: "localhost",
  port: 6379,
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
}));
