import { RotateCcw, Building2, CalendarRange } from "lucide-react";
import BaseInput from "../shared/BaseInput";
import { useDepartments } from "../../hooks/useDepartments";

/** Maps to every hook on the Reports page's query params (departmentId, dateFrom, dateTo). */
const ReportFilterBar = ({ departmentId, onDepartmentChange, dateFrom, onDateFromChange, dateTo, onDateToChange, onReset }) => {
  const { data: departments } = useDepartments();
  const departmentOptions = (departments ?? []).map((d) => ({ value: d.id, label: d.name }));

  const activeFilterCount = [departmentId, dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6 flex flex-col lg:flex-row lg:items-end gap-3">
      <div className="flex-1 min-w-48">
        <BaseInput
          as="select"
          label="Department"
          name="departmentId"
          value={departmentId}
          onChange={(_, value) => onDepartmentChange(value)}
          placeholder="All Departments"
          options={departmentOptions}
          leftIcon={<Building2 size={15} />}
        />
      </div>
      <div className="flex-1 min-w-40">
        <BaseInput
          type="date"
          label="From"
          name="dateFrom"
          value={dateFrom}
          onChange={(_, value) => onDateFromChange(value)}
          leftIcon={<CalendarRange size={15} />}
        />
      </div>
      <div className="flex-1 min-w-40">
        <BaseInput type="date" label="To" name="dateTo" value={dateTo} onChange={(_, value) => onDateToChange(value)} leftIcon={<CalendarRange size={15} />} />
      </div>
      <button
        type="button"
        onClick={onReset}
        disabled={activeFilterCount === 0}
        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white shrink-0"
      >
        <RotateCcw size={15} />
        Reset
      </button>
    </div>
  );
};

export default ReportFilterBar;
