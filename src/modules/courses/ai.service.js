const { GoogleGenerativeAI } = require("@google/generative-ai");

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
    return JSON.parse(cleanJson);
  } catch (error) {
    if (error.message.includes("429")) {
      console.error("🛑 QUOTA EXCEEDED: Please wait 60 seconds.");
    }
    throw error;
  }
};

module.exports = { generateCourseContent };
