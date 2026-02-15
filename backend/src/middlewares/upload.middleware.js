const multer = require("multer");
const AppError = require("../utils/AppError");

/**
 * Multer config for PDF uploads.
 * - Memory storage (buffer only, no temp files on disk)
 * - 5MB file size limit
 * - PDF MIME type validation
 */
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(
        AppError.badRequest(
          "Only PDF files are allowed",
          "INVALID_FILE_TYPE",
        ),
        false,
      );
    }
    cb(null, true);
  },
});

module.exports = { pdfUpload };
