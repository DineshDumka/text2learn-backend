import api from "./axios";

export const register = (name, email, password) =>
  api.post("/auth/register", { name, email, password });

export const login = (email, password) =>
  api.post("/auth/login", { email, password });

export const refresh = () => api.post("/auth/refresh");

export const logout = () => api.post("/auth/logout");

export const getMe = () => api.get("/auth/me");
