import { FolderOpen, Clock, CheckCircle2, AlertTriangle, Timer } from "lucide-react";
import useAuthStore from "../../store/authStore";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import FileStatusPieChart from "../../components/reports/FileStatusPieChart";
import RegistrationsTrendChart from "../../components/reports/RegistrationsTrendChart";
import RecentActivityCard from "../../components/dashboard/RecentActivityCard";
import MyAssignmentsCard from "../../components/dashboard/MyAssignmentsCard";
import WorkflowQuickActionsCard from "../../components/dashboard/WorkflowQuickActionsCard";
import { useReportDashboardKpis } from "../../hooks/useReportDashboardKpis";
import { useRegistrationsOverTime } from "../../hooks/useRegistrationsOverTime";
import { useFiles } from "../../hooks/useFiles";
import { useMyRecentActivity } from "../../hooks/useMyRecentActivity";
import { getDashboardHomePath } from "../../utils/dashboardHome";

/**
 * Director's own landing page. Unlike HOD (report.service.js
 * department-scopes HOD's KPIs), Director's REPORTS.READ-gated queries are
 * deliberately left unscoped -- resolveScopedDepartmentId only narrows for
 * HOD, so Director sees every department by default, same as
 * RegistryDashboard's org-wide view. Director also sits in the workflow
 * chain itself (Registry -> Director -> HOD -> Supervisor -> Officer), so
 * this also surfaces their own personal assignments -- same
 * MyAssignmentsCard/WorkflowQuickActionsCard every other workflow-assignee
 * role's dashboard (Officer, ...) uses.
 */
const DirectorDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const basePath = getDashboardHomePath(user);

  const { data: kpis, isLoading: kpisLoading, isError: kpisError, refetch: refetchKpis } = useReportDashboardKpis();
  const { data: trend, isLoading: trendLoading } = useRegistrationsOverTime({ bucket: "month" });
  const {
    data: myAssignments,
    isLoading: assignmentsLoading,
    isError: assignmentsError,
    refetch: refetchAssignments,
  } = useFiles({ assignedToId: user?.id, sortBy: "createdAt", sortOrder: "desc", limit: 5 });
  const {
    data: recentActivity,
    isLoading: recentActivityLoading,
    isError: recentActivityError,
    refetch: refetchRecentActivity,
  } = useMyRecentActivity(5);

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
        title={`Welcome, ${user?.fullName || user?.username}`}
        description="Org-wide file tracking and workflow oversight across every department."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {kpisError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Unable to load dashboard data.</p>
          <button
            type="button"
            onClick={() => refetchKpis()}
            className="mt-2 text-sm font-semibold text-red-700 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {STAT_CARDS.map(({ key, label, icon, tone, value, helperText }) => (
              <StatCard key={key} label={label} icon={icon} tone={tone} loading={kpisLoading} value={value} helperText={helperText} />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
            <div className="xl:col-span-2">
              <RegistrationsTrendChart data={trend} bucket="month" loading={trendLoading} />
            </div>
            <FileStatusPieChart data={kpis?.statusDistribution} loading={kpisLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <MyAssignmentsCard
              basePath={basePath}
              data={myAssignments?.data}
              isLoading={assignmentsLoading}
              isError={assignmentsError}
              refetch={refetchAssignments}
            />
            <WorkflowQuickActionsCard basePath={basePath} />
          </div>

          <div className="mt-4">
            <RecentActivityCard
              title="Your Recent Actions"
              data={recentActivity}
              isLoading={recentActivityLoading}
              isError={recentActivityError}
              refetch={refetchRecentActivity}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DirectorDashboard;
