import api from './http';

export const listBrands = () =>
  api.get('/brands');

export const getBrand = (id) =>
  api.get(`/brands/${id}`);

export const createBrand = (data) =>
  api.post('/brands', data);

export const updateBrand = (id, data) =>
  api.put(`/brands/${id}`, data);

export const deleteBrand = (id) =>
  api.delete(`/brands/${id}`);