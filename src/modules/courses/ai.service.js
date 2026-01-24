const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the AI with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generateCourseContent = async (prompt, language, difficulty) => {
  const systemPrompt = `
    You are an expert curriculum designer. Generate a structured course based on: "${prompt}"
    
    STRICT RULES:
    1. Language: ${language}
    2. Difficulty: ${difficulty}
    3. You MUST return ONLY a valid JSON object. No markdown code blocks (no \`\`\`json).
    4. Follow this JSON structure exactly:
       {
         "title": "Course Title",
         "description": "Brief overview",
         "modules": [
           {
             "title": "Module Title",
             "lessons": [
               { "title": "Lesson Title", "content": "Comprehensive educational content in Markdown" }
             ]
           }
         ]
       }
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text();

    // Clean potential markdown formatting
    text = text.replace(/```json|```/g, "").trim();

    return JSON.parse(text); // Convert string to JS Object
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate content from AI");
  }
};

module.exports = { generateCourseContent };
