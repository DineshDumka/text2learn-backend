import api from "./axios";

export const exportMarkdown = (courseId) =>
  api.get(`/courses/${courseId}/export/markdown`, { responseType: "blob" });

export const exportPdf = (courseId) =>
  api.get(`/courses/${courseId}/export/pdf`, { responseType: "blob" });
