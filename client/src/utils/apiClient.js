import axios from "axios";
import useAuthStore from "../store/authStore";
import { getCookie, CSRF_COOKIE_NAME } from "./cookies";

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

/**
 * Silent access-token refresh. Every request carries a short-lived Bearer
 * token (see apiServices.js's authHeader). When the backend rejects one
 * with ACCESS_TOKEN_EXPIRED (see server/middlewares/authenticate.js), this
 * transparently exchanges the httpOnly refresh cookie for a new access
 * token and retries the original request once -- so no component or hook
 * ever has to special-case "my token expired" itself, and the user never
 * has to reload the page to recover.
 *
 * Concurrent requests that all fail at the same moment (e.g. a page firing
 * several queries at once, exactly the Users-directory case this was built
 * for) share one in-flight refresh via `refreshPromise` instead of each
 * triggering its own.
 */
let refreshPromise = null;

const refreshAccessToken = () =>
  apiClient.post(
    "/api/v1/auth/refresh",
    {},
    { headers: { "x-csrf-token": getCookie(CSRF_COOKIE_NAME) } },
  );

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isExpiredToken = response?.status === 401 && response?.data?.code === "ACCESS_TOKEN_EXPIRED";

    // Bail out immediately for anything that isn't specifically an expired
    // access token -- wrong password, missing permission, validation
    // errors, etc. must never trigger a refresh attempt. Also guards
    // against retrying the same request twice and against ever retrying
    // the refresh call itself (which can't return this code anyway, since
    // /auth/refresh doesn't go through the `authenticate` middleware).
    if (!isExpiredToken || !config || config._retry || config.url?.includes("/auth/refresh")) {
      throw error;
    }

    config._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const { data } = await refreshPromise;
      const newAccessToken = data?.data?.accessToken;
      if (!newAccessToken) {
        throw new Error("Refresh response did not include an access token");
      }

      useAuthStore.getState().setAccessToken(newAccessToken);

      config.headers = { ...config.headers, Authorization: `Bearer ${newAccessToken}` };
      return apiClient(config);
    } catch {
      // Refresh token itself is missing/expired/invalid -- the session is
      // genuinely over. Clearing auth state here causes Protected.jsx (and
      // anything else reading the store) to redirect to /login on its next
      // render -- no hard page reload. The caller still sees the ORIGINAL
      // 401, which is the more meaningful error for its own handling.
      useAuthStore.getState().clearAuth();
      throw error;
    }
  },
);

export default apiClient;
