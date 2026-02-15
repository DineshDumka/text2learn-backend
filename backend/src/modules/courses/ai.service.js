const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../../config/logger");
const {
  validateCourseResponse,
  validateTranslationResponse,
} = require("./ai.validator");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

const generateCourseContent = async (prompt, language, difficulty) => {
  const systemPrompt = `
Generate a complete course in JSON format. 
Return ONLY valid JSON, no markdown, no explanation.

REQUIRED STRUCTURE:
{
  "title": "Course Title",
  "modules": [
    {
      "title": "Module Title",
      "lessons": [
        {
          "title": "Lesson Title",
          "content": "Detailed educational text...",
          "quiz": {
            "questions": [
              {
                "text": "Multiple choice question text?",
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

IMPORTANT:
- Every lesson MUST have a "quiz" object with exactly 3 questions.
- Each question must have "text", "options" (array of 4), and "answer" (must match one of the options).
- Generate at least 3 modules with 3 lessons each.
`;

  try {
    const result = await model.generateContent(
      `${systemPrompt}\n\nTopic: ${prompt}`,
    );
    const text = result.response.text();

    // Safety check: if AI wraps JSON in backticks, remove them
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    // Schema validation before returning
    const validated = validateCourseResponse(parsed);
    logger.info(
      { moduleCount: validated.modules.length },
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
