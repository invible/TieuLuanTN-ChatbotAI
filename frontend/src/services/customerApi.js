import { api } from "./http";

export const listCustomers = () => api.get("/customers");
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const count_orders_by_customer = (customer_id) => api.get(`/customers/${customer_id}/count`);
export const createCustomer = (data) => api.post("/customers", data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
