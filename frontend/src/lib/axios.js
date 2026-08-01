import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? "http://localhost:5001/api" 
    : "https://bubbletalk-chat-app.up.railway.app/api",
  withCredentials: true,
});

// Interceptor: har request ke saath token bhejo agar localStorage mein hai
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("chat-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});