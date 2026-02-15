/**
 * Mock YouTube media resolution — returns keyword-based fallback.
 */
const mockResolveYouTubeUrl = jest
  .fn()
  .mockImplementation(async (keyword) =>
    keyword ? `search:${keyword}` : null,
  );

const mockBatchResolveYouTube = jest
  .fn()
  .mockImplementation(async (modules) => {
    const results = new Map();
    for (let mi = 0; mi < modules.length; mi++) {
      for (let li = 0; li < modules[mi].lessons.length; li++) {
        const lesson = modules[mi].lessons[li];
        const key = `${mi}-${li}`;
        results.set(
          key,
          lesson.youtubeSuggestion
            ? `search:${lesson.youtubeSuggestion}`
            : null,
        );
      }
    }
    return results;
  });

module.exports = { mockResolveYouTubeUrl, mockBatchResolveYouTube };
