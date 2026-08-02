import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { useRoles } from "../../hooks/useRoles";
import useDebounce from "../../hooks/useDebounce";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING_ACTIVATION", label: "Pending Activation" },
  { value: "LOCKED", label: "Locked" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DISABLED", label: "Disabled" },
  { value: "ARCHIVED", label: "Archived" },
];

const selectClassName =
  "rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:ring-2 focus:ring-primaryBlue/15 focus:border-primaryBlue disabled:bg-gray-50 disabled:text-gray-400";

/**
 * Lighter than UsersFilterBar (no department/unit pickers) -- HOD/Supervisor's
 * roster is already fully scoped server-side (see
 * adminUserQuery.service.js#applyActorScope), so a department/unit filter
 * would only ever have one meaningful value and would just be confusing.
 */
const ScopedUsersFilterBar = ({ search, onSearchChange, status, onStatusChange, roleCode, onRoleChange, onReset }) => {
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  const { data: roles, isLoading: rolesLoading } = useRoles();

  useEffect(() => {
    onSearchChange(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const activeFilterCount = [search, status, roleCode].filter(Boolean).length;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="relative flex-1 min-w-55">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email, or username..."
          className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primaryBlue/15 focus:border-primaryBlue"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => onStatusChange(e.target.value)} className={selectClassName}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={roleCode}
          onChange={(e) => onRoleChange(e.target.value)}
          disabled={rolesLoading}
          className={selectClassName}
        >
          <option value="">All Roles</option>
          {roles?.map((role) => (
            <option key={role.id} value={role.code}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600">
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primaryBlue px-1 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onReset}
          disabled={activeFilterCount === 0}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
        >
          <RotateCcw size={15} />
          Reset
        </button>
      </div>
    </div>
  );
};

export default ScopedUsersFilterBar;
