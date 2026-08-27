import { Eye, Pencil, KeyRound, Link2, CheckCircle2, XCircle } from "lucide-react";
import { formatDateTime } from "../../utils/formatters";
import { MODULE_LABELS, MODULE_BADGE_CLASSES } from "../../utils/permissionModules";
import RowActionsMenu from "../shared/RowActionsMenu";

/**
 * `id` on the sortable columns (name, code, module, createdAt) must
 * exactly match the `sortBy` values server/validators/permission.validation.js
 * accepts -- AllPermissions.jsx forwards the active sort column's id
 * straight through as the API's sortBy param.
 *
 * A factory (not a static array) -- the actions column's handlers are owned
 * by usePermissionRowActions. `canEdit` gates Edit on PERMISSIONS.UPDATE;
 * `canManageStatus` gates Deactivate/Reactivate on PERMISSIONS.DELETE /
 * PERMISSIONS.UPDATE.
 */
export const createPermissionTableColumns = ({
  onView,
  onEdit,
  onToggleActive,
  canEdit = false,
  canManageStatus = false,
}) => [
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
      const label = MODULE_LABELS[getValue()] || getValue();
      const className = MODULE_BADGE_CLASSES[getValue()] || "bg-gray-100 text-gray-700";
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${className}`}
        >
          {label}
        </span>
      );
    },
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
              { label: "View Details", icon: Eye, onClick: () => onView(permission) },
              ...(canEdit
                ? [{ label: "Edit Permission", icon: Pencil, onClick: () => onEdit(permission) }]
                : []),
              ...(canManageStatus
                ? [
                    { type: "divider" },
                    permission.isActive
                      ? {
                          label: "Deactivate",
                          icon: XCircle,
                          variant: "danger",
                          onClick: () => onToggleActive(permission),
                        }
                      : {
                          label: "Activate",
                          icon: CheckCircle2,
                          onClick: () => onToggleActive(permission),
                        },
                  ]
                : []),
            ]}
          />
        </div>
      );
    },
  },
];
