const { z } = require("zod");

/**
 * Zod schemas for validating AI responses before DB insertion.
 * If Gemini returns malformed data, we fail fast with a clear error
 * instead of letting Prisma throw cryptic constraint errors.
 */

// A single quiz question
const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  options: z
    .array(z.string().min(1))
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options"),
  answer: z.string().min(1, "Answer is required"),
});

// Quiz with questions
const quizSchema = z.object({
  questions: z
    .array(questionSchema)
    .min(1, "Quiz must have at least 1 question"),
});

// A single lesson
const lessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required"),
  content: z.string().min(10, "Lesson content is too short"),
  quiz: quizSchema,
});

// A single module
const moduleSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  lessons: z.array(lessonSchema).min(1, "Module must have at least 1 lesson"),
});

// Full course AI response
const courseResponseSchema = z.object({
  title: z.string().min(1, "Course title is required"),
  modules: z
    .array(moduleSchema)
    .min(1, "Course must have at least 1 module"),
});

// Translation response
const translationResponseSchema = z.object({
  title: z.string().min(1, "Translated title is required"),
  content: z.string().min(1, "Translated content is required"),
});

/**
 * Validate and return parsed data, or throw with structured details.
 */
const validateCourseResponse = (data) => {
  const result = courseResponseSchema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`AI_RESPONSE_INVALID: ${details}`);
  }

  // Cross-check: each answer must be in options
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
