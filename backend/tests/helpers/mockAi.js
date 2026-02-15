/**
 * Static mock data returned instead of calling real Gemini AI.
 * Matches the Phase 3 mixed-content schema.
 */
const MOCK_COURSE_RESPONSE = {
  title: "Introduction to Testing",
  modules: [
    {
      title: "Module 1: Basics",
      lessons: [
        {
          title: "Lesson 1: What is Testing?",
          theory:
            "Software testing is the process of verifying that a software application works as expected. It involves executing the program with specific inputs and comparing the output to expected results. Testing helps find bugs early, reduces development costs, and ensures software reliability.",
          codeExample:
            'function add(a, b) {\n  return a + b;\n}\n\n// Test\nconsole.assert(add(2, 3) === 5, "2 + 3 should be 5");',
          youtubeSuggestion: "software testing basics tutorial",
          quiz: {
            type: "MCQ",
            questions: [
              {
                type: "MCQ",
                text: "What is the primary purpose of software testing?",
                options: [
                  "Writing code",
                  "Finding bugs",
                  "Deploying apps",
                  "Designing UI",
                ],
                answer: "Finding bugs",
              },
              {
                type: "MCQ",
                text: "Which is NOT a testing level?",
                options: [
                  "Unit testing",
                  "Integration testing",
                  "Dream testing",
                  "System testing",
                ],
                answer: "Dream testing",
              },
              {
                type: "MCQ",
                text: "When should testing begin?",
                options: [
                  "After deployment",
                  "During development",
                  "Never",
                  "Only on Fridays",
                ],
                answer: "During development",
              },
            ],
          },
        },
        {
          title: "Lesson 2: Unit Tests",
          theory:
            "Unit tests verify individual functions or methods in isolation. They are the fastest type of test and form the base of the testing pyramid. Good unit tests are focused, independent, and deterministic.",
          codeExample: null,
          youtubeSuggestion: null,
          quiz: {
            type: "MCQ",
            questions: [
              {
                type: "MCQ",
                text: "What does a unit test verify?",
                options: [
                  "The whole app",
                  "A single function",
                  "The database",
                  "The network",
                ],
                answer: "A single function",
              },
              {
                type: "MCQ",
                text: "Unit tests should be?",
                options: [
                  "Slow",
                  "Dependent on each other",
                  "Fast and independent",
                  "Optional",
                ],
                answer: "Fast and independent",
              },
              {
                type: "MCQ",
                text: "The testing pyramid base is?",
                options: [
                  "E2E tests",
                  "Unit tests",
                  "Manual tests",
                  "No tests",
                ],
                answer: "Unit tests",
              },
            ],
          },
        },
      ],
    },
  ],
};

module.exports = { MOCK_COURSE_RESPONSE };
