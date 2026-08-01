import { Eye, Pencil, Building2, Boxes, Users, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { formatDateTime } from "../../utils/formatters";
import RowActionsMenu from "../shared/RowActionsMenu";

/**
 * `id` on the sortable columns (name, createdAt) must exactly match the
 * `sortBy` values server/validators/department.validation.js accepts --
 * AllDepartments.jsx forwards the active sort column's id straight through
 * as the API's sortBy param.
 */
export const departmentTableColumns = [
  {
    id: "name",
    accessorKey: "name",
    header: "Department",
    cell: ({ row }) => {
      const department = row.original;
      return (
        <div className="flex items-center gap-3 min-w-55">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
            <Building2 size={16} />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{department.name}</p>
            <p className="text-xs text-gray-500 truncate">{department.code}</p>
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
      <span className="text-gray-600 line-clamp-1 max-w-70">{getValue() || "—"}</span>
    ),
  },
  {
    id: "unitsCount",
    accessorKey: "unitsCount",
    header: "Units",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-1.5 text-gray-700">
        <Boxes size={14} className="text-gray-400" />
        {getValue()}
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
      const department = row.original;

      return (
        <div className="flex justify-end">
          <RowActionsMenu
            label={`Actions for ${department.name}`}
            actions={[
              { label: "View Details", icon: Eye, onClick: () => toast("Department detail view is coming soon.") },
              { label: "Edit Department", icon: Pencil, onClick: () => toast("Editing departments is coming soon.") },
              { type: "divider" },
              department.isActive
                ? {
                    label: "Deactivate",
                    icon: XCircle,
                    variant: "danger",
                    onClick: () => toast("Deactivating departments is coming soon."),
                  }
                : {
                    label: "Activate",
                    icon: CheckCircle2,
                    onClick: () => toast("Activating departments is coming soon."),
                  },
            ]}
          />
        </div>
      );
    },
  },
];
