import { Eye, PlayCircle, Clock, AlarmClockOff } from "lucide-react";
import { formatDateTime, daysSince } from "../../utils/formatters";
import { getFileStatusMeta, getFilePriorityMeta } from "../../utils/fileStatusMeta";
import RowActionsMenu from "../shared/RowActionsMenu";

// Plain (lowercase) render helpers, not components -- this module's real
// exports are the column-builder functions below, and mixing those with
// actual component exports breaks Fast Refresh.
const renderFileCell = (file) => (
  <div className="min-w-56">
    <p className="font-medium text-gray-900 truncate">{file.title}</p>
    <p className="text-xs text-gray-500 truncate">{file.fileNumber}</p>
  </div>
);

const renderPriorityBadge = (priority) => {
  const meta = getFilePriorityMeta(priority);
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badgeClass}`}>{meta.label}</span>;
};

/**
 * All three factories take `basePath` (e.g. "/registry") so the same
 * column set works for any role's Workflow page once one exists -- only
 * the route prefix differs, same convention as fileTableColumns.jsx.
 */

/** Files registered but not yet routed into a workflow (status REGISTERED). */
export const buildNeedsRoutingColumns = (basePath) => [
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
    id: "priority",
    accessorKey: "priority",
    header: "Priority",
    cell: ({ getValue }) => renderPriorityBadge(getValue()),
  },
  {
    id: "waiting",
    accessorKey: "createdAt",
    header: "Waiting Since",
    cell: ({ getValue }) => {
      const days = daysSince(getValue());
      return (
        <span className={`inline-flex items-center gap-1.5 text-sm ${days >= 2 ? "text-amber-700 font-medium" : "text-gray-600"}`}>
          <Clock size={13} />
          {days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"}`}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowActionsMenu
          label={`Actions for ${row.original.fileNumber}`}
          actions={[
            { label: "Start Workflow", icon: PlayCircle, to: `${basePath}/files/${row.original.id}`, state: { initialTab: "workflow" } },
            { label: "View Details", icon: Eye, to: `${basePath}/files/${row.original.id}` },
          ]}
        />
      </div>
    ),
  },
];

/** Files currently assigned to the viewer -- plain file rows (GET /files?assignedToId=me). */
export const buildMyAssignmentsColumns = (basePath) => [
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
    id: "priority",
    accessorKey: "priority",
    header: "Priority",
    cell: ({ getValue }) => renderPriorityBadge(getValue()),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowActionsMenu
          label={`Actions for ${row.original.fileNumber}`}
          actions={[{ label: "Take Action", icon: Eye, to: `${basePath}/files/${row.original.id}`, state: { initialTab: "workflow" } }]}
        />
      </div>
    ),
  },
];

/** Org-wide assignments already past their SLA due date -- rows are { ...assignment, file }, not plain files. */
export const buildOverdueColumns = (basePath) => [
  {
    id: "title",
    header: "File",
    cell: ({ row }) => renderFileCell(row.original.file),
  },
  {
    id: "heldBy",
    header: "Held By",
    cell: ({ row }) => {
      const a = row.original;
      return a.assignedTo ? (
        <span className="text-gray-700">{a.assignedTo.fullName}</span>
      ) : (
        <span className="text-amber-600 font-medium">Unclaimed — {a.assignedDepartment?.name ?? "—"}</span>
      );
    },
  },
  {
    id: "step",
    header: "Step",
    cell: ({ row }) => <span className="text-gray-600">{row.original.workflowStep?.name ?? "—"}</span>,
  },
  {
    id: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      const days = daysSince(row.original.dueDate);
      return (
        <div>
          <p className="text-gray-700">{formatDateTime(row.original.dueDate)}</p>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 mt-0.5">
            <AlarmClockOff size={12} />
            {days} day{days === 1 ? "" : "s"} overdue
          </p>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowActionsMenu
          label={`Actions for ${row.original.file.fileNumber}`}
          actions={[{ label: "View Details", icon: Eye, to: `${basePath}/files/${row.original.file.id}`, state: { initialTab: "workflow" } }]}
        />
      </div>
    ),
  },
];
