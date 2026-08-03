import { useMemo, useState } from "react";
import { FolderOpen, Clock, CheckCircle2, AlertTriangle, FilePlus2 } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import DataTable from "../../components/shared/DataTable";
import DataPagination from "../../components/shared/DataPagination";
import FilesFilterBar from "../../components/files/FilesFilterBar";
import { buildFileTableColumns } from "../../components/files/fileTableColumns";
import { useFiles } from "../../hooks/useFiles";
import { useReportDashboardKpis } from "../../hooks/useReportDashboardKpis";

const DEFAULT_PAGE_SIZE = 10;

const AllFiles = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }]);
  const [resetKey, setResetKey] = useState(0);

  // Every filter change re-anchors to page 1 -- staying on e.g. page 5 of a
  // now much-smaller filtered result set would just show an empty page.
  const withPageReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setPage(1);
    setResetKey((key) => key + 1);
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(sorting.length > 0 ? { sortBy: sorting[0].id, sortOrder: sorting[0].desc ? "desc" : "asc" } : {}),
    }),
    [page, pageSize, search, status, priority, sorting],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useFiles(queryParams);
  const { data: kpis, isLoading: kpisLoading, isError: kpisError, refetch: refetchKpis } = useReportDashboardKpis();
  const columns = useMemo(() => buildFileTableColumns("/registry/files"), []);

  const files = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Files"
        description="Every file registered into the system -- search, filter and track its status."
        breadcrumbs={[{ label: "Dashboard", to: "/registry" }, { label: "Files" }]}
        primaryAction={{ label: "Register File", icon: FilePlus2, to: "/registry/files/new" }}
      />

      {kpisError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 mb-6 text-center">
          <p className="text-sm text-red-600">Unable to load file statistics.</p>
          <button
            type="button"
            onClick={() => refetchKpis()}
            className="mt-1.5 text-sm font-semibold text-red-700 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon={FolderOpen} tone="blue" label="Total Files" value={kpis?.totalFiles} loading={kpisLoading} />
          <StatCard icon={Clock} tone="amber" label="Pending" value={kpis?.pending} loading={kpisLoading} />
          <StatCard icon={CheckCircle2} tone="green" label="Completed" value={kpis?.completed} loading={kpisLoading} />
          <StatCard icon={AlertTriangle} tone="red" label="Overdue" value={kpis?.overdue} loading={kpisLoading} />
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6">
        <FilesFilterBar
          key={resetKey}
          search={search}
          onSearchChange={withPageReset(setSearch)}
          status={status}
          onStatusChange={withPageReset(setStatus)}
          priority={priority}
          onPriorityChange={withPageReset(setPriority)}
          onReset={handleReset}
        />
      </div>

      <DataTable
        data={files}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        emptyTitle="No files found"
        emptyMessage="Try adjusting your search or filters, or register a new file to get started."
        emptyIcon={FolderOpen}
      />

      {!isLoading && !isError && meta && (
        <div className={`mt-4 transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
          <DataPagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AllFiles;
