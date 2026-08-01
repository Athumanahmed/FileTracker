import { Eye, Pencil, IdCard, Crown, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { formatDateTime } from "../../utils/formatters";
import RowActionsMenu from "../shared/RowActionsMenu";

const POSITION_TYPE_DISPLAY = {
  EXECUTIVE: { label: "Executive", className: "bg-purple-50 text-purple-700" },
  MANAGEMENT: { label: "Management", className: "bg-blue-50 text-blue-700" },
  SUPERVISORY: { label: "Supervisory", className: "bg-teal-50 text-teal-700" },
  OPERATIONAL: { label: "Operational", className: "bg-gray-100 text-gray-700" },
  SUPPORT: { label: "Support", className: "bg-amber-50 text-amber-700" },
};

/**
 * `id` on the sortable columns (title, rank, createdAt) must exactly match
 * the `sortBy` values server/validators/position.validation.js accepts --
 * AllPositions.jsx forwards the active sort column's id straight through
 * as the API's sortBy param.
 */
export const positionTableColumns = [
  {
    id: "title",
    accessorKey: "title",
    header: "Position",
    cell: ({ row }) => {
      const position = row.original;
      return (
        <div className="flex items-center gap-3 min-w-55">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
            <IdCard size={16} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-gray-900 truncate">{position.title}</p>
              {position.isHead && <Crown size={13} className="shrink-0 text-goldAccent" aria-label="Unit head" />}
            </div>
            <p className="text-xs text-gray-500 truncate">{position.code}</p>
          </div>
        </div>
      );
    },
  },
  {
    id: "department",
    header: "Department",
    enableSorting: false,
    cell: ({ row }) => <span className="text-gray-800">{row.original.unit?.department?.name || "—"}</span>,
  },
  {
    id: "unit",
    header: "Unit",
    enableSorting: false,
    cell: ({ row }) => <span className="text-gray-800">{row.original.unit?.name || "—"}</span>,
  },
  {
    id: "positionType",
    accessorKey: "positionType",
    header: "Type",
    enableSorting: false,
    cell: ({ getValue }) => {
      const display = POSITION_TYPE_DISPLAY[getValue()] || { label: getValue(), className: "bg-gray-100 text-gray-700" };
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${display.className}`}>
          {display.label}
        </span>
      );
    },
  },
  {
    id: "assignment",
    header: "Assignment",
    enableSorting: false,
    cell: ({ row }) => {
      const position = row.original;
      if (!position.isActive) return <span className="text-gray-400">—</span>;
      return position.isVacant ? (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Vacant
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Filled
        </span>
      );
    },
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
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500">
          <span className="h-2 w-2 rounded-full bg-gray-400" />
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
      const position = row.original;

      return (
        <div className="flex justify-end">
          <RowActionsMenu
            label={`Actions for ${position.title}`}
            actions={[
              { label: "View Details", icon: Eye, onClick: () => toast("Position detail view is coming soon.") },
              { label: "Edit Position", icon: Pencil, onClick: () => toast("Editing positions is coming soon.") },
              { type: "divider" },
              position.isActive
                ? {
                    label: "Deactivate",
                    icon: XCircle,
                    variant: "danger",
                    onClick: () => toast("Deactivating positions is coming soon."),
                  }
                : {
                    label: "Activate",
                    icon: CheckCircle2,
                    onClick: () => toast("Activating positions is coming soon."),
                  },
            ]}
          />
        </div>
      );
    },
  },
];
