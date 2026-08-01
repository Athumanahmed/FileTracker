import { useMemo, useState } from "react";
import { IdCard, CheckCircle2, UserX, UserCheck, Plus } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import DataTable from "../../components/shared/DataTable";
import DataPagination from "../../components/shared/DataPagination";
import PositionsFilterBar from "../../components/positions/PositionsFilterBar";
import { positionTableColumns } from "../../components/positions/positionTableColumns";
import { useAdminPositionsList } from "../../hooks/useAdminPositionsList";
import { usePositionStats } from "../../hooks/usePositionStats";

const DEFAULT_PAGE_SIZE = 10;

const AllPositions = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [positionType, setPositionType] = useState("");
  const [isActive, setIsActive] = useState("");
  const [sorting, setSorting] = useState([]);
  const [resetKey, setResetKey] = useState(0);

  // Every filter change re-anchors to page 1 -- staying on e.g. page 5 of
  // a now much-smaller filtered result set would just show an empty page.
  const withPageReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setDepartmentId("");
    setUnitId("");
    setPositionType("");
    setIsActive("");
    setPage(1);
    setResetKey((key) => key + 1);
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(search ? { search } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(unitId ? { unitId } : {}),
      ...(positionType ? { positionType } : {}),
      ...(isActive ? { isActive } : {}),
      ...(sorting.length > 0
        ? { sortBy: sorting[0].id, sortOrder: sorting[0].desc ? "desc" : "asc" }
        : {}),
    }),
    [page, pageSize, search, departmentId, unitId, positionType, isActive, sorting],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminPositionsList(queryParams);
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = usePositionStats();

  const positions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Positions"
        description="Manage organizational positions and their assignment status."
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Positions" }]}
        primaryAction={{ label: "Add Position", icon: Plus, to: "/admin/create-position" }}
      />

      {statsError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 mb-6 text-center">
          <p className="text-sm text-red-600">Unable to load position statistics.</p>
          <button
            type="button"
            onClick={() => refetchStats()}
            className="mt-1.5 text-sm font-semibold text-red-700 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={IdCard}
            tone="blue"
            label="Total Positions"
            value={stats?.total?.total}
            change={stats?.total?.changePercent}
            loading={statsLoading}
          />
          <StatCard
            icon={CheckCircle2}
            tone="green"
            label="Active Positions"
            value={stats?.active?.count}
            helperText={stats ? `${stats.active.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={UserX}
            tone="amber"
            label="Vacant Positions"
            value={stats?.vacant?.count}
            helperText={stats ? `${stats.vacant.percent}% of active` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={UserCheck}
            tone="purple"
            label="Filled Positions"
            value={stats?.filled?.count}
            helperText={stats ? `${stats.filled.percent}% of active` : undefined}
            loading={statsLoading}
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6">
        <PositionsFilterBar
          key={resetKey}
          search={search}
          onSearchChange={withPageReset(setSearch)}
          departmentId={departmentId}
          onDepartmentChange={withPageReset(setDepartmentId)}
          unitId={unitId}
          onUnitChange={withPageReset(setUnitId)}
          positionType={positionType}
          onPositionTypeChange={withPageReset(setPositionType)}
          isActive={isActive}
          onIsActiveChange={withPageReset(setIsActive)}
          onReset={handleReset}
        />
      </div>

      <DataTable
        data={positions}
        columns={positionTableColumns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        emptyTitle="No positions found"
        emptyMessage="Try adjusting your search or filters, or add a new position to get started."
        emptyIcon={IdCard}
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

export default AllPositions;
