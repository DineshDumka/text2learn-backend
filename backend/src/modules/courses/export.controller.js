const exportService = require("./export.service");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * GET /courses/:id/export/markdown
 */
const exportMarkdown = asyncHandler(async (req, res) => {
  const course = await exportService.fetchCourseTree(
    req.params.id,
    req.user.id,
  );

  const markdown = exportService.buildMarkdown(course);

  const filename = `${course.title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(markdown);
});

/**
 * GET /courses/:id/export/pdf
 */
const exportPdf = asyncHandler(async (req, res) => {
  const course = await exportService.fetchCourseTree(
    req.params.id,
    req.user.id,
  );

  const filename = `${course.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const pdfStream = exportService.buildPdf(course);
  pdfStream.pipe(res);
});

module.exports = { exportMarkdown, exportPdf };
