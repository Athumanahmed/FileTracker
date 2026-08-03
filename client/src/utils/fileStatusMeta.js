// Mirrors server/prisma/schema.prisma's FileStatus enum exactly -- single
// source of truth for the label/color every File Management screen uses to
// render a status (charts, badges, filters).
export const FILE_STATUS_META = {
  DRAFT: { label: "Draft", color: "#94a3b8", badgeClass: "bg-gray-100 text-gray-700" },
  REGISTERED: { label: "Registered", color: "#3b82f6", badgeClass: "bg-blue-50 text-blue-700" },
  IN_PROGRESS: { label: "In Progress", color: "#f97316", badgeClass: "bg-orange-50 text-orange-700" },
  PENDING_ACTION: { label: "Pending Action", color: "#eab308", badgeClass: "bg-amber-50 text-amber-700" },
  ON_HOLD: { label: "On Hold", color: "#f43f5e", badgeClass: "bg-rose-50 text-rose-700" },
  FORWARDED: { label: "Forwarded", color: "#6366f1", badgeClass: "bg-indigo-50 text-indigo-700" },
  RETURNED: { label: "Returned", color: "#06b6d4", badgeClass: "bg-cyan-50 text-cyan-700" },
  APPROVED: { label: "Approved", color: "#14b8a6", badgeClass: "bg-teal-50 text-teal-700" },
  REJECTED: { label: "Rejected", color: "#ef4444", badgeClass: "bg-red-50 text-red-700" },
  COMPLETED: { label: "Completed", color: "#22c55e", badgeClass: "bg-green-50 text-green-700" },
  ARCHIVED: { label: "Archived", color: "#a855f7", badgeClass: "bg-purple-50 text-purple-700" },
  CLOSED: { label: "Closed", color: "#64748b", badgeClass: "bg-slate-100 text-slate-700" },
};

export const getFileStatusMeta = (status) =>
  FILE_STATUS_META[status] || { label: status, color: "#94a3b8", badgeClass: "bg-gray-100 text-gray-700" };

// Mirrors PriorityLevel.
export const FILE_PRIORITY_META = {
  LOW: { label: "Low", badgeClass: "bg-gray-100 text-gray-600" },
  NORMAL: { label: "Normal", badgeClass: "bg-blue-50 text-blue-700" },
  HIGH: { label: "High", badgeClass: "bg-amber-50 text-amber-700" },
  URGENT: { label: "Urgent", badgeClass: "bg-orange-50 text-orange-700" },
  CRITICAL: { label: "Critical", badgeClass: "bg-red-50 text-red-700" },
};

export const getFilePriorityMeta = (priority) =>
  FILE_PRIORITY_META[priority] || { label: priority, badgeClass: "bg-gray-100 text-gray-600" };
