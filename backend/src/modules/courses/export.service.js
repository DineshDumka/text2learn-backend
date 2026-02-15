const PDFDocument = require("pdfkit");
const prisma = require("../../config/prisma");
const AppError = require("../../utils/AppError");

/**
 * Fetch the complete course tree for export (modules → lessons → contents → quizzes).
 * Enforces ownership.
 */
const fetchCourseTree = async (courseId, userId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              contents: true,
              quizzes: {
                include: { questions: true },
              },
            },
          },
        },
      },
    },
  });

  if (!course) throw AppError.notFound("Course not found");
  if (course.creatorId !== userId) {
    throw AppError.forbidden("You do not own this course");
  }
  if (course.status !== "PUBLISHED") {
    throw AppError.badRequest(
      "Only published courses can be exported",
      "COURSE_NOT_PUBLISHED",
    );
  }

  return course;
};

/**
 * Convert a course tree into clean Markdown.
 */
const buildMarkdown = (course) => {
  const lines = [];

  lines.push(`# ${course.title}`);
  if (course.description) lines.push(`\n> ${course.description}`);
  lines.push(
    `\n**Difficulty:** ${course.difficulty} | **Language:** ${course.language}`,
  );
  lines.push(`\n---\n`);

  for (const mod of course.modules) {
    lines.push(`## Module ${mod.order}: ${mod.title}\n`);

    for (const lesson of mod.lessons) {
      lines.push(`### Lesson ${lesson.order}: ${getTitle(lesson)}\n`);

      // Theory
      const content = getContent(lesson);
      if (content) {
        lines.push(`#### Theory\n`);
        lines.push(content);
        lines.push("");
      }

      // Code Example
      const code = getCodeExample(lesson);
      if (code) {
        lines.push(`#### Code Example\n`);
        lines.push("```");
        lines.push(code);
        lines.push("```\n");
      }

      // YouTube
      if (lesson.youtubeUrl) {
        const url = lesson.youtubeUrl.startsWith("search:")
          ? `https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.youtubeUrl.replace("search:", ""))}`
          : lesson.youtubeUrl;
        lines.push(`#### Video\n`);
        lines.push(`[Watch on YouTube](${url})\n`);
      }

      // Quiz
      const quiz = lesson.quizzes?.[0];
      if (quiz && quiz.questions.length > 0) {
        lines.push(`#### Quiz\n`);
        for (let i = 0; i < quiz.questions.length; i++) {
          const q = quiz.questions[i];
          const opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
          lines.push(
            `${i + 1}. **${q.text}**`,
          );
          opts.forEach((opt, j) => {
            const letter = String.fromCharCode(65 + j);
            const marker = opt === q.answer ? "✅" : "  ";
            lines.push(`   ${marker} ${letter}) ${opt}`);
          });
          lines.push("");
        }
      }

      lines.push("---\n");
    }
  }

  return lines.join("\n");
};

/**
 * Build a PDF document from a course tree.
 * Returns a PDFDocument stream (caller pipes it to response).
 */
const buildPdf = (course) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  // Title
  doc.fontSize(24).font("Helvetica-Bold").text(course.title, { align: "center" });
  doc.moveDown(0.5);
  if (course.description) {
    doc.fontSize(11).font("Helvetica-Oblique").text(course.description, { align: "center" });
    doc.moveDown(0.3);
  }
  doc.fontSize(10).font("Helvetica").text(
    `Difficulty: ${course.difficulty} | Language: ${course.language}`,
    { align: "center" },
  );
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  for (const mod of course.modules) {
    doc.fontSize(18).font("Helvetica-Bold").text(`Module ${mod.order}: ${mod.title}`);
    doc.moveDown(0.5);

    for (const lesson of mod.lessons) {
      doc.fontSize(14).font("Helvetica-Bold").text(`Lesson ${lesson.order}: ${getTitle(lesson)}`);
      doc.moveDown(0.3);

      // Theory
      const content = getContent(lesson);
      if (content) {
        doc.fontSize(10).font("Helvetica").text(content, { lineGap: 2 });
        doc.moveDown(0.5);
      }

      // Code
      const code = getCodeExample(lesson);
      if (code) {
        doc.fontSize(9).font("Courier").text(code, {
          lineGap: 1,
        });
        doc.moveDown(0.5);
      }

      // YouTube
      if (lesson.youtubeUrl) {
        const url = lesson.youtubeUrl.startsWith("search:")
          ? `https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.youtubeUrl.replace("search:", ""))}`
          : lesson.youtubeUrl;
        doc.fontSize(10).font("Helvetica")
          .fillColor("blue")
          .text(`Video: ${url}`, { link: url, underline: true });
        doc.fillColor("black");
        doc.moveDown(0.3);
      }

      // Quiz
      const quiz = lesson.quizzes?.[0];
      if (quiz && quiz.questions.length > 0) {
        doc.fontSize(11).font("Helvetica-Bold").text("Quiz");
        doc.moveDown(0.2);
        for (let i = 0; i < quiz.questions.length; i++) {
          const q = quiz.questions[i];
          const opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
          doc.fontSize(10).font("Helvetica-Bold").text(`${i + 1}. ${q.text}`);
          opts.forEach((opt, j) => {
            const letter = String.fromCharCode(65 + j);
            const marker = opt === q.answer ? "✅" : "  ";
            doc.fontSize(9).font("Helvetica").text(`  ${marker} ${letter}) ${opt}`);
          });
          doc.moveDown(0.2);
        }
      }

      doc.moveDown(0.5);
    }

    // Module separator
    if (doc.y < 700) {
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);
    } else {
      doc.addPage();
    }
  }

  doc.end();
  return doc;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTitle(lesson) {
  return lesson.contents?.[0]?.title || "Untitled";
}

function getContent(lesson) {
  return lesson.contents?.[0]?.content || null;
}

function getCodeExample(lesson) {
  return lesson.contents?.[0]?.codeExample || null;
}

module.exports = { fetchCourseTree, buildMarkdown, buildPdf };
