import axios from "axios";

export const http = axios.create({
  baseURL: "http://localhost:8080/api",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("hc_access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

