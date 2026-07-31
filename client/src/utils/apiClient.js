import axios from "axios";

/**
 * withCredentials is required so the browser sends/receives the backend's
 * httpOnly refresh-token and CSRF cookies (set by /auth/login, read by
 * /auth/refresh) -- without it, cross-origin requests silently drop them.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default apiClient;
