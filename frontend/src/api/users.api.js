import api from "./axios";

export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const resetPassword = (id, data) => api.patch(`/users/${id}/reset-password`, data);
export const deactivateUser = (id) => api.patch(`/users/${id}/deactivate`);
export const deleteUser = (id) => api.delete(`/users/${id}`);