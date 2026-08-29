import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import useDebounce from "../../hooks/useDebounce";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const selectClassName =
  "rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:ring-2 focus:ring-primaryBlue/15 focus:border-primaryBlue disabled:bg-gray-50 disabled:text-gray-400";

/** Both filters map 1:1 onto GET /api/v1/workflow-templates' query params (search, isActive). */
const WorkflowTemplatesFilterBar = ({ search, onSearchChange, isActive, onIsActiveChange, onReset }) => {
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    onSearchChange(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const activeFilterCount = [search, isActive].filter(Boolean).length;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="relative flex-1 min-w-55">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or code..."
          className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primaryBlue/15 focus:border-primaryBlue"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={isActive} onChange={(e) => onIsActiveChange(e.target.value)} className={selectClassName}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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

export default WorkflowTemplatesFilterBar;
