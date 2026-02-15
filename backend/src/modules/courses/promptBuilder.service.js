const logger = require("../../config/logger");

/**
 * PromptBuilder — Pure function service for dynamic AI prompt generation.
 *
 * WHY a lookup table instead of a single generic prompt?
 * - Explicit: Each difficulty level has exact expectations (module count, depth, etc.)
 * - Testable: We can unit-test that BEGINNER always produces a prompt asking for 3 modules
 * - Predictable: AI gets concrete numbers, not vague instructions like "make it harder"
 * - Budget-aware: Token budget is tied to difficulty, so quota reservation is accurate
 */

// ─── Difficulty Profiles ────────────────────────────────────────────────────────
const DIFFICULTY_PROFILES = {
  BEGINNER: {
    moduleCount: 3,
    lessonsPerModule: 2,
    contentWordTarget: 150,
    quizQuestionsPerLesson: 3,
    quizTypes: ["MCQ"],
    contentTone:
      "Use simple language. Avoid jargon. Explain concepts as if teaching a complete beginner. Use analogies and real-world examples.",
    tokenBudget: 2000,
  },
  INTERMEDIATE: {
    moduleCount: 4,
    lessonsPerModule: 3,
    contentWordTarget: 300,
    quizQuestionsPerLesson: 4,
    quizTypes: ["MCQ", "TRUE_FALSE"],
    contentTone:
      "Assume basic knowledge. Focus on practical application and real-world patterns. Include code examples where relevant. Explain trade-offs.",
    tokenBudget: 3500,
  },
  ADVANCED: {
    moduleCount: 5,
    lessonsPerModule: 4,
    contentWordTarget: 500,
    quizQuestionsPerLesson: 5,
    quizTypes: ["MCQ", "TRUE_FALSE"],
    contentTone:
      "Assume strong foundational knowledge. Cover advanced theory, edge cases, and architectural trade-offs. Include performance considerations and best practices.",
    tokenBudget: 5000,
  },
};

/**
 * Get the difficulty profile for a given level.
 * Falls back to BEGINNER for unknown values.
 */
const getProfile = (difficulty) => {
  return DIFFICULTY_PROFILES[difficulty] || DIFFICULTY_PROFILES.BEGINNER;
};

/**
 * Returns the token budget for a difficulty level.
 * Used by courses.service.js for quota reservation and by the worker for reconciliation.
 */
const getTokenBudget = (difficulty) => {
  return getProfile(difficulty).tokenBudget;
};

/**
 * Build a dynamic system prompt for course generation.
 *
 * @param {Object} params
 * @param {string} params.topic - User's topic or raw text
 * @param {string} params.difficulty - BEGINNER | INTERMEDIATE | ADVANCED
 * @param {string} params.language - ENGLISH | HINDI | HINGLISH | SPANISH
 * @param {string} [params.rawText] - Optional raw text/notes from user
 * @returns {{ systemPrompt: string, profile: Object }}
 */
const buildCoursePrompt = ({ topic, difficulty, language, rawText }) => {
  const profile = getProfile(difficulty);

  // Build quiz type instructions
  const quizTypeInstructions = profile.quizTypes.includes("TRUE_FALSE")
    ? `Each quiz should contain a mix of MCQ and TRUE_FALSE questions.
    - MCQ questions: "type": "MCQ", "options" must have exactly 4 choices, "answer" must match one option.
    - TRUE_FALSE questions: "type": "TRUE_FALSE", "options" must be ["True", "False"], "answer" must be "True" or "False".`
    : `All questions must be MCQ type.
    - "type": "MCQ", "options" must have exactly 4 choices, "answer" must match one option.`;

  const systemPrompt = `You are an expert educational content creator.
Generate a complete course in JSON format based on the topic provided.

COURSE PARAMETERS:
- Difficulty: ${difficulty}
- Language: ${language}
- Modules: exactly ${profile.moduleCount}
- Lessons per module: exactly ${profile.lessonsPerModule}
- Content per lesson: approximately ${profile.contentWordTarget} words
- Quiz questions per lesson: exactly ${profile.quizQuestionsPerLesson}

CONTENT GUIDELINES:
${profile.contentTone}

${rawText ? `USER NOTES (incorporate these into the course content):\n${rawText}\n` : ""}
REQUIRED JSON STRUCTURE:
{
  "title": "Course Title",
  "modules": [
    {
      "title": "Module Title",
      "lessons": [
        {
          "title": "Lesson Title",
          "content": "Detailed educational text (${profile.contentWordTarget}+ words)...",
          "quiz": {
            "type": "MCQ",
            "questions": [
              {
                "type": "MCQ",
                "text": "Question text?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": "Option B"
              }
            ]
          }
        }
      ]
    }
  ]
}

QUIZ RULES:
${quizTypeInstructions}

STRICT RULES:
1. Return ONLY valid JSON. No markdown, no explanation, no wrapping.
2. Generate exactly ${profile.moduleCount} modules.
3. Each module must have exactly ${profile.lessonsPerModule} lessons.
4. Each lesson must have exactly ${profile.quizQuestionsPerLesson} quiz questions.
5. Every quiz "answer" must exactly match one of its "options".
6. Lesson content must be educational and approximately ${profile.contentWordTarget} words.
7. All content must be in ${language}.`;

  logger.debug(
    {
      difficulty,
      moduleCount: profile.moduleCount,
      lessonsPerModule: profile.lessonsPerModule,
      quizQuestions: profile.quizQuestionsPerLesson,
      tokenBudget: profile.tokenBudget,
    },
    "Prompt built for course generation",
  );

  return { systemPrompt, profile };
};

module.exports = {
  buildCoursePrompt,
  getTokenBudget,
  getProfile,
  DIFFICULTY_PROFILES,
};
