import axios, { type AxiosRequestConfig } from "axios";

const API_BASE =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_BASE_URL_PROD || "https://api.swaadsetu.com"
    : import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const client = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Add a request interceptor
client.interceptors.request.use(
  (config) => {
    // Multi-tenant token logic
    const urlParts = config.url?.split("/");
    const rid = urlParts && urlParts.length > 2 ? urlParts[2] : null;

    let token = null;
    if (rid) {
      token =
        localStorage.getItem(`staffToken_${rid}`) ||
        localStorage.getItem(`adminToken_${rid}`);
    }

    // Fallback to generic tokens
    if (!token) {
      token =
        localStorage.getItem("staffToken") ||
        localStorage.getItem("adminToken");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Automatically unwrap axios responses so every API returns `data` only
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Request failed";

    if (message.toLowerCase().includes("token")) {
      // Clear potentially invalid tokens
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.toLowerCase().includes("token")) {
            localStorage.removeItem(key);
          }
        });
        // Optionally, redirect to login
        // window.location.href = '/login';
      } catch (e) {
        console.error("Failed to clear tokens", e);
      }
    }

    return Promise.reject(new Error(message));
  }
);

// Maintain backward compatibility for old imports:
// - Some files do: `import api from "../client"`
// - Other files do: `import { api } from "../client"`
// - Our new client is axios-based but callable.
// Let's export aliases to avoid breaking anything.
export const api = {
  get: (...args: [string, AxiosRequestConfig?]) => client.get(...args),
  post: (...args: [string, any?, AxiosRequestConfig?]) => client.post(...args),
  patch: (...args: [string, any?, AxiosRequestConfig?]) =>
    client.patch(...args),
  put: (...args: [string, any?, AxiosRequestConfig?]) => client.put(...args),
  delete: (...args: [string, AxiosRequestConfig?]) => client.delete(...args),
};

export default client;
