import api from "./http";
import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "access_token";

export const login = async (email, password) => {
  const res = await api.post("/auth/login", {
    email,
    password,
  });

  return res;
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch {
    clearToken();
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("access_token");
  window.location.href = "/login";
};

export const isLoggedIn = () => {
  return !!localStorage.getItem("access_token");
};
