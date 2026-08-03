import { Eye, FileText } from "lucide-react";
import { formatDateTime } from "../../utils/formatters";
import { getFileStatusMeta, getFilePriorityMeta } from "../../utils/fileStatusMeta";
import RowActionsMenu from "../shared/RowActionsMenu";

/**
 * `id` on the sortable columns must exactly match the `sortBy` values
 * server/validators/file.validation.js accepts (fileNumber, registryNumber,
 * trackingNumber, title, createdAt, priority, status, dueDate) -- the Files
 * list page forwards the active sort column's id straight through as the
 * API's sortBy param. Shared across every role's Files page (Registry today,
 * HOD/Officer/etc. later), same as components/departments/ is shared across
 * admin pages.
 *
 * A factory rather than a static array -- "View Details" links to
 * `${basePath}/:id`, and each role owns a different top-level branch
 * (/registry/files/:id, /hod/files/:id, ...), so the column set itself
 * can't be one constant shared byte-for-byte across roles.
 */
export const buildFileTableColumns = (basePath) => [
  {
    id: "title",
    accessorKey: "title",
    header: "File",
    cell: ({ row }) => {
      const file = row.original;
      return (
        <div className="flex items-center gap-3 min-w-64">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
            <FileText size={16} />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{file.title}</p>
            <p className="text-xs text-gray-500 truncate">{file.fileNumber}</p>
          </div>
        </div>
      );
    },
  },
  {
    id: "category",
    accessorKey: "category",
    header: "Category",
    enableSorting: false,
    cell: ({ getValue }) => <span className="text-gray-700">{getValue()?.name ?? "—"}</span>,
  },
  {
    id: "department",
    accessorKey: "department",
    header: "Department",
    enableSorting: false,
    cell: ({ getValue }) => <span className="text-gray-700">{getValue()?.name ?? "—"}</span>,
  },
  {
    id: "priority",
    accessorKey: "priority",
    header: "Priority",
    cell: ({ getValue }) => {
      const priority = getFilePriorityMeta(getValue());
      return (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priority.badgeClass}`}>
          {priority.label}
        </span>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getFileStatusMeta(getValue());
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.badgeClass}`}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
          {status.label}
        </span>
      );
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Registered",
    cell: ({ getValue }) => <span className="text-gray-600">{formatDateTime(getValue())}</span>,
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const file = row.original;

      return (
        <div className="flex justify-end">
          <RowActionsMenu
            label={`Actions for ${file.fileNumber}`}
            actions={[{ label: "View Details", icon: Eye, to: `${basePath}/${file.id}` }]}
          />
        </div>
      );
    },
  },
];
