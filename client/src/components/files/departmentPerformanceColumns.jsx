import { Building2, AlertTriangle } from "lucide-react";

export const departmentPerformanceColumns = [
  {
    id: "department",
    accessorFn: (row) => row.department?.name,
    header: "Department",
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5 min-w-40">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
          <Building2 size={14} />
        </span>
        <span className="font-medium text-gray-900">{row.original.department?.name ?? "—"}</span>
      </div>
    ),
  },
  {
    id: "totalFiles",
    accessorKey: "totalFiles",
    header: "Total Files",
    cell: ({ getValue }) => <span className="font-semibold text-gray-900">{getValue()}</span>,
  },
  {
    id: "pending",
    accessorKey: "pending",
    header: "Pending",
    cell: ({ getValue }) => <span className="text-amber-700">{getValue()}</span>,
  },
  {
    id: "completed",
    accessorKey: "completed",
    header: "Completed",
    cell: ({ getValue }) => <span className="text-green-700">{getValue()}</span>,
  },
  {
    id: "overdue",
    accessorKey: "overdue",
    header: "Overdue",
    cell: ({ getValue }) =>
      getValue() > 0 ? (
        <span className="inline-flex items-center gap-1.5 font-medium text-red-600">
          <AlertTriangle size={13} />
          {getValue()}
        </span>
      ) : (
        <span className="text-gray-400">0</span>
      ),
  },
  {
    id: "avgProcessingDays",
    accessorKey: "avgProcessingDays",
    header: "Avg. Processing",
    cell: ({ getValue }) => <span className="text-gray-600">{getValue() != null ? `${getValue()} days` : "—"}</span>,
  },
];
