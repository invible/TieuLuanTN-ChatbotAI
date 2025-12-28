import api from './http';

export const listCategories = () =>
  api.get('/categories');

export const getCategory = (id) =>
  api.get(`/categories/${id}`).then((res) => res.data);

export const createCategory = (data) =>
  api.post('/categories', data).then((res) => res.data);

export const updateCategory = (id, data) =>
  api.put(`/categories/${id}`, data).then((res) => res.data);

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`).then((res) => res.data);