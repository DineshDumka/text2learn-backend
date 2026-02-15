const { z } = require("zod");

/**
 * Zod schemas for validating AI responses before DB insertion.
 *
 * Phase 3: Updated lesson schema to support mixed content:
 *   - theory (required) — replaces old "content" field
 *   - codeExample (optional) — code snippet
 *   - youtubeSuggestion (optional) — search keyword, NOT a URL
 */

// ─── Quiz Schemas ─────────────────────────────────────────────────────────────

const mcqQuestionSchema = z.object({
  type: z.literal("MCQ").optional().default("MCQ"),
  text: z.string().min(1, "Question text is required"),
  options: z
    .array(z.string().min(1))
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options"),
  answer: z.string().min(1, "Answer is required"),
});

const trueFalseQuestionSchema = z.object({
  type: z.literal("TRUE_FALSE"),
  text: z.string().min(1, "Question text is required"),
  options: z
    .array(z.string())
    .length(2, "TRUE_FALSE must have exactly 2 options"),
  answer: z.enum(["True", "False"], {
    errorMap: () => ({ message: 'Answer must be "True" or "False"' }),
  }),
});

const questionSchema = z.union([trueFalseQuestionSchema, mcqQuestionSchema]);

const quizSchema = z.object({
  type: z.enum(["MCQ", "TRUE_FALSE"]).optional().default("MCQ"),
  questions: z
    .array(questionSchema)
    .min(1, "Quiz must have at least 1 question"),
});

// ─── Lesson Schema (Mixed Content) ───────────────────────────────────────────

const lessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required"),

  // Accept both "theory" and "content" for backward compatibility
  // AI should return "theory", but older prompts may use "content"
  theory: z.string().min(10, "Lesson theory is too short").optional(),
  content: z.string().min(10, "Lesson content is too short").optional(),

  // NEW: optional code example (string or null)
  codeExample: z.string().nullable().optional(),

  // NEW: YouTube search keyword (NOT a URL)
  youtubeSuggestion: z.string().nullable().optional(),

  quiz: quizSchema,
}).refine(
  (data) => data.theory || data.content,
  { message: "Lesson must have either 'theory' or 'content' field", path: ["theory"] },
);

// ─── Module + Course Schemas ─────────────────────────────────────────────────

const moduleSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  lessons: z.array(lessonSchema).min(1, "Module must have at least 1 lesson"),
});

const courseResponseSchema = z.object({
  title: z.string().min(1, "Course title is required"),
  modules: z
    .array(moduleSchema)
    .min(1, "Course must have at least 1 module"),
});

// ─── Translation Schema ──────────────────────────────────────────────────────

const translationResponseSchema = z.object({
  title: z.string().min(1, "Translated title is required"),
  content: z.string().min(1, "Translated content is required"),
});

// ─── Validators ──────────────────────────────────────────────────────────────

const validateCourseResponse = (data) => {
  const result = courseResponseSchema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`AI_RESPONSE_INVALID: ${details}`);
  }

  // Cross-check: each answer must be in its options
  for (const mod of result.data.modules) {
    for (const lesson of mod.lessons) {
      for (const q of lesson.quiz.questions) {
        if (!q.options.includes(q.answer)) {
          throw new Error(
            `AI_RESPONSE_INVALID: Answer "${q.answer}" not found in options for question "${q.text}"`,
          );
        }
      }
    }
  }

  // Normalize: if AI used "content" instead of "theory", rename it
  for (const mod of result.data.modules) {
    for (const lesson of mod.lessons) {
      if (!lesson.theory && lesson.content) {
        lesson.theory = lesson.content;
        delete lesson.content;
      }
    }
  }

  return result.data;
};

const validateTranslationResponse = (data) => {
  const result = translationResponseSchema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`AI_RESPONSE_INVALID: ${details}`);
  }
  return result.data;
};

module.exports = {
  validateCourseResponse,
  validateTranslationResponse,
};
