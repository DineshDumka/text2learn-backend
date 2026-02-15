const { buildCoursePrompt, getTokenBudget, getProfile } = require("../src/modules/courses/promptBuilder.service");

describe("PromptBuilder", () => {
  // ─── Difficulty profiles ────────────────────────────────────
  it("should return correct BEGINNER profile", () => {
    const profile = getProfile("BEGINNER");
    expect(profile.moduleCount).toBe(3);
    expect(profile.lessonsPerModule).toBe(2);
    expect(profile.includeCodeExamples).toBe(false);
    expect(profile.tokenBudget).toBe(2000);
  });

  it("should return correct ADVANCED profile", () => {
    const profile = getProfile("ADVANCED");
    expect(profile.moduleCount).toBe(5);
    expect(profile.lessonsPerModule).toBe(4);
    expect(profile.includeCodeExamples).toBe(true);
    expect(profile.tokenBudget).toBe(5000);
  });

  it("should fallback to BEGINNER for unknown difficulty", () => {
    const profile = getProfile("EXPERT");
    expect(profile.moduleCount).toBe(3);
  });

  // ─── Token budget ──────────────────────────────────────────
  it("should return correct token budget", () => {
    expect(getTokenBudget("BEGINNER")).toBe(2000);
    expect(getTokenBudget("INTERMEDIATE")).toBe(3500);
    expect(getTokenBudget("ADVANCED")).toBe(5000);
  });

  // ─── Prompt content ────────────────────────────────────────
  it("should include mixed content fields in prompt", () => {
    const { systemPrompt } = buildCoursePrompt({
      topic: "JavaScript",
      difficulty: "INTERMEDIATE",
      language: "ENGLISH",
    });

    expect(systemPrompt).toContain("theory");
    expect(systemPrompt).toContain("codeExample");
    expect(systemPrompt).toContain("youtubeSuggestion");
    expect(systemPrompt).toContain("NEVER a full URL");
  });

  it("should disable code examples for BEGINNER", () => {
    const { systemPrompt } = buildCoursePrompt({
      topic: "Python",
      difficulty: "BEGINNER",
      language: "ENGLISH",
    });

    expect(systemPrompt).toContain("null for all lessons");
  });

  it("should include rawText when provided", () => {
    const { systemPrompt } = buildCoursePrompt({
      topic: "Testing",
      difficulty: "BEGINNER",
      language: "ENGLISH",
      rawText: "My custom notes about testing frameworks",
    });

    expect(systemPrompt).toContain("My custom notes about testing frameworks");
  });
});
