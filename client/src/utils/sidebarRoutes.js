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
  Bell,
  FolderOpen,
  Workflow as WorkflowIcon,
  Waypoints,
  Archive as ArchiveIcon,
  BarChart3,
} from "lucide-react";
import { ROLES } from "./roles";
import { PERMISSIONS } from "./permissions";

/**
 * File Lifecycle Management nav items shared across every role that holds
 * the matching permission -- built per role below since each item's path
 * is prefixed with that role's own top-level branch (same convention as
 * the existing Users/Departments/... items). Register File deliberately
 * has no entry here: it's reached via a button on the Files page (path
 * `files/new`), not its own sidebar item.
 */
const notificationsItem = (rolePath) => ({
  title: "Notifications",
  icon: Bell,
  path: `/${rolePath}/notifications`,
});
const filesItem = (rolePath) => ({
  title: "Files",
  icon: FolderOpen,
  path: `/${rolePath}/files`,
  permission: PERMISSIONS.FILES_READ,
});
const workflowItem = (rolePath) => ({
  title: "My Workflow",
  icon: WorkflowIcon,
  path: `/${rolePath}/workflow`,
  permission: PERMISSIONS.WORKFLOW_READ,
});
const reportsItem = (rolePath) => ({
  title: "Reports",
  icon: BarChart3,
  path: `/${rolePath}/reports`,
  permission: PERMISSIONS.REPORTS_READ,
});
const archiveItem = (rolePath) => ({
  title: "Archive",
  icon: ArchiveIcon,
  path: `/${rolePath}/archive`,
  permission: PERMISSIONS.ARCHIVE_READ,
});

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
    filesItem("admin"),
    workflowItem("admin"),
    archiveItem("admin"),
    notificationsItem("admin"),
    reportsItem("admin"),
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
    {
      title: "Workflow Templates",
      icon: Waypoints,
      path: "/admin/workflow-templates",
      permission: PERMISSIONS.WORKFLOW_TEMPLATES_READ,
    },
    { title: "Audit Logs", icon: FileClock, path: "/admin/audit-logs" },
    { title: "System Settings", icon: Settings, path: "/admin/settings" },
  ],

  // Director sits above HOD in the routing chain and now holds the same
  // workflow-assignee permissions (see server/prisma/seeds/seedRolePermissions.js) --
  // reviews/routes files but never registers one, so no Files/new access.
  [ROLES.DIRECTOR]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/director" },
    filesItem("director"),
    workflowItem("director"),
    notificationsItem("director"),
    reportsItem("director"),
  ],
  [ROLES.HOD]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/hod" },
    filesItem("hod"),
    workflowItem("hod"),
    notificationsItem("hod"),
    reportsItem("hod"),
    {
      title: "Users",
      icon: Users,
      path: "/hod/users",
      permission: PERMISSIONS.USERS_READ,
    },
  ],
  // Registry is the only non-admin role that also holds FILES.REGISTER --
  // "Register File" isn't a separate item here: it's a button on the
  // Files page (/registry/files/new).
  [ROLES.REGISTRY]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/registry" },
    filesItem("registry"),
    workflowItem("registry"),
    notificationsItem("registry"),
    reportsItem("registry"),
  ],
  [ROLES.SUPERVISOR]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/supervisor" },
    filesItem("supervisor"),
    workflowItem("supervisor"),
    notificationsItem("supervisor"),
    reportsItem("supervisor"),
    {
      title: "Users",
      icon: Users,
      path: "/supervisor/users",
      permission: PERMISSIONS.USERS_READ,
    },
  ],
  [ROLES.OFFICER]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/officer" },
    filesItem("officer"),
    workflowItem("officer"),
    notificationsItem("officer"),
    reportsItem("officer"),
  ],
  // Archive Officer holds ARCHIVE.MANAGE + read-only FILES.READ (to find
  // candidates) but no WORKFLOW.* or REPORTS.READ -- deliberate scope in
  // the backend seed, so no My Workflow or Reports item for this role.
  [ROLES.ARCHIVE]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/archive" },
    filesItem("archive"),
    archiveItem("archive"),
    notificationsItem("archive"),
  ],
  // No File Management permissions granted to ICT_ADMIN yet (a pre-existing
  // gap outside this module's scope) -- stays Dashboard-only for now.
  [ROLES.ICT_ADMIN]: [
    { title: "Dashboard", icon: LayoutDashboard, path: "/ict-admin" },
  ],
};
