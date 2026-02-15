const { buildMarkdown } = require("../src/modules/courses/export.service");

describe("Export Service", () => {
  const mockCourse = {
    title: "Test Course",
    description: "A test course description",
    difficulty: "BEGINNER",
    language: "ENGLISH",
    status: "PUBLISHED",
    creatorId: "user-1",
    modules: [
      {
        order: 1,
        title: "Module One",
        lessons: [
          {
            order: 1,
            youtubeUrl: "https://www.youtube.com/watch?v=abc12345678",
            contents: [
              {
                title: "Lesson One",
                content: "This is the lesson theory content.",
                codeExample: 'console.log("hello");',
              },
            ],
            quizzes: [
              {
                questions: [
                  {
                    text: "What is 2+2?",
                    options: ["3", "4", "5", "6"],
                    answer: "4",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  describe("buildMarkdown", () => {
    it("should include course title as H1", () => {
      const md = buildMarkdown(mockCourse);
      expect(md).toContain("# Test Course");
    });

    it("should include module as H2", () => {
      const md = buildMarkdown(mockCourse);
      expect(md).toContain("## Module 1: Module One");
    });

    it("should include lesson as H3", () => {
      const md = buildMarkdown(mockCourse);
      expect(md).toContain("### Lesson 1: Lesson One");
    });

    it("should include theory section", () => {
      const md = buildMarkdown(mockCourse);
      expect(md).toContain("#### Theory");
      expect(md).toContain("lesson theory content");
    });

    it("should include code example", () => {
      const md = buildMarkdown(mockCourse);
      expect(md).toContain("#### Code Example");
      expect(md).toContain('console.log("hello");');
    });

    it("should include YouTube link", () => {
      const md = buildMarkdown(mockCourse);
      expect(md).toContain("#### Video");
      expect(md).toContain("youtube.com/watch?v=abc12345678");
    });

    it("should include quiz with answer markers", () => {
      const md = buildMarkdown(mockCourse);
      expect(md).toContain("#### Quiz");
      expect(md).toContain("What is 2+2?");
      expect(md).toContain("✅");
    });

    it("should handle search: YouTube URLs", () => {
      const course = {
        ...mockCourse,
        modules: [
          {
            ...mockCourse.modules[0],
            lessons: [
              {
                ...mockCourse.modules[0].lessons[0],
                youtubeUrl: "search:JavaScript basics tutorial",
              },
            ],
          },
        ],
      };
      const md = buildMarkdown(course);
      expect(md).toContain("youtube.com/results?search_query=");
    });
  });
});
