import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { createPermissionTableColumns } from "../components/permissions/permissionTableColumns";
import EditPermissionModal from "../components/permissions/EditPermissionModal";
import EntityDetailModal from "../components/shared/EntityDetailModal";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { formatDateTime } from "../utils/formatters";
import { MODULE_LABELS } from "../utils/permissionModules";
import { deactivatePermission, reactivatePermission, updatePermission } from "../utils/apiServices";
import { useUpdateOrgEntity } from "./useUpdateOrgEntity";
import { useOrgEntityStatusAction } from "./useOrgEntityStatusAction";
import useAuthStore from "../store/authStore";
import { PERMISSIONS } from "../utils/permissions";

// A permission's active state gates authorize() system-wide, so a change
// can ripple into the Role Permissions matrix and role grant counts.
const INVALIDATE_KEYS = [
  "admin-permissions-list",
  "admin-permission-stats",
  "permissions-lookup",
  "admin-roles-list",
  "admin-role-stats",
];

/** Row actions for the Permissions directory -- View / Edit / Deactivate-Reactivate. Mirrors useDepartmentRowActions. */
export const usePermissionRowActions = () => {
  const perms = useAuthStore((state) => state.user?.permissions);
  const canEdit = Boolean(perms?.includes(PERMISSIONS.PERMISSIONS_UPDATE));
  const canManageStatus =
    Boolean(perms?.includes(PERMISSIONS.PERMISSIONS_DELETE)) &&
    Boolean(perms?.includes(PERMISSIONS.PERMISSIONS_UPDATE));

  const [viewEntity, setViewEntity] = useState(null);
  const [editEntity, setEditEntity] = useState(null);
  const [confirmEntity, setConfirmEntity] = useState(null);

  const updateMutation = useUpdateOrgEntity({
    updateFn: updatePermission,
    invalidateKeys: INVALIDATE_KEYS,
  });
  const deactivateMutation = useOrgEntityStatusAction({
    actionFn: deactivatePermission,
    invalidateKeys: INVALIDATE_KEYS,
  });
  const reactivateMutation = useOrgEntityStatusAction({
    actionFn: reactivatePermission,
    invalidateKeys: INVALIDATE_KEYS,
  });

  const onView = useCallback((entity) => setViewEntity(entity), []);
  const onEdit = useCallback((entity) => setEditEntity(entity), []);
  const onToggleActive = useCallback((entity) => setConfirmEntity(entity), []);

  const columns = useMemo(
    () => createPermissionTableColumns({ onView, onEdit, onToggleActive, canEdit, canManageStatus }),
    [onView, onEdit, onToggleActive, canEdit, canManageStatus],
  );

  const willDeactivate = confirmEntity?.isActive;
  const statusMutation = willDeactivate ? deactivateMutation : reactivateMutation;

  const runConfirmedAction = () => {
    if (!confirmEntity) return;
    statusMutation.mutate(confirmEntity.id, {
      onSuccess: () => {
        toast.success(
          `Permission "${confirmEntity.name}" was ${willDeactivate ? "deactivated" : "reactivated"}.`,
        );
        setConfirmEntity(null);
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || "Unable to complete this action. Please try again.");
      },
    });
  };

  const modals = (
    <>
      <EntityDetailModal
        isOpen={Boolean(viewEntity)}
        onClose={() => setViewEntity(null)}
        title={viewEntity?.name}
        description="Permission details"
        icon={KeyRound}
        isActive={viewEntity?.isActive}
        fields={
          viewEntity
            ? [
                { label: "Code", value: viewEntity.code, mono: true },
                { label: "Module", value: MODULE_LABELS[viewEntity.module] || viewEntity.module },
                { label: "Description", value: viewEntity.description },
                { label: "Granted to Roles", value: viewEntity.rolesCount },
                { label: "Created", value: formatDateTime(viewEntity.createdAt) },
                { label: "Last Updated", value: formatDateTime(viewEntity.updatedAt) },
              ]
            : []
        }
      />
      <EditPermissionModal
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
        title={willDeactivate ? "Deactivate Permission" : "Reactivate Permission"}
        description={
          confirmEntity
            ? willDeactivate
              ? `"${confirmEntity.name}" acts as a system-wide kill switch -- while inactive, every authorize("${confirmEntity.code}") check fails for all roles that hold it.`
              : `"${confirmEntity.name}" will be enforced again for every role that holds it.`
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
