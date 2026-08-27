import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Boxes, CheckCircle2, XCircle } from "lucide-react";
import { createUnitTableColumns } from "../components/units/unitTableColumns";
import EditUnitModal from "../components/units/EditUnitModal";
import EntityDetailModal from "../components/shared/EntityDetailModal";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { formatDateTime } from "../utils/formatters";
import { deactivateUnit, reactivateUnit, updateUnit } from "../utils/apiServices";
import { useUpdateOrgEntity } from "./useUpdateOrgEntity";
import { useOrgEntityStatusAction } from "./useOrgEntityStatusAction";
import useAuthStore from "../store/authStore";
import { PERMISSIONS } from "../utils/permissions";

const INVALIDATE_KEYS = ["admin-units-list", "admin-unit-stats", "units"];

/** Row actions for the Units directory -- View / Edit / Deactivate-Reactivate. Mirrors useDepartmentRowActions. */
export const useUnitRowActions = () => {
  const perms = useAuthStore((state) => state.user?.permissions);
  const canEdit = Boolean(perms?.includes(PERMISSIONS.UNITS_UPDATE));
  const canManageStatus =
    Boolean(perms?.includes(PERMISSIONS.UNITS_DELETE)) &&
    Boolean(perms?.includes(PERMISSIONS.UNITS_UPDATE));

  const [viewEntity, setViewEntity] = useState(null);
  const [editEntity, setEditEntity] = useState(null);
  const [confirmEntity, setConfirmEntity] = useState(null);

  const updateMutation = useUpdateOrgEntity({ updateFn: updateUnit, invalidateKeys: INVALIDATE_KEYS });
  const deactivateMutation = useOrgEntityStatusAction({
    actionFn: deactivateUnit,
    invalidateKeys: INVALIDATE_KEYS,
  });
  const reactivateMutation = useOrgEntityStatusAction({
    actionFn: reactivateUnit,
    invalidateKeys: INVALIDATE_KEYS,
  });

  const onView = useCallback((entity) => setViewEntity(entity), []);
  const onEdit = useCallback((entity) => setEditEntity(entity), []);
  const onToggleActive = useCallback((entity) => setConfirmEntity(entity), []);

  const columns = useMemo(
    () => createUnitTableColumns({ onView, onEdit, onToggleActive, canEdit, canManageStatus }),
    [onView, onEdit, onToggleActive, canEdit, canManageStatus],
  );

  const willDeactivate = confirmEntity?.isActive;
  const statusMutation = willDeactivate ? deactivateMutation : reactivateMutation;

  const runConfirmedAction = () => {
    if (!confirmEntity) return;
    statusMutation.mutate(confirmEntity.id, {
      onSuccess: () => {
        toast.success(`Unit "${confirmEntity.name}" was ${willDeactivate ? "deactivated" : "reactivated"}.`);
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
        description="Unit details"
        icon={Boxes}
        isActive={viewEntity?.isActive}
        fields={
          viewEntity
            ? [
                { label: "Code", value: viewEntity.code, mono: true },
                { label: "Department", value: viewEntity.department?.name },
                { label: "Description", value: viewEntity.description },
                { label: "Positions", value: viewEntity.positionsCount },
                { label: "Users", value: viewEntity.usersCount },
                { label: "Created", value: formatDateTime(viewEntity.createdAt) },
                { label: "Last Updated", value: formatDateTime(viewEntity.updatedAt) },
              ]
            : []
        }
      />
      <EditUnitModal
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
        title={willDeactivate ? "Deactivate Unit" : "Reactivate Unit"}
        description={
          confirmEntity
            ? willDeactivate
              ? `"${confirmEntity.name}" will be hidden from new assignments. Units with active positions or users cannot be deactivated.`
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
