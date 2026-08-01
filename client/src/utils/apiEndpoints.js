export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    LOGOUT: "/api/v1/auth/logout",
    REFRESH_TOKEN: "/api/v1/auth/refresh",
    ME: "/api/v1/auth/me",
    FORCE_CHANGE_PASSWORD: "/api/v1/auth/force-change-password",
    CHANGE_PASSWORD: "/api/v1/auth/change-password",
    FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
    VERIFY_RESET_OTP: "/api/v1/auth/verify-reset-otp",
    RESEND_RESET_OTP: "/api/v1/auth/resend-reset-otp",
    RESET_PASSWORD: "/api/v1/auth/reset-password",
  },

  USERS: {
    ADMIN_LIST: "/api/v1/admin/users",
    ADMIN_DETAIL: (userId) => `/api/v1/admin/users/${userId}`,
  },

  DASHBOARD: {
    ADMIN_SUMMARY: "/api/v1/dashboard/admin/summary",
    ADMIN_RECENT_ACTIVITY: "/api/v1/dashboard/admin/recent-activity",
  },
};
