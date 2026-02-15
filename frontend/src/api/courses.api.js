import api from "./axios";

export const searchCourses = (params) => api.get("/courses", { params });

export const createCourse = (data) => api.post("/courses", data);

export const createCourseFromPdf = (formData) =>
  api.post("/courses/from-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getCourse = (id) => api.get(`/courses/${id}`);

export const getCourseStatus = (id) => api.get(`/courses/${id}/status`);

export const deleteCourse = (id) => api.delete(`/courses/${id}`);
