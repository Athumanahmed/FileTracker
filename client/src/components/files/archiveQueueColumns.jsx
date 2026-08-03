import { Eye, Archive as ArchiveIcon, AlarmClockOff, MapPin } from "lucide-react";
import { formatDateTime } from "../../utils/formatters";
import { getFileStatusMeta } from "../../utils/fileStatusMeta";
import RowActionsMenu from "../shared/RowActionsMenu";

const renderFileCell = (file) => (
  <div className="min-w-56">
    <p className="font-medium text-gray-900 truncate">{file.title}</p>
    <p className="text-xs text-gray-500 truncate">{file.fileNumber}</p>
  </div>
);

/** Plain file rows (GET /files?status=COMPLETED|REJECTED|CLOSED) -- onArchive opens the parent page's ArchiveFileModal for that row. */
export const buildReadyToArchiveColumns = (basePath, onArchive) => [
  {
    id: "title",
    header: "File",
    cell: ({ row }) => renderFileCell(row.original),
  },
  {
    id: "department",
    accessorKey: "department",
    header: "Department",
    cell: ({ getValue }) => <span className="text-gray-700">{getValue()?.name ?? "—"}</span>,
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
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ getValue }) => <span className="text-gray-600">{formatDateTime(getValue())}</span>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onArchive(row.original)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArchiveIcon size={13} />
          Archive
        </button>
        <RowActionsMenu
          label={`Actions for ${row.original.fileNumber}`}
          actions={[{ label: "View Details", icon: Eye, to: `${basePath}/files/${row.original.id}` }]}
        />
      </div>
    ),
  },
];

/** Plain file rows (GET /files?status=ARCHIVED). Restore lives on the file's own detail page, not inline here -- it deserves the full context, not a dense-list click. */
export const buildArchivedColumns = (basePath) => [
  {
    id: "title",
    header: "File",
    cell: ({ row }) => renderFileCell(row.original),
  },
  {
    id: "category",
    accessorKey: "category",
    header: "Category",
    cell: ({ getValue }) => <span className="text-gray-700">{getValue()?.name ?? "—"}</span>,
  },
  {
    id: "department",
    accessorKey: "department",
    header: "Department",
    cell: ({ getValue }) => <span className="text-gray-700">{getValue()?.name ?? "—"}</span>,
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: "Archived",
    cell: ({ getValue }) => <span className="text-gray-600">{formatDateTime(getValue())}</span>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowActionsMenu
          label={`Actions for ${row.original.fileNumber}`}
          actions={[{ label: "View Details", icon: Eye, to: `${basePath}/files/${row.original.id}` }]}
        />
      </div>
    ),
  },
];

/** Rows are { ...archiveRecord, file } from GET /archive/expired-retention. */
export const buildExpiredRetentionColumns = (basePath) => [
  {
    id: "title",
    header: "File",
    cell: ({ row }) => renderFileCell(row.original.file),
  },
  {
    id: "retentionExpiresAt",
    header: "Retention Expired",
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
        <AlarmClockOff size={13} />
        {formatDateTime(row.original.retentionExpiresAt)}
      </span>
    ),
  },
  {
    id: "storageLocation",
    header: "Storage Location",
    cell: ({ row }) =>
      row.original.storageLocation ? (
        <span className="inline-flex items-center gap-1.5 text-gray-600">
          <MapPin size={13} className="text-gray-400" />
          {row.original.storageLocation}
        </span>
      ) : (
        <span className="text-gray-400">—</span>
      ),
  },
  {
    id: "archivedBy",
    header: "Archived By",
    cell: ({ row }) => <span className="text-gray-600">{row.original.archivedBy?.fullName ?? "—"}</span>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowActionsMenu
          label={`Actions for ${row.original.file.fileNumber}`}
          actions={[{ label: "View Details", icon: Eye, to: `${basePath}/files/${row.original.file.id}` }]}
        />
      </div>
    ),
  },
];
