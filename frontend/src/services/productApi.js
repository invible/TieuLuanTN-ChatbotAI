import { api } from "./http";

export const listProducts = () => api.get("/products");

export const getProduct = (id) => api.get(`/products/${id}`);

export const createProduct = (data) => api.post("/products", data);

export const updateProduct = (id, data) => api.put(`/products/${id}`, data);

export const deleteProduct = (id) => api.delete(`/products/${id}`);

export const uploadProductImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/products/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
