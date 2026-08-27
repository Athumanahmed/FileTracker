import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { createRoleTableColumns } from "../components/roles/roleTableColumns";
import EditRoleModal from "../components/roles/EditRoleModal";
import EntityDetailModal from "../components/shared/EntityDetailModal";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { formatDateTime } from "../utils/formatters";
import { deactivateRole, reactivateRole, updateRole } from "../utils/apiServices";
import { useUpdateOrgEntity } from "./useUpdateOrgEntity";
import { useOrgEntityStatusAction } from "./useOrgEntityStatusAction";
import useAuthStore from "../store/authStore";
import { PERMISSIONS } from "../utils/permissions";

// Roles carry permission grants, so a change to a role's active state or
// details can ripple into Role Permissions -- refresh those lists too.
const INVALIDATE_KEYS = [
  "admin-roles-list",
  "admin-role-stats",
  "roles",
  "admin-permissions-list",
  "admin-permission-stats",
];

/** Row actions for the Roles directory -- View / Edit / Deactivate-Reactivate. Mirrors useDepartmentRowActions. */
export const useRoleRowActions = () => {
  const perms = useAuthStore((state) => state.user?.permissions);
  const canEdit = Boolean(perms?.includes(PERMISSIONS.ROLES_UPDATE));
  const canManageStatus =
    Boolean(perms?.includes(PERMISSIONS.ROLES_DELETE)) &&
    Boolean(perms?.includes(PERMISSIONS.ROLES_UPDATE));

  const [viewEntity, setViewEntity] = useState(null);
  const [editEntity, setEditEntity] = useState(null);
  const [confirmEntity, setConfirmEntity] = useState(null);

  const updateMutation = useUpdateOrgEntity({ updateFn: updateRole, invalidateKeys: INVALIDATE_KEYS });
  const deactivateMutation = useOrgEntityStatusAction({
    actionFn: deactivateRole,
    invalidateKeys: INVALIDATE_KEYS,
  });
  const reactivateMutation = useOrgEntityStatusAction({
    actionFn: reactivateRole,
    invalidateKeys: INVALIDATE_KEYS,
  });

  const onView = useCallback((entity) => setViewEntity(entity), []);
  const onEdit = useCallback((entity) => setEditEntity(entity), []);
  const onToggleActive = useCallback((entity) => setConfirmEntity(entity), []);

  const columns = useMemo(
    () => createRoleTableColumns({ onView, onEdit, onToggleActive, canEdit, canManageStatus }),
    [onView, onEdit, onToggleActive, canEdit, canManageStatus],
  );

  const willDeactivate = confirmEntity?.isActive;
  const statusMutation = willDeactivate ? deactivateMutation : reactivateMutation;

  const runConfirmedAction = () => {
    if (!confirmEntity) return;
    statusMutation.mutate(confirmEntity.id, {
      onSuccess: () => {
        toast.success(`Role "${confirmEntity.name}" was ${willDeactivate ? "deactivated" : "reactivated"}.`);
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
        description="Role details"
        icon={ShieldCheck}
        isActive={viewEntity?.isActive}
        fields={
          viewEntity
            ? [
                { label: "Code", value: viewEntity.code, mono: true },
                { label: "Type", value: viewEntity.isSystem ? "System (built-in)" : "Custom" },
                { label: "Description", value: viewEntity.description },
                { label: "Users", value: viewEntity.usersCount },
                { label: "Permissions", value: viewEntity.permissionsCount },
                { label: "Created", value: formatDateTime(viewEntity.createdAt) },
                { label: "Last Updated", value: formatDateTime(viewEntity.updatedAt) },
              ]
            : []
        }
      />
      <EditRoleModal
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
        title={willDeactivate ? "Deactivate Role" : "Reactivate Role"}
        description={
          confirmEntity
            ? willDeactivate
              ? `"${confirmEntity.name}" will stop being assignable. Roles still held by active users cannot be deactivated.`
              : `"${confirmEntity.name}" will be assignable again.`
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
