import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000", // FastAPI backend URL
});

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     console.error('API error:', error);
//     throw error;
//   }
// );

export default api;
