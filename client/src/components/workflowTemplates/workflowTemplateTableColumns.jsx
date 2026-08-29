import { Eye, Pencil, Workflow, ListOrdered, FolderClock, CheckCircle2, XCircle } from "lucide-react";
import { formatDateTime } from "../../utils/formatters";
import RowActionsMenu from "../shared/RowActionsMenu";

/**
 * `id` on the sortable columns (name, code, createdAt) must exactly match
 * the `sortBy` values server/validators/workflowTemplate.validation.js
 * accepts -- AllWorkflowTemplates.jsx forwards the active sort column's id
 * straight through as the API's sortBy param.
 *
 * A factory (not a static array) because the actions column's handlers are
 * owned by useWorkflowTemplateRowActions (modal state + mutations). `canEdit`
 * gates Edit on WORKFLOW_TEMPLATES.UPDATE; `canManageStatus` gates
 * Deactivate/Reactivate on WORKFLOW_TEMPLATES.DELETE / .UPDATE.
 */
export const createWorkflowTemplateTableColumns = ({
  basePath,
  onEdit,
  onToggleActive,
  canEdit = false,
  canManageStatus = false,
}) => [
  {
    id: "name",
    accessorKey: "name",
    header: "Template",
    cell: ({ row }) => {
      const template = row.original;
      return (
        <div className="flex items-center gap-3 min-w-55">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
            <Workflow size={16} />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{template.name}</p>
            <p className="text-xs text-gray-500 truncate font-mono">{template.code}</p>
          </div>
        </div>
      );
    },
  },
  {
    id: "stepsCount",
    accessorKey: "stepsCount",
    header: "Steps",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-1.5 text-gray-700">
        <ListOrdered size={14} className="text-gray-400" />
        {getValue() ?? 0}
      </span>
    ),
  },
  {
    id: "instancesCount",
    accessorKey: "instancesCount",
    header: "In Use",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-1.5 text-gray-700">
        <FolderClock size={14} className="text-gray-400" />
        {getValue() ?? 0}
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
      const template = row.original;
      return (
        <div className="flex justify-end">
          <RowActionsMenu
            label={`Actions for ${template.name}`}
            actions={[
              { label: "View & Configure Steps", icon: Eye, to: `${basePath}/workflow-templates/${template.id}` },
              ...(canEdit
                ? [{ label: "Edit Details", icon: Pencil, onClick: () => onEdit(template) }]
                : []),
              ...(canManageStatus
                ? [
                    { type: "divider" },
                    template.isActive
                      ? {
                          label: "Deactivate",
                          icon: XCircle,
                          variant: "danger",
                          onClick: () => onToggleActive(template),
                        }
                      : {
                          label: "Activate",
                          icon: CheckCircle2,
                          onClick: () => onToggleActive(template),
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
