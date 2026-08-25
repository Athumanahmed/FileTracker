import { UserCheck, AlarmClockOff, Layers, CheckCircle2 } from "lucide-react";
import useAuthStore from "../../store/authStore";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import RecentActivityCard from "../../components/dashboard/RecentActivityCard";
import MyAssignmentsCard from "../../components/dashboard/MyAssignmentsCard";
import WorkflowQuickActionsCard from "../../components/dashboard/WorkflowQuickActionsCard";
import { useFiles } from "../../hooks/useFiles";
import { useOverdueAssignments } from "../../hooks/useOverdueAssignments";
import { useReportDashboardKpis } from "../../hooks/useReportDashboardKpis";
import { useMyRecentActivity } from "../../hooks/useMyRecentActivity";
import { getDashboardHomePath } from "../../utils/dashboardHome";

/**
 * Officer's own landing page -- unlike SystemUsers/Registry/HOD-Supervisor,
 * Officer holds no administrative scope at all (ADMIN_SCOPE_BY_ROLE.OFFICER
 * === "NONE" -- see organizationalHierarchy.js), so there's no org-wide
 * summary endpoint for this role. Everything here is built from endpoints
 * Officer already holds via WORKFLOW_ASSIGNEE_PERMISSIONS + REPORTS.READ
 * (the same ones the Files/Workflow/Reports pages already use), plus the
 * self-scoped /dashboard/my/recent-activity (no administrative-scope
 * permission needed -- it can only ever return the caller's own actions).
 */
const OfficerDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const basePath = getDashboardHomePath(user);

  const {
    data: myAssignments,
    isLoading: assignmentsLoading,
    isError: assignmentsError,
    refetch: refetchAssignments,
  } = useFiles({ assignedToId: user?.id, sortBy: "createdAt", sortOrder: "desc", limit: 5 });
  const { data: overdue, isLoading: overdueLoading } = useOverdueAssignments();
  const { data: kpis, isLoading: kpisLoading } = useReportDashboardKpis();
  const {
    data: recentActivity,
    isLoading: recentActivityLoading,
    isError: recentActivityError,
    refetch: refetchRecentActivity,
  } = useMyRecentActivity(5);

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title={`Welcome, ${user?.fullName || user?.username}`}
        description="Files routed to you, and org-wide progress at a glance."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={UserCheck}
          tone="purple"
          label="My Assignments"
          value={myAssignments?.meta?.total}
          loading={assignmentsLoading}
          to={`${basePath}/workflow`}
        />
        <StatCard
          icon={AlarmClockOff}
          tone="red"
          label="Overdue"
          helperText="Org-wide"
          value={overdue?.length}
          loading={overdueLoading}
          to={`${basePath}/workflow`}
        />
        <StatCard
          icon={Layers}
          tone="amber"
          label="Active Files"
          helperText="Org-wide"
          value={kpis?.pending}
          loading={kpisLoading}
          to={`${basePath}/files`}
        />
        <StatCard
          icon={CheckCircle2}
          tone="green"
          label="Completed"
          helperText="Org-wide"
          value={kpis?.completed}
          loading={kpisLoading}
          to={`${basePath}/reports`}
        />
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
    </div>
  );
};

export default OfficerDashboard;
