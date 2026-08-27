import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Building2, CheckCircle2, XCircle } from "lucide-react";
import { createDepartmentTableColumns } from "../components/departments/departmentTableColumns";
import EditDepartmentModal from "../components/departments/EditDepartmentModal";
import EntityDetailModal from "../components/shared/EntityDetailModal";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { formatDateTime } from "../utils/formatters";
import { deactivateDepartment, reactivateDepartment, updateDepartment } from "../utils/apiServices";
import { useUpdateOrgEntity } from "./useUpdateOrgEntity";
import { useOrgEntityStatusAction } from "./useOrgEntityStatusAction";
import useAuthStore from "../store/authStore";
import { PERMISSIONS } from "../utils/permissions";

const INVALIDATE_KEYS = ["admin-departments-list", "admin-department-stats", "departments"];

/**
 * Everything the Departments directory's row actions need -- View Details,
 * Edit, and Deactivate/Reactivate modal state + mutations, plus the
 * `columns` array wired to all of it. Mirrors useUserRowActions for the
 * Users directory.
 */
export const useDepartmentRowActions = () => {
  const perms = useAuthStore((state) => state.user?.permissions);
  const canEdit = Boolean(perms?.includes(PERMISSIONS.DEPARTMENTS_UPDATE));
  const canManageStatus =
    Boolean(perms?.includes(PERMISSIONS.DEPARTMENTS_DELETE)) &&
    Boolean(perms?.includes(PERMISSIONS.DEPARTMENTS_UPDATE));

  const [viewEntity, setViewEntity] = useState(null);
  const [editEntity, setEditEntity] = useState(null);
  const [confirmEntity, setConfirmEntity] = useState(null);

  const updateMutation = useUpdateOrgEntity({ updateFn: updateDepartment, invalidateKeys: INVALIDATE_KEYS });
  const deactivateMutation = useOrgEntityStatusAction({
    actionFn: deactivateDepartment,
    invalidateKeys: INVALIDATE_KEYS,
  });
  const reactivateMutation = useOrgEntityStatusAction({
    actionFn: reactivateDepartment,
    invalidateKeys: INVALIDATE_KEYS,
  });

  const onView = useCallback((entity) => setViewEntity(entity), []);
  const onEdit = useCallback((entity) => setEditEntity(entity), []);
  const onToggleActive = useCallback((entity) => setConfirmEntity(entity), []);

  const columns = useMemo(
    () => createDepartmentTableColumns({ onView, onEdit, onToggleActive, canEdit, canManageStatus }),
    [onView, onEdit, onToggleActive, canEdit, canManageStatus],
  );

  const willDeactivate = confirmEntity?.isActive;
  const statusMutation = willDeactivate ? deactivateMutation : reactivateMutation;

  const runConfirmedAction = () => {
    if (!confirmEntity) return;
    statusMutation.mutate(confirmEntity.id, {
      onSuccess: () => {
        toast.success(
          `Department "${confirmEntity.name}" was ${willDeactivate ? "deactivated" : "reactivated"}.`,
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
        description="Department details"
        icon={Building2}
        isActive={viewEntity?.isActive}
        fields={
          viewEntity
            ? [
                { label: "Code", value: viewEntity.code, mono: true },
                { label: "Description", value: viewEntity.description },
                { label: "Units", value: viewEntity.unitsCount },
                { label: "Users", value: viewEntity.usersCount },
                { label: "Created", value: formatDateTime(viewEntity.createdAt) },
                { label: "Last Updated", value: formatDateTime(viewEntity.updatedAt) },
              ]
            : []
        }
      />
      <EditDepartmentModal
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
        title={willDeactivate ? "Deactivate Department" : "Reactivate Department"}
        description={
          confirmEntity
            ? willDeactivate
              ? `"${confirmEntity.name}" will be hidden from new assignments. Departments with active units or users cannot be deactivated.`
              : `"${confirmEntity.name}" will be available for assignment again.`
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
