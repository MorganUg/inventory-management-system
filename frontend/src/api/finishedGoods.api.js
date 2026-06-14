import api from "./axios";

export const getFinishedGoods = () => api.get('/finished-goods');
export const getFinishedGood = (id) => api.get(`/finished-goods/${id}`);
export const createFinishedGood = (data) => api.post('/finished-goods', data);
export const updateFinishedGood = (id, data) => api.put(`/finished-goods/${id}`, data);
export const deleteFinishedGood = (id) => api.delete(`/finished-goods/${id}`);