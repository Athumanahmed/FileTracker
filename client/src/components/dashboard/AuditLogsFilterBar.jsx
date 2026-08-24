import { useEffect, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { useAdminAuditLogEntityOptions } from "../../hooks/useAdminAuditLogEntityOptions";
import useDebounce from "../../hooks/useDebounce";

const selectClassName =
  "rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:ring-2 focus:ring-primaryBlue/15 focus:border-primaryBlue disabled:bg-gray-50 disabled:text-gray-400";

/** search/entity/dateFrom/dateTo map 1:1 onto GET /api/v1/dashboard/admin/audit-logs' query params. */
const AuditLogsFilterBar = ({
  search,
  onSearchChange,
  entity,
  onEntityChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onReset,
}) => {
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  const { data: entityOptions, isLoading: entitiesLoading } = useAdminAuditLogEntityOptions();

  useEffect(() => {
    onSearchChange(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const activeFilterCount = [search, entity, dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="relative flex-1 min-w-55">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search description, action, or user..."
          className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primaryBlue/15 focus:border-primaryBlue"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={entity} onChange={(e) => onEntityChange(e.target.value)} disabled={entitiesLoading} className={selectClassName}>
          <option value="">All Types</option>
          {entityOptions?.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className={selectClassName}
          aria-label="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className={selectClassName}
          aria-label="To date"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
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

export default AuditLogsFilterBar;
