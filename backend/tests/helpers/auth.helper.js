const request = require("supertest");
const app = require("../../src/app");

/**
 * Register a test user and return their tokens + userId.
 */
const createTestUser = async (
  overrides = {},
) => {
  const userData = {
    name: overrides.name || "Test User",
    email: overrides.email || `test-${Date.now()}@example.com`,
    password: overrides.password || "TestPassword123!",
  };

  const res = await request(app).post("/api/v1/auth/register").send(userData);

  if (res.status !== 201) {
    throw new Error(
      `Registration failed: ${res.status} — ${JSON.stringify(res.body)}`,
    );
  }

  return {
    ...res.body.data,
    email: userData.email,
    password: userData.password,
  };
};

/**
 * Login and return access token.
 */
const loginUser = async (email, password) => {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status}`);
  }

  return res.body.data;
};

/**
 * Create test user + login in one step. Returns { accessToken, user }.
 */
const getAuthenticatedUser = async (overrides = {}) => {
  const registered = await createTestUser(overrides);
  const loginData = await loginUser(registered.email, registered.password);
  return {
    accessToken: loginData.accessToken,
    user: loginData.user,
  };
};

module.exports = { createTestUser, loginUser, getAuthenticatedUser };
