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
    SESSIONS: "/api/v1/auth/sessions",
    REVOKE_SESSION: (sessionId) => `/api/v1/auth/sessions/${sessionId}`,
    LOGOUT_ALL: "/api/v1/auth/logout-all",
  },

  USERS: {
    ADMIN_LIST: "/api/v1/admin/users",
    ADMIN_STATS: "/api/v1/admin/users/stats",
    ADMIN_DETAIL: (userId) => `/api/v1/admin/users/${userId}`,
    ADMIN_ACTIVATE: (userId) => `/api/v1/admin/users/${userId}/activate`,
    ADMIN_DEACTIVATE: (userId) => `/api/v1/admin/users/${userId}/deactivate`,
    ADMIN_LOCK: (userId) => `/api/v1/admin/users/${userId}/lock`,
    ADMIN_UNLOCK: (userId) => `/api/v1/admin/users/${userId}/unlock`,
    ADMIN_RESET_PASSWORD: (userId) => `/api/v1/admin/users/${userId}/reset-password`,
    // SYSTEM_ADMIN-creatable actors -- see server/routes/user.routes.js.
    CREATE_DIRECTOR: "/api/v1/users/directors",
    CREATE_HOD: "/api/v1/users/hods",
    CREATE_REGISTRY_OFFICER: "/api/v1/users/registry-officers",
    CREATE_ARCHIVE_OFFICER: "/api/v1/users/archive-officers",
    CREATE_ICT_ADMIN: "/api/v1/users/ict-admins",
    // Department/Unit-scoped actors -- HOD creates Supervisors, Supervisor
    // creates Officers (see server/config/organizationalHierarchy.js).
    CREATE_SUPERVISOR: "/api/v1/users/supervisors",
    CREATE_OFFICER: "/api/v1/users/officers",
    // Self-service -- any authenticated user, no permission code involved
    // (see server/routes/user.routes.js).
    UPDATE_OWN_PROFILE: "/api/v1/users/profile",
  },

  DASHBOARD: {
    ADMIN_SUMMARY: "/api/v1/dashboard/admin/summary",
    ADMIN_RECENT_ACTIVITY: "/api/v1/dashboard/admin/recent-activity",
    ADMIN_AUDIT_LOGS: "/api/v1/dashboard/admin/audit-logs",
    ADMIN_AUDIT_LOG_ENTITIES: "/api/v1/dashboard/admin/audit-logs/entities",
    SCOPED_SUMMARY: "/api/v1/dashboard/scoped/summary",
    SCOPED_RECENT_ACTIVITY: "/api/v1/dashboard/scoped/recent-activity",
    MY_RECENT_ACTIVITY: "/api/v1/dashboard/my/recent-activity",
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

  POSITIONS: {
    LIST: "/api/v1/positions",
    CREATE: "/api/v1/positions",
    STATS: "/api/v1/positions/stats",
  },

  ROLES: {
    LIST: "/api/v1/roles",
    CREATE: "/api/v1/roles",
    STATS: "/api/v1/roles/stats",
  },

  PERMISSIONS: {
    LIST: "/api/v1/permissions",
    CREATE: "/api/v1/permissions",
    STATS: "/api/v1/permissions/stats",
  },

  ROLE_PERMISSIONS: {
    LIST: "/api/v1/role-permissions",
    SYNC: "/api/v1/role-permissions/sync",
  },

  // File Lifecycle Management -- see server/routes/file.routes.js and
  // server/routes/report.routes.js. Only the endpoints wired so far are
  // listed; extend this block as each module's UI is built.
  FILES: {
    LIST: "/api/v1/files",
    CREATE: "/api/v1/files",
    DETAIL: (fileId) => `/api/v1/files/${fileId}`,
  },

  FILE_CATEGORIES: {
    LIST: "/api/v1/file-categories",
  },

  ATTACHMENTS: {
    LIST_FOR_FILE: (fileId) => `/api/v1/files/${fileId}/attachments`,
    UPLOAD_FOR_FILE: (fileId) => `/api/v1/files/${fileId}/attachments`,
    DOWNLOAD: (id) => `/api/v1/attachments/${id}/download`,
    PREVIEW: (id) => `/api/v1/attachments/${id}/preview`,
    REPLACE: (id) => `/api/v1/attachments/${id}/replace`,
    DELETE: (id) => `/api/v1/attachments/${id}`,
  },

  WORKFLOW_TEMPLATES: {
    LIST: "/api/v1/workflow-templates",
  },

  WORKFLOW: {
    STATUS: (fileId) => `/api/v1/files/${fileId}/workflow`,
    START: (fileId) => `/api/v1/files/${fileId}/workflow/start`,
    TRANSITION: (fileId) => `/api/v1/files/${fileId}/workflow/transition`,
    CLAIM: (fileId) => `/api/v1/files/${fileId}/workflow/claim`,
    ELIGIBLE_TARGETS: (fileId) => `/api/v1/files/${fileId}/workflow/eligible-targets`,
    MOVEMENTS: (fileId) => `/api/v1/files/${fileId}/movements`,
    OVERDUE: "/api/v1/workflow/overdue-assignments",
  },

  MINUTES: {
    LIST_FOR_FILE: (fileId) => `/api/v1/files/${fileId}/minutes`,
    CREATE_FOR_FILE: (fileId) => `/api/v1/files/${fileId}/minutes`,
    REPLY: (id) => `/api/v1/minutes/${id}/reply`,
    DELETE: (id) => `/api/v1/minutes/${id}`,
  },

  TIMELINE: {
    LIST_FOR_FILE: (fileId) => `/api/v1/files/${fileId}/timeline`,
  },

  ARCHIVE: {
    STATUS_FOR_FILE: (fileId) => `/api/v1/files/${fileId}/archive`,
    ARCHIVE_FILE: (fileId) => `/api/v1/files/${fileId}/archive`,
    RESTORE_FILE: (fileId) => `/api/v1/files/${fileId}/archive/restore`,
    EXPIRED_RETENTION: "/api/v1/archive/expired-retention",
  },

  NOTIFICATIONS: {
    LIST: "/api/v1/notifications",
    MARK_READ: (id) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: "/api/v1/notifications/read-all",
    PREFERENCES: "/api/v1/notifications/preferences",
  },

  REPORTS: {
    DASHBOARD: "/api/v1/reports/dashboard",
    STATUS_DISTRIBUTION: "/api/v1/reports/charts/status-distribution",
    REGISTRATIONS_OVER_TIME: "/api/v1/reports/charts/registrations-over-time",
    DEPARTMENT_PERFORMANCE: "/api/v1/reports/department-performance",
    OFFICER_PERFORMANCE: "/api/v1/reports/officer-performance",
    EXPORT: "/api/v1/reports/export",
  },
};
