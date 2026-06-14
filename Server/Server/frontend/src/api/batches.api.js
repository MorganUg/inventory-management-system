import api from "./axios";

export const getBatches = () => api.get('/batches');
export const getBatch = (id) => api.get(`/batches/${id}`);
export const createBatch = (data) => api.post('/batches', data);
export const updateBatchStatus = (id, status) => api.patch(`/batches/${id}/status`, { status });
export const completeBatch = (id, outputs) => api.post(`/batches/${id}/complete`, { outputs });