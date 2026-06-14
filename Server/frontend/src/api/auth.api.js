import api from "./axios.js";

export const register = (data) => api.post("/api/auth/register", data);
export const login = (data) => api.post("/api/auth/login", data);
export const getMe = () => api.get("/api/auth/me");
export const updatePassword = (data) =>
  api.put("/api/auth/update-password", data);
