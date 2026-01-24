const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Using gemma-3-27b because your quota shows 30 RPM / 14.4K RPD!
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
      "title": "Module 1 Title",
      "lessons": [
        {
          "title": "Lesson 1 Title",
          "content": "Detailed lesson content explaining the topic..."
        }
      ]
    }
  ]
}

IMPORTANT:
- Every lesson MUST be an object with "title" (string) and "content" (string)
- "content" should be 2-3 paragraphs of educational text
- Generate at least 3 modules with 3 lessons each
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
