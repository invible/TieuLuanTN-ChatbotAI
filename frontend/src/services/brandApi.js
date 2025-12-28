import api from './http';

export const listBrands = () =>
  api.get('/brands');

export const getBrand = (id) =>
  api.get(`/brands/${id}`).then((res) => res.data);

export const createBrand = (data) =>
  api.post('/brands', data).then((res) => res.data);

export const updateBrand = (id, data) =>
  api.put(`/brands/${id}`, data).then((res) => res.data);

export const deleteBrand = (id) =>
  api.delete(`/brands/${id}`).then((res) => res.data);