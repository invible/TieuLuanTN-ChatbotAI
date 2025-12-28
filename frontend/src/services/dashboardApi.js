import api from './http';

export const getDashboardOverview = () =>
  api.get('/dashboard').then((res) => res.data);
