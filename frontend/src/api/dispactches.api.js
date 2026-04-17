import api from "./axios";

export const getDispatches = () => api.get('/dispatches');
export const createDispatch = (data) => api.post('/dispatches', data);