import api from "./axios";

export const getRawMaterials = () => api.get('/raw-materials');
export const getRawMaterial = (id) => api.get(`/raw-materials/${id}`);
export const createRawMaterial = (data) => api.post('/raw-materials', data);
export const updateRawMaterial = (id, data) => api.put(`/raw-materials/${id}`, data);
export const deleteRawMaterial = (id) => api.delete(`/raw-materials/${id}`);