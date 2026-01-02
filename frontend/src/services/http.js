import axios from "axios";
import { getToken, logout } from "./authService";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// =========================
// REQUEST INTERCEPTOR
// =========================
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =========================
// RESPONSE INTERCEPTOR
// =========================
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      logout();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
