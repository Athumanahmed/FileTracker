import { useMemo, useState } from "react";
import { CheckCircle2, Archive as ArchiveIcon, AlarmClockOff } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import DataTable from "../components/shared/DataTable";
import DataPagination from "../components/shared/DataPagination";
import Tabs from "../components/shared/Tabs";
import ArchiveFileModal from "../components/files/ArchiveFileModal";
import { buildReadyToArchiveColumns, buildArchivedColumns, buildExpiredRetentionColumns } from "../components/files/archiveQueueColumns";
import { useFiles } from "../hooks/useFiles";
import { useExpiredRetention } from "../hooks/useExpiredRetention";
import useAuthStore from "../store/authStore";
import { getDashboardHomePath } from "../utils/dashboardHome";

const QUEUE_TABS = [
  { id: "ready", name: "Ready to Archive", icon: CheckCircle2 },
  { id: "archived", name: "Archived", icon: ArchiveIcon },
  { id: "expired", name: "Expired Retention", icon: AlarmClockOff },
];

const READY_STATUS_OPTIONS = [
  { id: "COMPLETED", label: "Completed" },
  { id: "REJECTED", label: "Rejected" },
  { id: "CLOSED", label: "Closed" },
];

const PAGE_SIZE = 10;

/** Shared across every role with ARCHIVE.READ (Archive Officer + Admin). */
const Archive = () => {
  const user = useAuthStore((state) => state.user);
  const basePath = getDashboardHomePath(user);

  const [activeQueue, setActiveQueue] = useState("ready");
  const [readyStatus, setReadyStatus] = useState("COMPLETED");
  const [page, setPage] = useState(1);
  const [fileToArchive, setFileToArchive] = useState(null);

  // Every queue/status switch re-anchors to page 1 -- adjusted during render
  // (React's documented alternative to an effect for this exact case).
  const [pageResetKey, setPageResetKey] = useState(`${activeQueue}:${readyStatus}`);
  const resetKey = `${activeQueue}:${readyStatus}`;
  if (pageResetKey !== resetKey) {
    setPageResetKey(resetKey);
    setPage(1);
  }

  const readyColumns = useMemo(() => buildReadyToArchiveColumns(basePath, setFileToArchive), [basePath]);
  const archivedColumns = useMemo(() => buildArchivedColumns(basePath), [basePath]);
  const expiredColumns = useMemo(() => buildExpiredRetentionColumns(basePath), [basePath]);

  // Completed count doubles as the primary "Ready to Archive" stat --
  // Rejected/Closed are real but much rarer outcomes, available via the
  // in-tab status filter rather than their own stat cards.
  const completedQuery = useFiles({
    status: "COMPLETED",
    sortBy: "updatedAt",
    sortOrder: "desc",
    page: activeQueue === "ready" && readyStatus === "COMPLETED" ? page : 1,
    limit: PAGE_SIZE,
  });
  const rejectedQuery = useFiles(
    { status: "REJECTED", sortBy: "updatedAt", sortOrder: "desc", page: activeQueue === "ready" && readyStatus === "REJECTED" ? page : 1, limit: PAGE_SIZE },
    { enabled: activeQueue === "ready" && readyStatus === "REJECTED" },
  );
  const closedQuery = useFiles(
    { status: "CLOSED", sortBy: "updatedAt", sortOrder: "desc", page: activeQueue === "ready" && readyStatus === "CLOSED" ? page : 1, limit: PAGE_SIZE },
    { enabled: activeQueue === "ready" && readyStatus === "CLOSED" },
  );
  const archivedQuery = useFiles({
    status: "ARCHIVED",
    sortBy: "updatedAt",
    sortOrder: "desc",
    page: activeQueue === "archived" ? page : 1,
    limit: PAGE_SIZE,
  });
  const expiredQuery = useExpiredRetention();

  const readyQuery = { COMPLETED: completedQuery, REJECTED: rejectedQuery, CLOSED: closedQuery }[readyStatus];

  const activeQuery = activeQueue === "ready" ? readyQuery : activeQueue === "archived" ? archivedQuery : expiredQuery;
  const rows = activeQueue === "expired" ? (expiredQuery.data ?? []) : activeQuery.data?.data ?? [];
  const columns = activeQueue === "ready" ? readyColumns : activeQueue === "archived" ? archivedColumns : expiredColumns;
  const meta = activeQueue === "expired" ? null : activeQuery.data?.meta;

  const emptyCopy = {
    ready: { title: "Nothing to archive", message: `No ${readyStatus.toLowerCase()} files are waiting.` },
    archived: { title: "No archived files yet", message: "Files you archive will show up here." },
    expired: { title: "Nothing overdue for review", message: "Every archived file is still within its retention window." },
  }[activeQueue];

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Archive"
        description="Move completed cases into long-term retention, and review what's due for destruction review."
        breadcrumbs={[{ label: "Dashboard", to: basePath }, { label: "Archive" }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={CheckCircle2} tone="green" label="Completed (Ready)" value={completedQuery.data?.meta?.total} loading={completedQuery.isLoading} />
        <StatCard icon={ArchiveIcon} tone="purple" label="Archived" value={archivedQuery.data?.meta?.total} loading={archivedQuery.isLoading} />
        <StatCard icon={AlarmClockOff} tone="red" label="Expired Retention" value={expiredQuery.data?.length} loading={expiredQuery.isLoading} />
      </div>

      <Tabs activeTab={activeQueue} setActiveTab={setActiveQueue} tabs={QUEUE_TABS} />

      <div className="mt-5">
        {activeQueue === "ready" && (
          <div className="flex gap-2 mb-4">
            {READY_STATUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setReadyStatus(option.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  readyStatus === option.id ? "bg-primaryBlue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <DataTable
          data={rows}
          columns={columns}
          isLoading={activeQuery.isLoading}
          isError={activeQuery.isError}
          error={activeQuery.error}
          onRetry={activeQuery.refetch}
          getRowId={(row) => row.id ?? row.file?.id}
          emptyTitle={emptyCopy.title}
          emptyMessage={emptyCopy.message}
          emptyIcon={QUEUE_TABS.find((t) => t.id === activeQueue).icon}
        />

        {meta && !activeQuery.isLoading && !activeQuery.isError && (
          <div className={`mt-4 transition-opacity ${activeQuery.isFetching ? "opacity-60" : "opacity-100"}`}>
            <DataPagination currentPage={meta.page} totalPages={meta.totalPages} totalItems={meta.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ArchiveFileModal file={fileToArchive} isOpen={Boolean(fileToArchive)} onClose={() => setFileToArchive(null)} />
    </div>
  );
};

export default Archive;
