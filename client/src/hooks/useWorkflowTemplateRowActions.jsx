import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { createWorkflowTemplateTableColumns } from "../components/workflowTemplates/workflowTemplateTableColumns";
import EditWorkflowTemplateModal from "../components/workflowTemplates/EditWorkflowTemplateModal";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { deactivateWorkflowTemplate, reactivateWorkflowTemplate, updateWorkflowTemplate } from "../utils/apiServices";
import { useUpdateOrgEntity } from "./useUpdateOrgEntity";
import { useOrgEntityStatusAction } from "./useOrgEntityStatusAction";
import useAuthStore from "../store/authStore";
import { PERMISSIONS } from "../utils/permissions";

const INVALIDATE_KEYS = ["admin-workflow-templates-list", "admin-workflow-template", "workflow-templates-list"];

/**
 * Everything the Workflow Templates directory's row actions need -- Edit
 * details and Deactivate/Reactivate modal state + mutations, plus the
 * `columns` array wired to all of it. "View & Configure Steps" is a plain
 * link to the detail page, so it needs no state here. Mirrors
 * useDepartmentRowActions.
 */
export const useWorkflowTemplateRowActions = (basePath) => {
  const perms = useAuthStore((state) => state.user?.permissions);
  const canEdit = Boolean(perms?.includes(PERMISSIONS.WORKFLOW_TEMPLATES_UPDATE));
  const canManageStatus =
    Boolean(perms?.includes(PERMISSIONS.WORKFLOW_TEMPLATES_DELETE)) &&
    Boolean(perms?.includes(PERMISSIONS.WORKFLOW_TEMPLATES_UPDATE));

  const [editEntity, setEditEntity] = useState(null);
  const [confirmEntity, setConfirmEntity] = useState(null);

  const updateMutation = useUpdateOrgEntity({ updateFn: updateWorkflowTemplate, invalidateKeys: INVALIDATE_KEYS });
  const deactivateMutation = useOrgEntityStatusAction({ actionFn: deactivateWorkflowTemplate, invalidateKeys: INVALIDATE_KEYS });
  const reactivateMutation = useOrgEntityStatusAction({ actionFn: reactivateWorkflowTemplate, invalidateKeys: INVALIDATE_KEYS });

  const onEdit = useCallback((entity) => setEditEntity(entity), []);
  const onToggleActive = useCallback((entity) => setConfirmEntity(entity), []);

  const columns = useMemo(
    () => createWorkflowTemplateTableColumns({ basePath, onEdit, onToggleActive, canEdit, canManageStatus }),
    [basePath, onEdit, onToggleActive, canEdit, canManageStatus],
  );

  const willDeactivate = confirmEntity?.isActive;
  const statusMutation = willDeactivate ? deactivateMutation : reactivateMutation;

  const runConfirmedAction = () => {
    if (!confirmEntity) return;
    statusMutation.mutate(confirmEntity.id, {
      onSuccess: () => {
        toast.success(`Template "${confirmEntity.name}" was ${willDeactivate ? "deactivated" : "reactivated"}.`);
        setConfirmEntity(null);
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || "Unable to complete this action. Please try again.");
      },
    });
  };

  const modals = (
    <>
      <EditWorkflowTemplateModal
        entity={editEntity}
        isOpen={Boolean(editEntity)}
        onClose={() => setEditEntity(null)}
        mutation={updateMutation}
      />
      <ConfirmDialog
        isOpen={Boolean(confirmEntity)}
        onClose={() => setConfirmEntity(null)}
        onConfirm={runConfirmedAction}
        isPending={statusMutation.isPending}
        title={willDeactivate ? "Deactivate Workflow Template" : "Reactivate Workflow Template"}
        description={
          confirmEntity
            ? willDeactivate
              ? `"${confirmEntity.name}" will no longer be selectable when routing a file into a workflow. Files already running on it are unaffected.`
              : `"${confirmEntity.name}" will be selectable again when starting a workflow.`
            : undefined
        }
        confirmLabel={willDeactivate ? "Deactivate" : "Reactivate"}
        icon={willDeactivate ? XCircle : CheckCircle2}
        tone={willDeactivate ? "danger" : "primary"}
      />
    </>
  );

  return { columns, modals };
};
