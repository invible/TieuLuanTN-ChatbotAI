import api from "./http";

export const listSuppliers = () => api.get("/suppliers");

export const getSupplier = (id) => api.get(`/suppliers/${id}`);

export const createSupplier = (data) => api.post("/suppliers", data);

export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);