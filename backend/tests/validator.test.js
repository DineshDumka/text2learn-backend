const { validateCourseResponse } = require("../src/modules/courses/ai.validator");
const { MOCK_COURSE_RESPONSE } = require("./helpers/mockAi");

describe("AI Validator", () => {
  it("should validate correct course response", () => {
    const result = validateCourseResponse(MOCK_COURSE_RESPONSE);

    expect(result.title).toBe("Introduction to Testing");
    expect(result.modules).toHaveLength(1);
    expect(result.modules[0].lessons).toHaveLength(2);
  });

  it("should normalize content → theory", () => {
    const data = {
      title: "Test",
      modules: [
        {
          title: "M1",
          lessons: [
            {
              title: "L1",
              content: "This is the content field not theory",
              quiz: {
                questions: [
                  {
                    type: "MCQ",
                    text: "Q?",
                    options: ["A", "B", "C", "D"],
                    answer: "B",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = validateCourseResponse(data);
    expect(result.modules[0].lessons[0].theory).toBe(
      "This is the content field not theory",
    );
    expect(result.modules[0].lessons[0].content).toBeUndefined();
  });

  it("should reject missing title", () => {
    expect(() => validateCourseResponse({ modules: [] })).toThrow(
      "AI_RESPONSE_INVALID",
    );
  });

  it("should reject answer not in options", () => {
    const data = {
      title: "Test",
      modules: [
        {
          title: "M",
          lessons: [
            {
              title: "L",
              theory: "Theory text that is long enough",
              quiz: {
                questions: [
                  {
                    type: "MCQ",
                    text: "Q?",
                    options: ["A", "B", "C", "D"],
                    answer: "Z",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    expect(() => validateCourseResponse(data)).toThrow("not found in options");
  });

  it("should accept optional codeExample and youtubeSuggestion", () => {
    const data = {
      title: "Test",
      modules: [
        {
          title: "M1",
          lessons: [
            {
              title: "L1",
              theory: "Some theory content here for testing",
              codeExample: "console.log('hello');",
              youtubeSuggestion: "node.js basics",
              quiz: {
                questions: [
                  {
                    type: "MCQ",
                    text: "Q?",
                    options: ["A", "B", "C", "D"],
                    answer: "A",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = validateCourseResponse(data);
    expect(result.modules[0].lessons[0].codeExample).toBe(
      "console.log('hello');",
    );
    expect(result.modules[0].lessons[0].youtubeSuggestion).toBe(
      "node.js basics",
    );
  });
});
