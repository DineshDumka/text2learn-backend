import api from "./axios";

export const submitQuiz = (quizId, answers) =>
  api.post(`/progress/quiz/${quizId}`, { answers });

export const markLessonComplete = (lessonId) =>
  api.post(`/progress/lesson/${lessonId}`);

export const getCourseProgress = (courseId) =>
  api.get(`/progress/course/${courseId}`);
