const request = require("supertest");
const app = require("../src/app");
const { getAuthenticatedUser } = require("./helpers/auth.helper");

describe("Course API", () => {
  let accessToken;

  beforeAll(async () => {
    const auth = await getAuthenticatedUser({
      email: `course-test-${Date.now()}@example.com`,
    });
    accessToken = auth.accessToken;
  });

  // ─── Create Course ──────────────────────────────────────────
  describe("POST /api/v1/courses", () => {
    it("should enqueue a course for generation", async () => {
      const res = await request(app)
        .post("/api/v1/courses")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Test Course",
          description: "A test course",
          difficulty: "BEGINNER",
          language: "ENGLISH",
          rawText: "Learn about testing in software engineering",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("courseId");
      expect(res.body.data.status).toBe("GENERATING");
    });

    it("should reject empty body", async () => {
      const res = await request(app)
        .post("/api/v1/courses")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should reject without auth", async () => {
      const res = await request(app).post("/api/v1/courses").send({
        title: "No Auth Course",
        rawText: "Test",
      });

      expect(res.status).toBe(401);
    });
  });

  // ─── PDF Upload ─────────────────────────────────────────────
  describe("POST /api/v1/courses/from-pdf", () => {
    it("should reject without file", async () => {
      const res = await request(app)
        .post("/api/v1/courses/from-pdf")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("NO_FILE");
    });

    it("should reject non-PDF file", async () => {
      const res = await request(app)
        .post("/api/v1/courses/from-pdf")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("pdf", Buffer.from("not a pdf"), {
          filename: "test.txt",
          contentType: "text/plain",
        });

      expect(res.status).toBe(400);
    });
  });

  // ─── List Courses ───────────────────────────────────────────
  describe("GET /api/v1/courses", () => {
    it("should return courses list (public)", async () => {
      const res = await request(app).get("/api/v1/courses");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("courses");
      expect(Array.isArray(res.body.data.courses)).toBe(true);
    });
  });
});
