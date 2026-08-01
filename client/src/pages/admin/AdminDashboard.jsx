import { useMemo } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Users, Building2, Boxes, IdCard, ShieldCheck, KeyRound, Calendar, Download } from "lucide-react";
import useAuthStore from "../../store/authStore";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import FileStatisticsChart from "../../components/dashboard/FileStatisticsChart";
import FilesByStatusChart from "../../components/dashboard/FilesByStatusChart";
import RecentActivityCard from "../../components/dashboard/RecentActivityCard";
import SystemAlertsCard from "../../components/dashboard/SystemAlertsCard";
import QuickActionsCard from "../../components/dashboard/QuickActionsCard";
import { useAdminDashboardSummary } from "../../hooks/useAdminDashboardSummary";

const STAT_CARDS = [
  { key: "users", label: "Total Users", icon: Users, tone: "blue", to: "/admin/users" },
  { key: "departments", label: "Departments", icon: Building2, tone: "green", to: "/admin/departments" },
  { key: "units", label: "Units", icon: Boxes, tone: "amber", to: "/admin/units" },
  { key: "positions", label: "Positions", icon: IdCard, tone: "blue", to: "/admin/positions" },
  { key: "roles", label: "Roles", icon: ShieldCheck, tone: "purple", to: "/admin/roles" },
  { key: "permissions", label: "Permissions", icon: KeyRound, tone: "teal", to: "/admin/permissions" },
];

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const { data: summary, isLoading, isError, refetch } = useAdminDashboardSummary();

  // Mirrors the 7-day window server/services/dashboard.service.js's trend
  // calculation actually measures, so the label means what it says.
  const dateRangeLabel = useMemo(
    () => `${dayjs().subtract(6, "day").format("MMM D")} - ${dayjs().format("MMM D, YYYY")}`,
    [],
  );

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title={`Welcome, ${user?.fullName || user?.username}`}
        description="Manage the platform's organizational structure and access control."
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600">
            <Calendar size={15} />
            {dateRangeLabel}
          </span>
        }
        primaryAction={{
          label: "Export Report",
          icon: Download,
          onClick: () => toast("Report export is coming soon."),
        }}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {STAT_CARDS.map(({ key, label, icon, tone, to }) => (
              <StatCard
                key={key}
                label={label}
                icon={icon}
                tone={tone}
                to={to}
                loading={isLoading}
                value={summary?.stats?.[key]?.total}
                change={summary?.stats?.[key]?.changePercent}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
            <div className="xl:col-span-2">
              <FileStatisticsChart />
            </div>
            <FilesByStatusChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <RecentActivityCard />
            <SystemAlertsCard inactiveUsersCount={summary?.alerts?.inactiveUsers} loading={isLoading} />
            <QuickActionsCard />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
