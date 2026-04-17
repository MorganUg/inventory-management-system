import api from "./axios";

export const getBoms = () => api.get('/bom');
export const getBom = (id) => api.get(`/bom/${id}`);
export const getBomByFinishedGood = (finishedGoodId) => api.get(`/bom/finished-good/${finishedGoodId}`);
export const createBom = (data) => api.post('/bom', data);
export const activateBom = (id) => api.patch(`/bom/${id}/activate`);

export const addBomItem = (bomId, data) => api.post(`/bom/${bomId}/items`, data);
export const updateBomItem = (bomId, itemId, data) => api.put(`/bom/${bomId}/items/${itemId}`, data);
export const deleteBomItem = (bomId, itemId) => api.delete(`/bom/${bomId}/items/${itemId}`);