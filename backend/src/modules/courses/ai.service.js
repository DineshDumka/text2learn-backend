const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../../config/logger");
const {
  validateCourseResponse,
  validateTranslationResponse,
} = require("./ai.validator");
const { buildCoursePrompt } = require("./promptBuilder.service");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

/**
 * Generate a full course using AI with difficulty-aware prompting.
 *
 * @param {string} topic - User's topic text
 * @param {string} language - Target language (ENGLISH, HINDI, etc.)
 * @param {string} difficulty - BEGINNER | INTERMEDIATE | ADVANCED
 * @param {string} [rawText] - Optional raw notes from user
 * @returns {Object} Validated course data
 */
const generateCourseContent = async (topic, language, difficulty, rawText) => {
  // 1. Build a difficulty-aware prompt via PromptBuilder
  const { systemPrompt, profile } = buildCoursePrompt({
    topic,
    difficulty,
    language,
    rawText,
  });

  try {
    logger.info(
      {
        difficulty,
        expectedModules: profile.moduleCount,
        expectedLessons: profile.lessonsPerModule,
        tokenBudget: profile.tokenBudget,
      },
      "Calling AI with dynamic prompt",
    );

    // 2. Call Gemini
    const result = await model.generateContent(
      `${systemPrompt}\n\nTopic: ${topic}`,
    );
    const text = result.response.text();

    // 3. Clean + parse JSON
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    // 4. Schema validation (Zod) before returning
    const validated = validateCourseResponse(parsed);

    logger.info(
      {
        moduleCount: validated.modules.length,
        totalLessons: validated.modules.reduce(
          (sum, m) => sum + m.lessons.length,
          0,
        ),
      },
      "AI course response validated successfully",
    );

    return validated;
  } catch (error) {
    if (error.message.includes("429")) {
      logger.error("QUOTA EXCEEDED: Please wait 60 seconds.");
    } else if (error.message.startsWith("AI_RESPONSE_INVALID")) {
      logger.error({ error: error.message }, "AI returned invalid structure");
    }
    throw error;
  }
};

/**
 * Translates lesson content while preserving context and tone.
 */
const translateLesson = async (title, content, targetLang) => {
  const prompt = `
    You are a professional translator and educator.
    Translate the following lesson from ENGLISH to ${targetLang}.
    
    ORIGINAL TITLE: ${title}
    ORIGINAL CONTENT: ${content}
    
    STRICT RULES:
    1. Return ONLY a valid JSON object.
    2. Maintain the same educational level.
    3. If target is HINGLISH, use a mix of Hindi and English as spoken by Indian tech mentors.
    
    JSON FORMAT:
    {
      "title": "Translated Title",
      "content": "Translated Content"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(text);

    // Schema validation before returning
    const validated = validateTranslationResponse(parsed);
    logger.info({ targetLang }, "AI translation response validated successfully");

    return validated;
  } catch (error) {
    logger.error({ error: error.message, targetLang }, "Translation AI Error");
    throw error;
  }
};

module.exports = { generateCourseContent, translateLesson };
