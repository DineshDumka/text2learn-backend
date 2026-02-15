import api from "./axios";

export const getLesson = (id, lang = "ENGLISH") =>
  api.get(`/lessons/${id}`, { params: { lang } });

export const getLessonQuiz = (lessonId) =>
  api.get(`/lessons/${lessonId}/quiz`);
