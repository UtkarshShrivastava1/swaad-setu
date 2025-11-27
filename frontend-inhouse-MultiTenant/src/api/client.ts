// src/api/client.ts
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export const client = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Automatically unwrap axios responses so every API returns `data` only
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Request failed";

    return Promise.reject(new Error(message));
  }
);

// Maintain backward compatibility for old imports:
// - Some files do: `import api from "../client"`
// - Other files do: `import { api } from "../client"`
// - Our new client is axios-based but callable.
// Let's export aliases to avoid breaking anything.
export const api = {
  get: (...args: any[]) => client.get(...args),
  post: (...args: any[]) => client.post(...args),
  patch: (...args: any[]) => client.patch(...args),
  put: (...args: any[]) => client.put(...args),
  delete: (...args: any[]) => client.delete(...args),
};

export default client;
