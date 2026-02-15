const logger = require("../../config/logger");

const YOUTUBE_URL_REGEX =
  /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;

/**
 * Resolve a YouTube search keyword into a video URL.
 *
 * Strategy (graceful degradation):
 * 1. If YOUTUBE_API_KEY is set → call YouTube Data API v3   → return first result URL
 * 2. If no API key            → return "search:<keyword>"   → frontend builds a link
 *
 * WHY keyword-only from AI?
 * AI models hallucinate URLs. We NEVER trust a full URL from the AI.
 * Instead, AI returns search keywords (e.g., "JavaScript closures tutorial")
 * and we resolve them ourselves.
 */
const resolveYouTubeUrl = async (keyword) => {
  if (!keyword || keyword.trim().length === 0) return null;

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const searchQuery = encodeURIComponent(keyword.trim());
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=1&key=${apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        logger.warn(
          { status: response.status },
          "YouTube API returned non-OK status",
        );
        return `search:${keyword.trim()}`;
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        logger.info({ keyword, videoUrl }, "YouTube video resolved");
        return videoUrl;
      }

      logger.warn({ keyword }, "No YouTube results found");
      return `search:${keyword.trim()}`;
    } catch (error) {
      logger.error(
        { error: error.message, keyword },
        "YouTube API call failed, falling back to keyword",
      );
      return `search:${keyword.trim()}`;
    }
  }

  // No API key — graceful fallback
  logger.debug({ keyword }, "No YOUTUBE_API_KEY, storing search keyword");
  return `search:${keyword.trim()}`;
};

/**
 * Batch resolve YouTube keywords for multiple lessons.
 * Called BEFORE the Prisma transaction (no network calls inside tx).
 *
 * @param {Array} lessons - Array of { title, youtubeSuggestion? }
 * @returns {Map<number, string|null>} index → resolved URL
 */
const batchResolveYouTube = async (modules) => {
  const results = new Map();

  for (let mi = 0; mi < modules.length; mi++) {
    for (let li = 0; li < modules[mi].lessons.length; li++) {
      const lesson = modules[mi].lessons[li];
      const key = `${mi}-${li}`;

      if (lesson.youtubeSuggestion) {
        results.set(key, await resolveYouTubeUrl(lesson.youtubeSuggestion));
      } else {
        results.set(key, null);
      }
    }
  }

  return results;
};

/**
 * Validate that a string is a proper YouTube URL.
 */
const isValidYouTubeUrl = (url) => {
  if (!url || url.startsWith("search:")) return true; // search keywords are valid
  return YOUTUBE_URL_REGEX.test(url);
};

module.exports = {
  resolveYouTubeUrl,
  batchResolveYouTube,
  isValidYouTubeUrl,
};
