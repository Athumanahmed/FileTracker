import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { useDepartments } from "../../hooks/useDepartments";
import { useUnits } from "../../hooks/useUnits";
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
 * All five filters (search, department, unit, status, role) map 1:1 onto
 * GET /api/v1/admin/users' actual query params -- nothing here is
 * decorative. Unit options narrow to the selected department automatically
 * once one's picked (server-side, via useUnits(departmentId)).
 */
const UsersFilterBar = ({
  search,
  onSearchChange,
  departmentId,
  onDepartmentChange,
  unitId,
  onUnitChange,
  status,
  onStatusChange,
  roleCode,
  onRoleChange,
  onReset,
}) => {
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { data: units, isLoading: unitsLoading } = useUnits(departmentId);
  const { data: roles, isLoading: rolesLoading } = useRoles();

  useEffect(() => {
    onSearchChange(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const activeFilterCount = [search, departmentId, unitId, status, roleCode].filter(Boolean).length;

  const handleDepartmentChange = (value) => {
    onDepartmentChange(value);
    // A unit only belongs to one department -- clear it whenever the
    // department changes so the two filters can never disagree.
    if (unitId) onUnitChange("");
  };

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
        <select
          value={departmentId}
          onChange={(e) => handleDepartmentChange(e.target.value)}
          disabled={departmentsLoading}
          className={selectClassName}
        >
          <option value="">All Departments</option>
          {departments?.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>

        <select
          value={unitId}
          onChange={(e) => onUnitChange(e.target.value)}
          disabled={unitsLoading}
          className={selectClassName}
        >
          <option value="">All Units</option>
          {units?.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>

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

export default UsersFilterBar;
