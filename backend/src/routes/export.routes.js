const express = require("express");
const exportController = require("../modules/courses/export.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// GET /courses/:id/export/markdown — download course as Markdown
router.get(
  "/:id/export/markdown",
  protect,
  exportController.exportMarkdown,
);

// GET /courses/:id/export/pdf — download course as PDF
router.get(
  "/:id/export/pdf",
  protect,
  exportController.exportPdf,
);

module.exports = router;
