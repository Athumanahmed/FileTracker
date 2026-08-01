import {
  Crown,
  Building2,
  ClipboardList,
  Archive,
  MonitorCog,
  UserCog,
  User,
  ShieldPlus,
} from "lucide-react";
import { PERMISSIONS } from "./permissions";

/**
 * Every actor an admin-ish role could potentially create, mirroring
 * server/routes/user.routes.js's per-target-role creation endpoints one to
 * one. Which of these actually show up for a given caller is computed at
 * render time from their real permissions[] (see getCreatableActorTypes),
 * never from their role name -- a permission grant/revoke made later via
 * the Role Permissions module changes what this list shows with no
 * frontend code change.
 */
export const CREATABLE_ACTOR_TYPES = [
  {
    roleCode: "DIRECTOR",
    permission: PERMISSIONS.USERS_CREATE_DIRECTOR,
    label: "Municipal Director",
    description: "Top-level executive oversight across the council",
    icon: Crown,
    scope: "Global",
  },
  {
    roleCode: "HOD",
    permission: PERMISSIONS.USERS_CREATE_HOD,
    label: "Head of Department",
    description: "Leads a department and its units",
    icon: Building2,
    scope: "Global",
  },
  {
    roleCode: "REGISTRY",
    permission: PERMISSIONS.USERS_CREATE_REGISTRY,
    label: "Registry Officer",
    description: "Registers and routes incoming files",
    icon: ClipboardList,
    scope: "Global",
  },
  {
    roleCode: "ARCHIVE",
    permission: PERMISSIONS.USERS_CREATE_ARCHIVE,
    label: "Archive Officer",
    description: "Manages long-term file archiving",
    icon: Archive,
    scope: "Global",
  },
  {
    roleCode: "ICT_ADMIN",
    permission: PERMISSIONS.USERS_CREATE_ICT_ADMIN,
    label: "ICT Administrator",
    description: "Manages the platform's technical systems",
    icon: MonitorCog,
    scope: "Global",
  },
  {
    roleCode: "SUPERVISOR",
    permission: PERMISSIONS.USERS_CREATE_SUPERVISOR,
    label: "Unit Supervisor",
    description: "Leads a unit within your department",
    icon: UserCog,
    scope: "Department",
  },
  {
    roleCode: "OFFICER",
    permission: PERMISSIONS.USERS_CREATE_OFFICER,
    label: "Department Officer",
    description: "Handles daily operations within your unit",
    icon: User,
    scope: "Unit",
  },
  {
    roleCode: "SYSTEM_ADMIN",
    permission: PERMISSIONS.USERS_CREATE_SUPER_ADMIN,
    label: "Super Administrator",
    description: "Full, unrestricted system access",
    icon: ShieldPlus,
    scope: "Global",
  },
];

/** Filters the full catalog down to what this caller's actual granted permissions allow. */
export const getCreatableActorTypes = (userPermissions = []) =>
  CREATABLE_ACTOR_TYPES.filter((actor) =>
    userPermissions.includes(actor.permission),
  );
