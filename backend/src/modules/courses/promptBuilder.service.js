const logger = require("../../config/logger");

/**
 * PromptBuilder — Dynamic AI prompt generation for mixed content.
 *
 * Now produces prompts that ask the AI for:
 * - theory (educational text)
 * - codeExample (optional code snippet)
 * - youtubeSuggestion (search keyword for video, NEVER a URL)
 * - quiz (MCQ / TRUE_FALSE)
 */

// ─── Difficulty Profiles ────────────────────────────────────────────────────────
const DIFFICULTY_PROFILES = {
  BEGINNER: {
    moduleCount: 3,
    lessonsPerModule: 2,
    contentWordTarget: 150,
    quizQuestionsPerLesson: 3,
    quizTypes: ["MCQ"],
    includeCodeExamples: false,
    codeGuidance: "",
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
    includeCodeExamples: true,
    codeGuidance:
      "Include short, practical code snippets (10-20 lines) that demonstrate key concepts. Use clear variable names and inline comments.",
    contentTone:
      "Assume basic knowledge. Focus on practical application and real-world patterns. Explain trade-offs.",
    tokenBudget: 3500,
  },
  ADVANCED: {
    moduleCount: 5,
    lessonsPerModule: 4,
    contentWordTarget: 500,
    quizQuestionsPerLesson: 5,
    quizTypes: ["MCQ", "TRUE_FALSE"],
    includeCodeExamples: true,
    codeGuidance:
      "Include complete, production-quality code examples (20-40 lines) with error handling, edge cases, and performance notes. Show anti-patterns alongside correct implementations.",
    contentTone:
      "Assume strong foundational knowledge. Cover advanced theory, edge cases, and architectural trade-offs. Include performance considerations and best practices.",
    tokenBudget: 5000,
  },
};

const getProfile = (difficulty) => {
  return DIFFICULTY_PROFILES[difficulty] || DIFFICULTY_PROFILES.BEGINNER;
};

const getTokenBudget = (difficulty) => {
  return getProfile(difficulty).tokenBudget;
};

/**
 * Build a dynamic system prompt for mixed content course generation.
 */
const buildCoursePrompt = ({ topic, difficulty, language, rawText }) => {
  const profile = getProfile(difficulty);

  // Build quiz instructions
  const quizTypeInstructions = profile.quizTypes.includes("TRUE_FALSE")
    ? `Each quiz should contain a mix of MCQ and TRUE_FALSE questions.
    - MCQ: "type": "MCQ", "options": exactly 4 choices, "answer": must match one option.
    - TRUE_FALSE: "type": "TRUE_FALSE", "options": ["True", "False"], "answer": "True" or "False".`
    : `All questions must be MCQ type.
    - "type": "MCQ", "options": exactly 4 choices, "answer": must match one option.`;

  // Build code example instruction
  const codeSection = profile.includeCodeExamples
    ? `\nCODE EXAMPLES:
${profile.codeGuidance}
- Place code in the "codeExample" field as a plain string (use \\n for newlines).
- If the lesson topic is purely theoretical, set "codeExample" to null.\n`
    : `\n- Set "codeExample" to null for all lessons (BEGINNER level does not require code).\n`;

  const systemPrompt = `You are an expert educational content creator.
Generate a complete course in JSON format based on the topic provided.

COURSE PARAMETERS:
- Difficulty: ${difficulty}
- Language: ${language}
- Modules: exactly ${profile.moduleCount}
- Lessons per module: exactly ${profile.lessonsPerModule}
- Theory per lesson: approximately ${profile.contentWordTarget} words
- Quiz questions per lesson: exactly ${profile.quizQuestionsPerLesson}

CONTENT GUIDELINES:
${profile.contentTone}
${codeSection}
YOUTUBE SUGGESTIONS:
- For each lesson, provide a "youtubeSuggestion" — a short search keyword phrase
  (e.g., "JavaScript closures explained", "Python list comprehension tutorial").
- This MUST be a search query, NOT a URL. We will resolve the URL ourselves.
- If no good video exists for the topic, set to null.

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
          "theory": "Detailed educational text (${profile.contentWordTarget}+ words)...",
          "codeExample": "// code snippet or null",
          "youtubeSuggestion": "search keywords or null",
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
6. Lesson theory must be educational and approximately ${profile.contentWordTarget} words.
7. All content must be in ${language}.
8. "youtubeSuggestion" must be a search keyword, NEVER a full URL.
9. "codeExample" must be a code string or null — no markdown fences.`;

  logger.debug(
    {
      difficulty,
      moduleCount: profile.moduleCount,
      lessonsPerModule: profile.lessonsPerModule,
      quizQuestions: profile.quizQuestionsPerLesson,
      includeCode: profile.includeCodeExamples,
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
