import { useMemo } from "react";
import { Search, Ban } from "lucide-react";
import { MODULE_LABELS, MODULE_BADGE_CLASSES, MODULE_ORDER } from "../../utils/permissionModules";
import TableSkeleton from "../shared/TableSkeleton";
import ErrorState from "../shared/ErrorState";
import EmptyState from "../shared/EmptyState";

const checkboxClassName =
  "size-4 rounded border-gray-300 text-primaryBlue focus:ring-primaryBlue/30 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Groups the full permission catalog by module and renders one checkbox
 * per permission -- the actual editing surface of the Role Permissions
 * matrix. Purely presentational: all state (which ids are checked, search
 * text) lives in RolePermissions.jsx and flows in as props.
 */
const PermissionMatrix = ({
  permissions,
  isLoading,
  isError,
  error,
  onRetry,
  checkedIds,
  onToggle,
  onToggleModule,
  search,
  readOnly = false,
}) => {
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? permissions.filter(
          (p) => p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query),
        )
      : permissions;

    const byModule = new Map();
    for (const permission of filtered) {
      if (!byModule.has(permission.module)) byModule.set(permission.module, []);
      byModule.get(permission.module).push(permission);
    }

    return MODULE_ORDER.filter((module) => byModule.has(module)).map((module) => ({
      module,
      permissions: byModule.get(module),
    }));
  }, [permissions, search]);

  if (isLoading) {
    return <TableSkeleton rows={8} columns={1} />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} title="Failed to load permissions" />;
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No permissions found"
        message="Try adjusting your search, or add a new permission first."
        icon={Search}
      />
    );
  }

  return (
    <div className="space-y-5">
      {groups.map(({ module, permissions: modulePermissions }) => {
        const grantedCount = modulePermissions.filter((p) => checkedIds.has(p.id)).length;
        const allGranted = grantedCount === modulePermissions.length;

        return (
          <div key={module} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${MODULE_BADGE_CLASSES[module] || "bg-gray-100 text-gray-700"}`}
                >
                  {MODULE_LABELS[module] || module}
                </span>
                <span className="text-xs text-gray-500">
                  {grantedCount} of {modulePermissions.length} granted
                </span>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onToggleModule(module, !allGranted)}
                  className="text-xs font-semibold text-primaryBlue hover:underline"
                >
                  {allGranted ? "Clear all" : "Select all"}
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-50">
              {modulePermissions.map((permission) => {
                const isChecked = checkedIds.has(permission.id);
                const isDisabled = readOnly || !permission.isActive;

                return (
                  <label
                    key={permission.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      isDisabled ? "" : "cursor-pointer hover:bg-gray-50/70"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => onToggle(permission.id)}
                      className={`mt-0.5 ${checkboxClassName}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">{permission.name}</span>
                        {!permission.isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                            <Ban size={10} />
                            Inactive
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-gray-500 font-mono">{permission.code}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PermissionMatrix;
