import { useState } from "react";
import toast from "react-hot-toast";
import { Search, Save, RotateCcw, Lock, Loader2 } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import RoleSelectorList from "../../components/rolePermissions/RoleSelectorList";
import PermissionMatrix from "../../components/rolePermissions/PermissionMatrix";
import { useRoles } from "../../hooks/useRoles";
import { usePermissionsLookup } from "../../hooks/usePermissionsLookup";
import { useRolePermissionsForRole } from "../../hooks/useRolePermissionsForRole";
import { useSyncRolePermissions } from "../../hooks/useSyncRolePermissions";
import useAuthStore from "../../store/authStore";
import { PERMISSIONS } from "../../utils/permissions";

const areSetsEqual = (a, b) => a.size === b.size && [...a].every((id) => b.has(id));

const RolePermissions = () => {
  const userPermissions = useAuthStore((state) => state.user?.permissions ?? []);
  const canEdit =
    userPermissions.includes(PERMISSIONS.ROLE_PERMISSIONS_ASSIGN) &&
    userPermissions.includes(PERMISSIONS.ROLE_PERMISSIONS_REVOKE);

  const { data: roles, isLoading: rolesLoading } = useRoles();
  const {
    data: permissions,
    isLoading: permissionsLoading,
    isError: permissionsError,
    error: permissionsErrorObj,
    refetch: refetchPermissions,
  } = usePermissionsLookup();

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [search, setSearch] = useState("");

  // Default to the first role once the list loads, without ever
  // overriding a selection the admin already made. Adjusting state during
  // render (rather than in an effect) per React's guidance for "reset
  // state when a dependency changes" -- avoids an extra post-commit render.
  const [prevRoles, setPrevRoles] = useState(roles);
  if (roles !== prevRoles) {
    setPrevRoles(roles);
    if (!selectedRoleId && roles?.length) setSelectedRoleId(roles[0].id);
  }

  const {
    data: grantedIds,
    isLoading: grantsLoading,
    isFetching: grantsFetching,
  } = useRolePermissionsForRole(selectedRoleId);

  // Re-sync local checked state from the server truth whenever it changes
  // for this role -- on first load, on switching roles, and after a
  // successful save (the mutation invalidates this query, producing a new
  // `grantedIds` reference, which is also what clears "dirty" post-save).
  const [prevGrantedIds, setPrevGrantedIds] = useState(grantedIds);
  if (grantedIds !== prevGrantedIds) {
    setPrevGrantedIds(grantedIds);
    if (grantedIds) setCheckedIds(new Set(grantedIds));
  }

  const isDirty = grantedIds ? !areSetsEqual(checkedIds, grantedIds) : false;
  const selectedRole = roles?.find((role) => role.id === selectedRoleId);

  const { mutate: sync, isPending: isSaving } = useSyncRolePermissions();

  const handleSelectRole = (roleId) => {
    if (roleId === selectedRoleId) return;
    if (isDirty && !window.confirm("You have unsaved changes. Switch roles and discard them?")) {
      return;
    }
    setSelectedRoleId(roleId);
  };

  const handleToggle = (permissionId) => {
    if (!canEdit) return;
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  };

  const handleToggleModule = (module, nextChecked) => {
    if (!canEdit || !permissions) return;
    setCheckedIds((prev) => {
      const next = new Set(prev);
      for (const permission of permissions) {
        if (permission.module !== module || !permission.isActive) continue;
        if (nextChecked) next.add(permission.id);
        else next.delete(permission.id);
      }
      return next;
    });
  };

  const handleDiscard = () => {
    if (grantedIds) setCheckedIds(new Set(grantedIds));
  };

  const handleSave = () => {
    sync(
      { roleId: selectedRoleId, permissionIds: [...checkedIds] },
      {
        onSuccess: () => {
          toast.success(`Permissions updated for ${selectedRole?.name ?? "role"}.`);
        },
        onError: (error) => {
          const message = error?.response?.data?.message || "Unable to save permission changes.";
          toast.error(message);
        },
      },
    );
  };

  const totalGranted = checkedIds.size;
  const totalPermissions = permissions?.length ?? 0;

  const busy = grantsLoading || isSaving;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Role Permissions"
        description="The source of truth for what each role can do -- select a role, then grant or revoke individual permissions."
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Role Permissions" }]}
      />

      {!canEdit && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 mb-6">
          <Lock className="mt-0.5 shrink-0 text-amber-600" size={16} />
          <p className="text-xs leading-relaxed text-amber-800">
            You have read-only access here -- viewing is available, but granting or revoking permissions
            requires both <span className="font-semibold">ROLE_PERMISSIONS.ASSIGN</span> and{" "}
            <span className="font-semibold">ROLE_PERMISSIONS.REVOKE</span>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Roles</h3>
          <RoleSelectorList
            roles={roles ?? []}
            isLoading={rolesLoading}
            selectedRoleId={selectedRoleId}
            onSelect={handleSelectRole}
          />
        </aside>

        <div className="min-w-0">
          <div className="sticky top-0 z-10 -mx-2 xl:-mx-4 mb-5 border-b border-gray-100 bg-gray-50/95 px-2 xl:px-4 py-3.5 backdrop-blur">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">{selectedRole?.name ?? "Select a role"}</p>
                <p className="text-xs text-gray-500">
                  {grantsFetching ? "Loading..." : `${totalGranted} of ${totalPermissions} permissions granted`}
                  {isDirty && <span className="ml-2 font-semibold text-amber-600">Unsaved changes</span>}
                </p>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={!isDirty || busy}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw size={14} />
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isDirty || busy}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primaryBlue px-4 py-2 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search permissions by name or code..."
                className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primaryBlue/15 focus:border-primaryBlue"
              />
            </div>
          </div>

          {!selectedRoleId ? (
            <p className="text-sm text-gray-500 py-10 text-center">Select a role to view its permissions.</p>
          ) : (
            <PermissionMatrix
              permissions={permissions ?? []}
              isLoading={permissionsLoading}
              isError={permissionsError}
              error={permissionsErrorObj}
              onRetry={refetchPermissions}
              checkedIds={checkedIds}
              onToggle={handleToggle}
              onToggleModule={handleToggleModule}
              search={search}
              readOnly={!canEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RolePermissions;
