import {
  UserPlus,
  UserCog,
  UserCheck,
  UserX,
  Lock,
  LockOpen,
  KeyRound,
  Building2,
  Boxes,
  IdCard,
  ShieldCheck,
  Link2,
  LogIn,
  LogOut,
  FolderOpen,
  Paperclip,
  FileSignature,
  Workflow,
  Archive,
  Activity,
} from "lucide-react";

// Shared by RecentActivityCard (dashboard widget) and AuditLogs (full page)
// so both surfaces render the same icon for the same log entry. Mirrors
// server/utils/auditActions.js's action codes and the `entity` strings
// each service actually logs (see e.g. department.service.js's logAudit).
const ACTION_ICONS = {
  LOGIN_SUCCESS: LogIn,
  LOGIN_FAILED: LogIn,
  LOGOUT: LogOut,
  LOGOUT_ALL: LogOut,
  USER_ACTIVATED: UserCheck,
  USER_DEACTIVATED: UserX,
  USER_LOCKED: Lock,
  USER_UNLOCKED: LockOpen,
  USER_PASSWORD_RESET_BY_ADMIN: KeyRound,
};

const ENTITY_ICONS = {
  User: { created: UserPlus, other: UserCog },
  Department: { other: Building2 },
  Unit: { other: Boxes },
  Position: { other: IdCard },
  Role: { other: ShieldCheck },
  Permission: { other: KeyRound },
  RolePermission: { other: Link2 },
  File: { other: FolderOpen },
  FileAttachment: { other: Paperclip },
  FileMinute: { other: FileSignature },
  WorkflowTemplate: { other: Workflow },
  WorkflowInstance: { other: Workflow },
  ArchiveRecord: { other: Archive },
};

export const getAuditLogIcon = (log) => {
  if (ACTION_ICONS[log.action]) return ACTION_ICONS[log.action];

  const entry = ENTITY_ICONS[log.entity];
  if (!entry) return Activity;
  if (log.action.endsWith("_CREATED") && entry.created) return entry.created;
  return entry.other;
};
