import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Request failed";

    if (error.response?.status === 401 || message.includes("Invalid token") || 
        (error.response?.status === 403 && (message.includes("cross-tenant") || message.includes("Forbidden")))) {
      const rid = localStorage.getItem("currentRid");
      if (rid) {
        // Clear the specific admin token for this rid before redirecting
        localStorage.removeItem(`adminToken_${rid}`);
        window.location.href = `/t/${rid}/admin-login`;
      } else {
        window.location.href = `/`; // Fallback to home
      }
    }

    return Promise.reject(new Error(message));
  }
);

// Add Authorization header to requests
client.interceptors.request.use((config) => {
  // Extract rid from the URL path of the current request
  // Assuming URLs are like /api/:rid/...
  const match = config.url?.match(/^\/api\/([^/]+)\//);
  const ridFromUrl = match ? match[1] : null;

  const currentRidInStorage = localStorage.getItem("currentRid");
  const ridToUse = ridFromUrl || currentRidInStorage; // Prioritize URL rid, fallback to storage

  if (ridToUse) {
    const tokenKey = `adminToken_${ridToUse}`;
    const token = localStorage.getItem(tokenKey);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default client;
