import { Link } from "react-router-dom";
import { Users, UserCheck, UserX, Boxes, UserCog, Plus, ArrowRight } from "lucide-react";
import useAuthStore from "../store/authStore";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import RecentActivityCard from "../components/dashboard/RecentActivityCard";
import { useScopedDashboardSummary } from "../hooks/useScopedDashboardSummary";
import { useScopedRecentActivity } from "../hooks/useScopedRecentActivity";
import { getCreatableActorTypes } from "../utils/creatableActorTypes";

// scope.type ("DEPARTMENT" | "UNIT") from GET /dashboard/scoped/summary
// deterministically identifies which of the two roles that can ever reach
// this shared page is viewing it (HOD is always DEPARTMENT-scoped,
// Supervisor always UNIT-scoped -- see server/config/organizationalHierarchy.js),
// so one component serves both /hod and /supervisor rather than two
// near-identical copies.
const SCOPE_META = {
  DEPARTMENT: { scopeLabel: "Department", createRoleCode: "SUPERVISOR", createPath: "/hod/create-supervisor", usersPath: "/hod/users" },
  UNIT: { scopeLabel: "Unit", createRoleCode: "OFFICER", createPath: "/supervisor/create-officer", usersPath: "/supervisor/users" },
};

const ScopedDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const { data: summary, isLoading, isError, refetch } = useScopedDashboardSummary();
  const {
    data: recentActivity,
    isLoading: recentActivityLoading,
    isError: recentActivityError,
    refetch: refetchRecentActivity,
  } = useScopedRecentActivity(5);

  const meta = summary ? SCOPE_META[summary.scope.type] : null;
  const canCreate = meta && getCreatableActorTypes(user?.permissions).some((a) => a.roleCode === meta.createRoleCode);

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title={`Welcome, ${user?.fullName || user?.username}`}
        description={
          summary
            ? `${meta.scopeLabel}: ${summary.scope.name ?? "—"}`
            : "Manage the people in your organizational scope."
        }
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Unable to load dashboard data.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-sm font-semibold text-red-700 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              tone="blue"
              label="Total Users"
              value={summary?.users?.total?.total}
              change={summary?.users?.total?.changePercent}
              loading={isLoading}
            />
            <StatCard
              icon={UserCheck}
              tone="green"
              label="Active Users"
              value={summary?.users?.active?.count}
              helperText={summary ? `${summary.users.active.percent}% of total` : undefined}
              loading={isLoading}
            />
            <StatCard
              icon={UserX}
              tone="amber"
              label="Inactive Users"
              value={summary?.users?.inactive?.count}
              helperText={summary ? `${summary.users.inactive.percent}% of total` : undefined}
              loading={isLoading}
            />
            <StatCard
              icon={UserCog}
              tone="purple"
              label={summary?.subordinates?.label ?? "Subordinates"}
              value={summary?.subordinates?.count}
              loading={isLoading}
            />
            {summary?.unitsCount != null && (
              <StatCard icon={Boxes} tone="teal" label="Units" value={summary.unitsCount} loading={isLoading} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div className="lg:col-span-2">
              <RecentActivityCard
                title="Your Recent Actions"
                data={recentActivity}
                isLoading={recentActivityLoading}
                isError={recentActivityError}
                refetch={refetchRecentActivity}
              />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">Quick Actions</h2>
              <div className="mt-4 flex flex-col gap-2.5">
                {canCreate && (
                  <Link
                    to={meta.createPath}
                    className="flex items-center gap-2.5 rounded-xl border border-gray-100 p-3 hover:border-primaryBlue/20 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryBlueLight text-primaryBlue">
                      <Plus size={16} />
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      Add {meta.scopeLabel === "Department" ? "Supervisor" : "Officer"}
                    </span>
                  </Link>
                )}
                {meta && (
                  <Link
                    to={meta.usersPath}
                    className="flex items-center gap-2.5 rounded-xl border border-gray-100 p-3 hover:border-primaryBlue/20 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      <ArrowRight size={16} />
                    </span>
                    <span className="text-sm font-medium text-gray-700">View Users</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ScopedDashboard;
