import api from "./axios";

// No update or delete for restocks coz they are permanent records

export const getRestocks = () => api.get('/restocks');
export const getRestock = (id) => api.get(`/restocks/${id}`);
export const createRestock = (data) => api.post('/restocks', data);