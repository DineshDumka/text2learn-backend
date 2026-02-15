const request = require("supertest");
const app = require("../src/app");

describe("Auth API", () => {
  const testUser = {
    name: "Auth Test User",
    email: `auth-test-${Date.now()}@example.com`,
    password: "SecurePass123!",
  };

  let accessToken;

  // ─── Register ────────────────────────────────────────────────
  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data).toHaveProperty("user");
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it("should reject duplicate email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing fields", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "no-pass@test.com" });

      expect(res.status).toBe(400);
    });
  });

  // ─── Login ───────────────────────────────────────────────────
  describe("POST /api/v1/auth/login", () => {
    it("should login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("accessToken");
      accessToken = res.body.data.accessToken;
    });

    it("should reject wrong password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: testUser.email, password: "WrongPassword" });

      expect(res.status).toBe(401);
    });

    it("should reject non-existent email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "ghost@nowhere.com", password: "test" });

      expect(res.status).toBe(401);
    });
  });

  // ─── Me ──────────────────────────────────────────────────────
  describe("GET /api/v1/auth/me", () => {
    it("should return current user with valid token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it("should reject without token", async () => {
      const res = await request(app).get("/api/v1/auth/me");

      expect(res.status).toBe(401);
    });
  });

  // ─── Refresh ─────────────────────────────────────────────────
  describe("POST /api/v1/auth/refresh", () => {
    it("should reject without refresh cookie", async () => {
      const res = await request(app).post("/api/v1/auth/refresh");

      expect(res.status).toBe(401);
    });
  });
});
