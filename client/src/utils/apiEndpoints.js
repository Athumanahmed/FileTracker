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
    ADMIN_STATS: "/api/v1/admin/users/stats",
    ADMIN_DETAIL: (userId) => `/api/v1/admin/users/${userId}`,
    // SYSTEM_ADMIN-creatable actors -- see server/routes/user.routes.js.
    CREATE_DIRECTOR: "/api/v1/users/directors",
    CREATE_HOD: "/api/v1/users/hods",
    CREATE_REGISTRY_OFFICER: "/api/v1/users/registry-officers",
    CREATE_ARCHIVE_OFFICER: "/api/v1/users/archive-officers",
    CREATE_ICT_ADMIN: "/api/v1/users/ict-admins",
  },

  DASHBOARD: {
    ADMIN_SUMMARY: "/api/v1/dashboard/admin/summary",
    ADMIN_RECENT_ACTIVITY: "/api/v1/dashboard/admin/recent-activity",
  },

  DEPARTMENTS: {
    LIST: "/api/v1/departments",
    CREATE: "/api/v1/departments",
    STATS: "/api/v1/departments/stats",
  },

  UNITS: {
    LIST: "/api/v1/units",
    CREATE: "/api/v1/units",
    STATS: "/api/v1/units/stats",
  },

  ROLES: {
    LIST: "/api/v1/roles",
  },
};
