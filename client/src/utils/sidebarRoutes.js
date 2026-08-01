import {
  LayoutDashboard,
  Users,
  Building2,
  Boxes,
  IdCard,
  ShieldCheck,
  KeyRound,
  Link2,
  FileClock,
  Settings,
} from "lucide-react";
import { ROLES } from "./roles";
import { PERMISSIONS } from "./permissions";

/**
 * Keyed by role code (user.roles[0].code) -- each role gets its own menu
 * tree, not a shared one filtered down. An item's optional `permission`
 * is a second, independent gate AppSidebar applies on top of the role
 * match (defense in depth against a role that's missing an expected
 * permission grant), mirroring how the backend never trusts role alone.
 */
export const sidebarRoutes = {
  [ROLES.SYSTEM_ADMIN]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    {
      title: "Users",
      icon: Users,
      path: "/admin/users",
      permission: PERMISSIONS.USERS_READ,
    },
    {
      title: "Departments",
      icon: Building2,
      path: "/admin/departments",
      permission: PERMISSIONS.DEPARTMENTS_READ,
    },
    {
      title: "Units",
      icon: Boxes,
      path: "/admin/units",
      permission: PERMISSIONS.UNITS_READ,
    },
    {
      title: "Positions",
      icon: IdCard,
      path: "/admin/positions",
      permission: PERMISSIONS.POSITIONS_READ,
    },
    {
      title: "Roles",
      icon: ShieldCheck,
      path: "/admin/roles",
      permission: PERMISSIONS.ROLES_READ,
    },
    {
      title: "Permissions",
      icon: KeyRound,
      path: "/admin/permissions",
      permission: PERMISSIONS.PERMISSIONS_READ,
    },
    {
      title: "Role Permissions",
      icon: Link2,
      path: "/admin/role-permissions",
      permission: PERMISSIONS.ROLE_PERMISSIONS_READ,
    },
    { title: "Audit Logs", icon: FileClock, path: "/admin/audit-logs" },
    { title: "System Settings", icon: Settings, path: "/admin/settings" },
  ],

  [ROLES.DIRECTOR]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/director" },
  ],
  [ROLES.HOD]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/hod" },
    {
      title: "Users",
      icon: Users,
      path: "/admin/users",
      permission: PERMISSIONS.USERS_READ,
    },
  ],
  [ROLES.REGISTRY]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/registry" },
  ],
  [ROLES.SUPERVISOR]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/supervisor" },
  ],
  [ROLES.OFFICER]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/officer" },
  ],
  [ROLES.ARCHIVE]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/archive" },
  ],
  [ROLES.ICT_ADMIN]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/ict-admin" },
  ],
};
