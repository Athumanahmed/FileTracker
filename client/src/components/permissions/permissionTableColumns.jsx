import { Eye, Pencil, KeyRound, Link2, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { formatDateTime } from "../../utils/formatters";
import RowActionsMenu from "../shared/RowActionsMenu";

const MODULE_DISPLAY = {
  AUTHENTICATION: { label: "Authentication", className: "bg-blue-50 text-blue-700" },
  AUTHORIZATION: { label: "Authorization", className: "bg-indigo-50 text-indigo-700" },
  USERS: { label: "Users", className: "bg-primaryBlueLight text-primaryBlue" },
  DEPARTMENTS: { label: "Departments", className: "bg-teal-50 text-teal-700" },
  UNITS: { label: "Units", className: "bg-cyan-50 text-cyan-700" },
  POSITIONS: { label: "Positions", className: "bg-purple-50 text-purple-700" },
  FILE_TRACKING: { label: "File Tracking", className: "bg-amber-50 text-amber-700" },
  WORKFLOW: { label: "Workflow", className: "bg-pink-50 text-pink-700" },
  REPORTS: { label: "Reports", className: "bg-green-50 text-green-700" },
  SETTINGS: { label: "Settings", className: "bg-gray-100 text-gray-700" },
  DASHBOARD: { label: "Dashboard", className: "bg-rose-50 text-rose-700" },
};

/**
 * `id` on the sortable columns (name, code, module, createdAt) must
 * exactly match the `sortBy` values server/validators/permission.validation.js
 * accepts -- AllPermissions.jsx forwards the active sort column's id
 * straight through as the API's sortBy param.
 */
export const permissionTableColumns = [
  {
    id: "name",
    accessorKey: "name",
    header: "Permission",
    cell: ({ row }) => {
      const permission = row.original;
      return (
        <div className="flex items-center gap-3 min-w-60">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
            <KeyRound size={16} />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{permission.name}</p>
            <p className="text-xs text-gray-500 truncate">{permission.code}</p>
          </div>
        </div>
      );
    },
  },
  {
    id: "module",
    accessorKey: "module",
    header: "Module",
    cell: ({ getValue }) => {
      const display = MODULE_DISPLAY[getValue()] || { label: getValue(), className: "bg-gray-100 text-gray-700" };
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${display.className}`}>
          {display.label}
        </span>
      );
    },
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="text-gray-600 line-clamp-1 max-w-70">{getValue() || "—"}</span>
    ),
  },
  {
    id: "rolesCount",
    accessorKey: "rolesCount",
    header: "Roles",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-1.5 text-gray-700">
        <Link2 size={14} className="text-gray-400" />
        {getValue()}
      </span>
    ),
  },
  {
    id: "isActive",
    accessorKey: "isActive",
    header: "Status",
    enableSorting: false,
    cell: ({ getValue }) =>
      getValue() ? (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Inactive
        </span>
      ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => <span className="text-gray-600">{formatDateTime(getValue())}</span>,
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const permission = row.original;

      return (
        <div className="flex justify-end">
          <RowActionsMenu
            label={`Actions for ${permission.name}`}
            actions={[
              { label: "View Details", icon: Eye, onClick: () => toast("Permission detail view is coming soon.") },
              { label: "Edit Permission", icon: Pencil, onClick: () => toast("Editing permissions is coming soon.") },
              { type: "divider" },
              permission.isActive
                ? {
                    label: "Deactivate",
                    icon: XCircle,
                    variant: "danger",
                    onClick: () => toast("Deactivating permissions is coming soon."),
                  }
                : {
                    label: "Activate",
                    icon: CheckCircle2,
                    onClick: () => toast("Activating permissions is coming soon."),
                  },
            ]}
          />
        </div>
      );
    },
  },
];
