import axios from "axios";

const API_BASE =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_BASE_URL_PROD || "https://api.swaadsetu.com"
    : import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = "Request failed"; // Default message

    if (error.response) {
      if (
        typeof error.response.data === "object" &&
        error.response.data !== null
      ) {
        message =
          error.response.data.message || error.response.data.error || message;
      } else if (
        typeof error.response.data === "string" &&
        error.response.data !== ""
      ) {
        message = error.response.data; // Server might send a plain error string
      } else if (error.message) {
        message = error.message; // Axios error message
      }
    } else if (error.message) {
      message = error.message; // Network error or other client-side error
    }

    if (
      error.response &&
      (error.response.status === 401 ||
        (error.response.status === 403 &&
          (message.includes("cross-tenant") || message.includes("Forbidden"))))
    ) {
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
