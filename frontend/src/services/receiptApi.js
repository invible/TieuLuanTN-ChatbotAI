import { api } from "./http";

export const listReceipts = () => api.get("/receipts");

export const getReceipt = (id) => api.get(`/receipts/${id}`);

export const createReceipt = (data) => api.post("/receipts", data);

export const updateReceipt = (id, data) => api.put(`/receipts/${id}`, data);

export const deleteReceipt = (id) => api.delete(`/receipts/${id}`);