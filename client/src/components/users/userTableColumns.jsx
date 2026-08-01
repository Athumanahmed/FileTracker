import { Eye, Pencil, UserCheck, UserX, Lock, LockOpen, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { getInitials, formatDateTime } from "../../utils/formatters";
import RowActionsMenu from "../shared/RowActionsMenu";

// Combines the two backend fields that together decide what "status" means
// to an admin: `isActive` (deactivated by an admin) takes precedence over
// the `status` enum (PENDING_ACTIVATION/ACTIVE/LOCKED/SUSPENDED/DISABLED/
// ARCHIVED) -- a deactivated account should always read as "Inactive"
// regardless of its underlying status value.
const STATUS_DISPLAY = {
  ACTIVE: { label: "Active", dotClass: "bg-green-500", textClass: "text-green-700" },
  LOCKED: { label: "Locked", dotClass: "bg-red-500", textClass: "text-red-700" },
  PENDING_ACTIVATION: { label: "Pending", dotClass: "bg-blue-400", textClass: "text-blue-700" },
  SUSPENDED: { label: "Suspended", dotClass: "bg-amber-500", textClass: "text-amber-700" },
  DISABLED: { label: "Disabled", dotClass: "bg-gray-400", textClass: "text-gray-600" },
  ARCHIVED: { label: "Archived", dotClass: "bg-gray-400", textClass: "text-gray-600" },
};

const getDisplayStatus = (user) => {
  if (!user.isActive) {
    return { label: "Inactive", dotClass: "bg-amber-500", textClass: "text-amber-700" };
  }
  return STATUS_DISPLAY[user.status] || { label: user.status, dotClass: "bg-gray-400", textClass: "text-gray-600" };
};

const ROLE_BADGE_CLASS =
  "inline-flex items-center rounded-full bg-primaryBlueLight px-2 py-0.5 text-[11px] font-semibold text-primaryBlue whitespace-nowrap";

/**
 * `id` on the sortable columns (fullName, lastLoginAt) must exactly match
 * the `sortBy` values server/validators/adminUserQuery.validation.js
 * accepts -- SystemUsers.jsx forwards the active sort column's id straight
 * through as the API's sortBy param.
 */
export const userTableColumns = [
  {
    id: "fullName",
    accessorKey: "fullName",
    header: "User",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3 min-w-50">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-xs font-bold text-primaryBlue">
            {getInitials(user.fullName || user.username)}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{user.fullName || user.username}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    id: "employeeNumber",
    accessorKey: "employeeNumber",
    header: "Employee ID",
    enableSorting: false,
    cell: ({ getValue }) => <span className="text-gray-600">{getValue() || "—"}</span>,
  },
  {
    id: "department",
    header: "Department / Unit",
    enableSorting: false,
    cell: ({ row }) => {
      const { department, unit } = row.original;
      return (
        <div>
          <p className="text-gray-800">{department?.name || "—"}</p>
          {unit?.name && <p className="text-xs text-gray-500">{unit.name}</p>}
        </div>
      );
    },
  },
  {
    id: "roles",
    header: "Roles",
    enableSorting: false,
    cell: ({ row }) => {
      const roles = row.original.roles || [];
      if (!roles.length) return <span className="text-gray-400">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <span key={role.id} className={ROLE_BADGE_CLASS}>
              {role.name}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => {
      const display = getDisplayStatus(row.original);
      return (
        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${display.textClass}`}>
          <span className={`h-2 w-2 rounded-full ${display.dotClass}`} />
          {display.label}
        </span>
      );
    },
  },
  {
    id: "lastLoginAt",
    accessorKey: "lastLoginAt",
    header: "Last Login",
    cell: ({ getValue }) => <span className="text-gray-600">{formatDateTime(getValue())}</span>,
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;
      const isLocked = user.status === "LOCKED";

      return (
        <div className="flex justify-end">
          <RowActionsMenu
            label={`Actions for ${user.fullName || user.username}`}
            actions={[
              { label: "View Details", icon: Eye, onClick: () => toast("User detail view is coming soon.") },
              { label: "Edit User", icon: Pencil, onClick: () => toast("Editing users is coming soon.") },
              { type: "divider" },
              user.isActive
                ? { label: "Deactivate", icon: UserX, onClick: () => toast("Deactivating users is coming soon.") }
                : { label: "Activate", icon: UserCheck, onClick: () => toast("Activating users is coming soon.") },
              isLocked
                ? { label: "Unlock Account", icon: LockOpen, onClick: () => toast("Unlocking accounts is coming soon.") }
                : { label: "Lock Account", icon: Lock, onClick: () => toast("Locking accounts is coming soon.") },
              { label: "Reset Password", icon: KeyRound, onClick: () => toast("Admin password reset is coming soon.") },
            ]}
          />
        </div>
      );
    },
  },
];
