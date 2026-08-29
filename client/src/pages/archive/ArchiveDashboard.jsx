import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { Inbox, Archive as ArchiveIcon, AlarmClockOff, Undo2, ChevronRight, ShieldCheck } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import ArchivedPerMonthChart from "../../components/archive/ArchivedPerMonthChart";
import RetentionRunwayChart from "../../components/archive/RetentionRunwayChart";
import { useArchiveStats } from "../../hooks/useArchiveStats";
import useAuthStore from "../../store/authStore";
import { getDashboardHomePath } from "../../utils/dashboardHome";

const READY_BREAKDOWN = [
  { key: "COMPLETED", label: "Completed", tone: "text-green-600" },
  { key: "REJECTED", label: "Rejected", tone: "text-red-600" },
  { key: "CLOSED", label: "Closed", tone: "text-gray-600" },
];

const expiryBadge = (value, overdue) => {
  const days = Math.abs(dayjs(value).diff(dayjs(), "day"));
  if (overdue) return { text: `${days}d overdue`, className: "bg-red-50 text-red-600" };
  if (days <= 30) return { text: `${days}d left`, className: "bg-amber-50 text-amber-700" };
  return { text: dayjs(value).format("MMM YYYY"), className: "bg-gray-100 text-gray-600" };
};

const ArchiveDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const basePath = getDashboardHomePath(user);
  const archivePath = `${basePath}/archive`;

  const { data: stats, isLoading, isError, refetch } = useArchiveStats();

  const statCards = [
    {
      key: "ready",
      label: "Ready to Archive",
      icon: Inbox,
      tone: "blue",
      value: stats?.readyToArchive?.total,
      helperText: "completed / rejected / closed",
      to: archivePath,
    },
    { key: "archived", label: "Archived", icon: ArchiveIcon, tone: "purple", value: stats?.archived, helperText: "in long-term retention", to: archivePath },
    {
      key: "expired",
      label: "Retention Expired",
      icon: AlarmClockOff,
      tone: "red",
      value: stats?.expiredRetention,
      helperText: "due for destruction review",
      to: archivePath,
    },
    { key: "restored", label: "Restored", icon: Undo2, tone: "teal", value: stats?.restored, helperText: "pulled back from archive" },
  ];

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title={`Welcome, ${user?.fullName || user?.username}`}
        description="Archive intake, long-term retention, and destruction-review workload at a glance."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Unable to load archive data.</p>
          <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-semibold text-red-700 hover:underline">
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map(({ key, ...card }) => (
              <StatCard key={key} loading={isLoading} {...card} />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
            <div className="xl:col-span-2">
              <ArchivedPerMonthChart data={stats?.archivedByMonth} loading={isLoading} />
            </div>
            <RetentionRunwayChart data={stats?.retentionRunway} loading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Ready to Archive</h2>
                <Link to={archivePath} className="text-xs font-semibold text-primaryBlue hover:underline">
                  Open queue
                </Link>
              </div>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {isLoading ? "—" : (stats?.readyToArchive?.total ?? 0)}
              </p>
              <div className="mt-4 space-y-2.5">
                {READY_BREAKDOWN.map(({ key, label, tone }) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-semibold ${tone}`}>
                      {isLoading ? "—" : (stats?.readyToArchive?.[key] ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Needs Retention Review</h2>
                <Link to={archivePath} className="text-xs font-semibold text-primaryBlue hover:underline">
                  View all
                </Link>
              </div>

              {isLoading ? (
                <div className="mt-4 space-y-2 animate-pulse">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-11 rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : !stats?.upcomingExpiries?.length ? (
                <div className="mt-6 flex flex-col items-center gap-1.5 py-6 text-center">
                  <ShieldCheck size={22} className="text-green-500" />
                  <p className="text-sm font-medium text-gray-700">Nothing due for review</p>
                  <p className="text-xs text-gray-500">Every archived file is within its retention window.</p>
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-gray-50">
                  {stats.upcomingExpiries.map((item) => {
                    const badge = expiryBadge(item.retentionExpiresAt, item.overdue);
                    return (
                      <li key={item.fileId ?? item.fileNumber}>
                        <Link
                          to={item.fileId ? `${basePath}/files/${item.fileId}` : archivePath}
                          className="flex items-center justify-between gap-3 py-2.5 group"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800 group-hover:text-primaryBlue">
                              {item.title || "Untitled file"}
                            </p>
                            <p className="truncate text-xs text-gray-400">{item.fileNumber}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.text}</span>
                            <ChevronRight size={15} className="text-gray-300 group-hover:text-primaryBlue" />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ArchiveDashboard;
