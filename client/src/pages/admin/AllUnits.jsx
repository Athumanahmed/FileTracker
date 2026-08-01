import { useMemo, useState } from "react";
import { Boxes, CheckCircle2, XCircle, IdCard, Plus } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import DataTable from "../../components/shared/DataTable";
import DataPagination from "../../components/shared/DataPagination";
import UnitsFilterBar from "../../components/units/UnitsFilterBar";
import { unitTableColumns } from "../../components/units/unitTableColumns";
import { useAdminUnitsList } from "../../hooks/useAdminUnitsList";
import { useUnitStats } from "../../hooks/useUnitStats";

const DEFAULT_PAGE_SIZE = 10;

const AllUnits = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
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
      ...(isActive ? { isActive } : {}),
      ...(sorting.length > 0
        ? { sortBy: sorting[0].id, sortOrder: sorting[0].desc ? "desc" : "asc" }
        : {}),
    }),
    [page, pageSize, search, departmentId, isActive, sorting],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminUnitsList(queryParams);
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useUnitStats();

  const units = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Units"
        description="Manage the organizational units within each department."
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Units" }]}
        primaryAction={{ label: "Add Unit", icon: Plus, to: "/admin/create-unit" }}
      />

      {statsError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 mb-6 text-center">
          <p className="text-sm text-red-600">Unable to load unit statistics.</p>
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
            icon={Boxes}
            tone="blue"
            label="Total Units"
            value={stats?.total?.total}
            change={stats?.total?.changePercent}
            loading={statsLoading}
          />
          <StatCard
            icon={CheckCircle2}
            tone="green"
            label="Active Units"
            value={stats?.active?.count}
            helperText={stats ? `${stats.active.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={XCircle}
            tone="amber"
            label="Inactive Units"
            value={stats?.inactive?.count}
            helperText={stats ? `${stats.inactive.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={IdCard}
            tone="purple"
            label="Total Positions"
            value={stats?.positions?.count}
            helperText="Across all units"
            loading={statsLoading}
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6">
        <UnitsFilterBar
          key={resetKey}
          search={search}
          onSearchChange={withPageReset(setSearch)}
          departmentId={departmentId}
          onDepartmentChange={withPageReset(setDepartmentId)}
          isActive={isActive}
          onIsActiveChange={withPageReset(setIsActive)}
          onReset={handleReset}
        />
      </div>

      <DataTable
        data={units}
        columns={unitTableColumns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        emptyTitle="No units found"
        emptyMessage="Try adjusting your search or filters, or add a new unit to get started."
        emptyIcon={Boxes}
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

export default AllUnits;
