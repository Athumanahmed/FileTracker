// Mirrors server/services/permission.service.js's MODULE_VALUES (itself
// kept in sync with the SystemModule enum in prisma/schema.prisma) --
// single source of truth for every place the frontend needs to label,
// color, or enumerate SystemModule values (filters, forms, the Role
// Permissions matrix).
export const MODULE_LABELS = {
  AUTHENTICATION: "Authentication",
  AUTHORIZATION: "Authorization",
  USERS: "Users",
  DEPARTMENTS: "Departments",
  UNITS: "Units",
  POSITIONS: "Positions",
  FILE_TRACKING: "File Tracking",
  WORKFLOW: "Workflow",
  REPORTS: "Reports",
  SETTINGS: "Settings",
  DASHBOARD: "Dashboard",
  STORAGE: "Storage",
  ARCHIVE: "Archive",
};

export const MODULE_BADGE_CLASSES = {
  AUTHENTICATION: "bg-blue-50 text-blue-700",
  AUTHORIZATION: "bg-indigo-50 text-indigo-700",
  USERS: "bg-primaryBlueLight text-primaryBlue",
  DEPARTMENTS: "bg-teal-50 text-teal-700",
  UNITS: "bg-cyan-50 text-cyan-700",
  POSITIONS: "bg-purple-50 text-purple-700",
  FILE_TRACKING: "bg-amber-50 text-amber-700",
  WORKFLOW: "bg-pink-50 text-pink-700",
  REPORTS: "bg-green-50 text-green-700",
  SETTINGS: "bg-gray-100 text-gray-700",
  DASHBOARD: "bg-rose-50 text-rose-700",
  STORAGE: "bg-slate-100 text-slate-700",
  ARCHIVE: "bg-orange-50 text-orange-700",
};

export const MODULE_ORDER = Object.keys(MODULE_LABELS);

export const MODULE_OPTIONS = MODULE_ORDER.map((value) => ({ value, label: MODULE_LABELS[value] }));
