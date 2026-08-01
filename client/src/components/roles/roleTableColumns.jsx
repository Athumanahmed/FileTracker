import {
  Eye,
  Pencil,
  ShieldCheck,
  Users,
  KeyRound,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDateTime } from "../../utils/formatters";
import RowActionsMenu from "../shared/RowActionsMenu";

/**
 * `id` on the sortable columns (name, createdAt) must exactly match the
 * `sortBy` values server/validators/role.validation.js accepts --
 * AllRoles.jsx forwards the active sort column's id straight through as
 * the API's sortBy param.
 */
export const roleTableColumns = [
  {
    id: "name",
    accessorKey: "name",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original;
      return (
        <div className="flex items-center gap-3 min-w-55">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
            <ShieldCheck size={16} />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{role.name}</p>
            <p className="text-xs text-gray-500 truncate">{role.code}</p>
          </div>
        </div>
      );
    },
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="text-gray-600 line-clamp-1 max-w-70">
        {getValue() || "—"}
      </span>
    ),
  },
  {
    id: "isSystem",
    accessorKey: "isSystem",
    header: "Type",
    enableSorting: false,
    cell: ({ getValue }) =>
      getValue() ? (
        <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 whitespace-nowrap">
          System
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 whitespace-nowrap">
          Custom
        </span>
      ),
  },
  {
    id: "usersCount",
    accessorKey: "usersCount",
    header: "Users",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-1.5 text-gray-700">
        <Users size={14} className="text-gray-400" />
        {getValue()}
      </span>
    ),
  },
  {
    id: "permissionsCount",
    accessorKey: "permissionsCount",
    header: "Permissions",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-1.5 text-gray-700">
        <KeyRound size={14} className="text-gray-400" />
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
    cell: ({ getValue }) => (
      <span className="text-gray-600">{formatDateTime(getValue())}</span>
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const role = row.original;

      return (
        <div className="flex justify-end">
          <RowActionsMenu
            label={`Actions for ${role.name}`}
            actions={[
              {
                label: "View Details",
                icon: Eye,
                onClick: () => toast("Role detail view is coming soon."),
              },
              {
                label: "Edit Role",
                icon: Pencil,
                onClick: () => toast("Editing roles is coming soon."),
              },
              // System roles can never be deactivated (see role.service.js's
              // deactivateRole) -- omitting the action entirely is clearer
              // than showing one that will always 409.
              ...(role.isSystem
                ? []
                : [
                    { type: "divider" },
                    role.isActive
                      ? {
                          label: "Deactivate",
                          icon: XCircle,
                          variant: "danger",
                          onClick: () =>
                            toast("Deactivating roles is coming soon."),
                        }
                      : {
                          label: "Activate",
                          icon: CheckCircle2,
                          onClick: () =>
                            toast("Activating roles is coming soon."),
                        },
                  ]),
            ]}
          />
        </div>
      );
    },
  },
];
