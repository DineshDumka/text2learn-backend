const pdfParse = require("pdf-parse");
const AppError = require("../../utils/AppError");
const logger = require("../../config/logger");

const MIN_TEXT_LENGTH = 100;
const MAX_TEXT_LENGTH = 50000;

/**
 * Extract and clean text from a PDF buffer.
 *
 * @param {Buffer} buffer - PDF file buffer from multer
 * @returns {string} Cleaned text content
 * @throws {AppError} If text is too short or too long
 */
const extractTextFromPdf = async (buffer) => {
  let data;

  try {
    data = await pdfParse(buffer);
  } catch (error) {
    logger.error({ error: error.message }, "PDF parsing failed");
    throw AppError.badRequest(
      "Could not parse the PDF file. Ensure it is a valid, text-based PDF.",
      "PDF_PARSE_ERROR",
    );
  }

  // Clean the extracted text
  const rawText = data.text || "";
  const cleanedText = rawText
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Collapse excessive newlines
    .replace(/[ \t]{2,}/g, " ") // Collapse whitespace
    .replace(/\f/g, "\n") // Form feeds → newlines
    .trim();

  // Validate text length
  if (cleanedText.length < MIN_TEXT_LENGTH) {
    throw AppError.badRequest(
      `Extracted text is too short (${cleanedText.length} chars). The PDF may be image-based or empty. Minimum: ${MIN_TEXT_LENGTH} characters.`,
      "PDF_TEXT_TOO_SHORT",
    );
  }

  if (cleanedText.length > MAX_TEXT_LENGTH) {
    throw AppError.badRequest(
      `Extracted text is too long (${cleanedText.length} chars). Maximum: ${MAX_TEXT_LENGTH} characters. Try a shorter PDF.`,
      "PDF_TEXT_TOO_LONG",
    );
  }

  logger.info(
    { pages: data.numpages, textLength: cleanedText.length },
    "PDF text extracted successfully",
  );

  return cleanedText;
};

module.exports = { extractTextFromPdf };
