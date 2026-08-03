import { useMemo, useState } from "react";
import { FolderOpen, Clock, CheckCircle2, AlertTriangle, Timer, Building2 } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import DataTable from "../components/shared/DataTable";
import ReportFilterBar from "../components/reports/ReportFilterBar";
import ExportReportButton from "../components/reports/ExportReportButton";
import RegistrationsTrendChart from "../components/reports/RegistrationsTrendChart";
import FileStatusPieChart from "../components/reports/FileStatusPieChart";
import { departmentPerformanceColumns } from "../components/files/departmentPerformanceColumns";
import { useReportDashboardKpis } from "../hooks/useReportDashboardKpis";
import { useRegistrationsOverTime } from "../hooks/useRegistrationsOverTime";
import { useDepartmentPerformance } from "../hooks/useDepartmentPerformance";
import useAuthStore from "../store/authStore";
import { getDashboardHomePath } from "../utils/dashboardHome";

/**
 * Shared across every role with REPORTS.READ. The backend already scopes
 * results per role server-side (HOD locked to their own department,
 * Officer to their own row, etc. -- see report.service.js), so this page
 * needs no role branching of its own; the department filter is simply a
 * no-op for a role the backend already pins to one department.
 */
const Reports = () => {
  const user = useAuthStore((state) => state.user);
  const basePath = getDashboardHomePath(user);

  const [departmentId, setDepartmentId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filters = useMemo(
    () => ({
      ...(departmentId ? { departmentId } : {}),
      ...(dateFrom ? { dateFrom: new Date(dateFrom).toISOString() } : {}),
      ...(dateTo ? { dateTo: new Date(dateTo).toISOString() } : {}),
    }),
    [departmentId, dateFrom, dateTo],
  );

  const { data: kpis, isLoading: kpisLoading, isError: kpisError, refetch: refetchKpis } = useReportDashboardKpis(filters);
  const { data: trend, isLoading: trendLoading } = useRegistrationsOverTime({ ...filters, bucket: "month" });
  const { data: deptPerformance, isLoading: deptLoading, isError: deptError, refetch: refetchDept } = useDepartmentPerformance(filters);

  const handleReset = () => {
    setDepartmentId("");
    setDateFrom("");
    setDateTo("");
  };

  const STAT_CARDS = [
    { key: "totalFiles", label: "Total Files", icon: FolderOpen, tone: "blue", value: kpis?.totalFiles },
    { key: "pending", label: "Pending", icon: Clock, tone: "amber", value: kpis?.pending },
    { key: "completed", label: "Completed", icon: CheckCircle2, tone: "green", value: kpis?.completed },
    { key: "overdue", label: "Overdue", icon: AlertTriangle, tone: "red", value: kpis?.overdue },
    {
      key: "avgProcessingDays",
      label: "Avg. Processing Time",
      icon: Timer,
      tone: "purple",
      value: kpis?.avgProcessingDays ?? "—",
      helperText: "days to close a file",
    },
  ];

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Reports"
        description="File processing performance, filterable by department and date range."
        breadcrumbs={[{ label: "Dashboard", to: basePath }, { label: "Reports" }]}
        actions={<ExportReportButton filters={filters} />}
      />

      <ReportFilterBar
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onReset={handleReset}
      />

      {kpisError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center mb-6">
          <p className="text-sm text-red-600">Unable to load report data.</p>
          <button type="button" onClick={() => refetchKpis()} className="mt-1.5 text-sm font-semibold text-red-700 hover:underline">
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
            {STAT_CARDS.map(({ key, label, icon, tone, value, helperText }) => (
              <StatCard key={key} label={label} icon={icon} tone={tone} loading={kpisLoading} value={value} helperText={helperText} />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <div className="xl:col-span-2">
              <RegistrationsTrendChart data={trend} bucket="month" loading={trendLoading} />
            </div>
            <FileStatusPieChart data={kpis?.statusDistribution} loading={kpisLoading} />
          </div>
        </>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
          <Building2 size={16} className="text-gray-400" />
          Department Performance
        </h2>
        <DataTable
          data={deptPerformance ?? []}
          columns={departmentPerformanceColumns}
          isLoading={deptLoading}
          isError={deptError}
          onRetry={refetchDept}
          getRowId={(row) => row.department?.id}
          emptyTitle="No data for this filter"
          emptyMessage="Try widening the date range or clearing the department filter."
          emptyIcon={Building2}
        />
      </div>
    </div>
  );
};

export default Reports;
