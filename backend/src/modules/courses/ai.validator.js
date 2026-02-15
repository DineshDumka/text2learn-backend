const { z } = require("zod");

/**
 * Zod schemas for validating AI responses before DB insertion.
 * If Gemini returns malformed data, we fail fast with a clear error
 * instead of letting Prisma throw cryptic constraint errors.
 */

// A single MCQ question
const mcqQuestionSchema = z.object({
  type: z.literal("MCQ").optional().default("MCQ"),
  text: z.string().min(1, "Question text is required"),
  options: z
    .array(z.string().min(1))
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options"),
  answer: z.string().min(1, "Answer is required"),
});

// A single TRUE_FALSE question
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

// A question can be either MCQ or TRUE_FALSE
const questionSchema = z.union([trueFalseQuestionSchema, mcqQuestionSchema]);

// Quiz with type and questions
const quizSchema = z.object({
  type: z
    .enum(["MCQ", "TRUE_FALSE"])
    .optional()
    .default("MCQ"),
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

  // Cross-check: each MCQ answer must be in its options
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
