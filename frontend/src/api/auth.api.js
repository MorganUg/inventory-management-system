import api from "./axios.js";

export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const updatePassword = (data) =>
  api.put("/auth/update-password", data);
