import { useMemo, useState } from "react";
import { ClipboardList, UserCheck, AlarmClockOff, Layers } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import DataTable from "../components/shared/DataTable";
import DataPagination from "../components/shared/DataPagination";
import Tabs from "../components/shared/Tabs";
import { buildNeedsRoutingColumns, buildMyAssignmentsColumns, buildOverdueColumns } from "../components/files/workflowQueueColumns";
import { useFiles } from "../hooks/useFiles";
import { useOverdueAssignments } from "../hooks/useOverdueAssignments";
import { useReportDashboardKpis } from "../hooks/useReportDashboardKpis";
import useAuthStore from "../store/authStore";
import { getDashboardHomePath } from "../utils/dashboardHome";
import { PERMISSIONS } from "../utils/permissions";

const PAGE_SIZE = 10;

/**
 * Shared across every role with WORKFLOW.READ. "Needs Routing" only makes
 * sense for whoever holds FILES.REGISTER (only they start a file's
 * workflow) -- everyone else gets My Assignments + Overdue only.
 */
const Workflow = () => {
  const user = useAuthStore((state) => state.user);
  const basePath = getDashboardHomePath(user);
  const canRoute = user?.permissions?.includes(PERMISSIONS.FILES_REGISTER);

  const queueTabs = useMemo(
    () => [
      ...(canRoute ? [{ id: "needs-routing", name: "Needs Routing", icon: ClipboardList }] : []),
      { id: "my-assignments", name: "My Assignments", icon: UserCheck },
      { id: "overdue", name: "Overdue", icon: AlarmClockOff },
    ],
    [canRoute],
  );

  const [activeQueue, setActiveQueue] = useState(canRoute ? "needs-routing" : "my-assignments");
  const [page, setPage] = useState(1);

  // Every queue switch re-anchors to page 1 -- adjusted during render
  // (React's documented alternative to an effect for this exact case)
  // rather than an effect, which would cause an extra render pass. One
  // shared page counter is enough since only one table is on screen at a time.
  const [pageResetKey, setPageResetKey] = useState(activeQueue);
  if (pageResetKey !== activeQueue) {
    setPageResetKey(activeQueue);
    setPage(1);
  }

  const needsRoutingColumns = useMemo(() => buildNeedsRoutingColumns(basePath), [basePath]);
  const myAssignmentsColumns = useMemo(() => buildMyAssignmentsColumns(basePath), [basePath]);
  const overdueColumns = useMemo(() => buildOverdueColumns(basePath), [basePath]);

  // All queries run unconditionally (Rules of Hooks) -- the stat cards need
  // every count regardless of which tab is active; only the *active* tab's
  // query gets the live page number, the others stay pinned to page 1
  // (their table isn't rendered, only their meta.total is used). Needs
  // Routing is additionally gated by `enabled` for roles that can't route.
  const needsRoutingQuery = useFiles(
    {
      status: "REGISTERED",
      sortBy: "createdAt",
      sortOrder: "asc",
      page: activeQueue === "needs-routing" ? page : 1,
      limit: PAGE_SIZE,
    },
    { enabled: canRoute },
  );
  const myAssignmentsQuery = useFiles({
    assignedToId: user?.id,
    sortBy: "createdAt",
    sortOrder: "desc",
    page: activeQueue === "my-assignments" ? page : 1,
    limit: PAGE_SIZE,
  });
  const overdueQuery = useOverdueAssignments();
  const kpisQuery = useReportDashboardKpis();

  const activeQuery = activeQueue === "needs-routing" ? needsRoutingQuery : activeQueue === "my-assignments" ? myAssignmentsQuery : overdueQuery;

  const rows = activeQueue === "overdue" ? (overdueQuery.data ?? []) : activeQuery.data?.data ?? [];
  const columns = activeQueue === "needs-routing" ? needsRoutingColumns : activeQueue === "my-assignments" ? myAssignmentsColumns : overdueColumns;
  const meta = activeQueue === "overdue" ? null : activeQuery.data?.meta;

  const emptyCopy = {
    "needs-routing": { title: "Nothing waiting", message: "Every registered file has been routed into a workflow." },
    "my-assignments": { title: "No files assigned to you", message: "Files routed directly to you will show up here." },
    overdue: { title: "Nothing overdue", message: "Every current assignment is within its SLA window." },
  }[activeQueue];

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Workflow"
        description={canRoute ? "Files awaiting routing, your own assignments, and org-wide bottlenecks." : "Your own assignments and org-wide bottlenecks."}
        breadcrumbs={[{ label: "Dashboard", to: basePath }, { label: "Workflow" }]}
      />

      <div className={`grid grid-cols-2 ${canRoute ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-4 mb-6`}>
        {canRoute && (
          <StatCard
            icon={ClipboardList}
            tone="blue"
            label="Needs Routing"
            value={needsRoutingQuery.data?.meta?.total}
            loading={needsRoutingQuery.isLoading}
          />
        )}
        <StatCard
          icon={UserCheck}
          tone="purple"
          label="My Assignments"
          value={myAssignmentsQuery.data?.meta?.total}
          loading={myAssignmentsQuery.isLoading}
        />
        <StatCard
          icon={AlarmClockOff}
          tone="red"
          label="Overdue (Org-Wide)"
          value={overdueQuery.data?.length}
          loading={overdueQuery.isLoading}
        />
        <StatCard icon={Layers} tone="amber" label="Active Files (Org-Wide)" value={kpisQuery.data?.pending} loading={kpisQuery.isLoading} />
      </div>

      <Tabs activeTab={activeQueue} setActiveTab={setActiveQueue} tabs={queueTabs} />

      <div className="mt-5">
        <DataTable
          data={rows}
          columns={columns}
          isLoading={activeQuery.isLoading}
          isError={activeQuery.isError}
          error={activeQuery.error}
          onRetry={activeQuery.refetch}
          getRowId={(row) => row.id}
          emptyTitle={emptyCopy.title}
          emptyMessage={emptyCopy.message}
          emptyIcon={queueTabs.find((t) => t.id === activeQueue)?.icon}
        />

        {meta && !activeQuery.isLoading && !activeQuery.isError && (
          <div className={`mt-4 transition-opacity ${activeQuery.isFetching ? "opacity-60" : "opacity-100"}`}>
            <DataPagination currentPage={meta.page} totalPages={meta.totalPages} totalItems={meta.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Workflow;
