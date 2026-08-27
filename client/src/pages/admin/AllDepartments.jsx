import { useMemo, useState } from "react";
import { Building2, CheckCircle2, XCircle, Boxes, Plus } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import DataTable from "../../components/shared/DataTable";
import DataPagination from "../../components/shared/DataPagination";
import DepartmentsFilterBar from "../../components/departments/DepartmentsFilterBar";
import { useAdminDepartmentsList } from "../../hooks/useAdminDepartmentsList";
import { useDepartmentStats } from "../../hooks/useDepartmentStats";
import { useDepartmentRowActions } from "../../hooks/useDepartmentRowActions";

const DEFAULT_PAGE_SIZE = 10;

const AllDepartments = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
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
    setIsActive("");
    setPage(1);
    setResetKey((key) => key + 1);
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(search ? { search } : {}),
      ...(isActive ? { isActive } : {}),
      ...(sorting.length > 0
        ? { sortBy: sorting[0].id, sortOrder: sorting[0].desc ? "desc" : "asc" }
        : {}),
    }),
    [page, pageSize, search, isActive, sorting],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminDepartmentsList(queryParams);
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } =
    useDepartmentStats();
  const { columns, modals } = useDepartmentRowActions();

  const departments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Departments"
        description="Manage the council's organizational departments and their units."
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Departments" }]}
        primaryAction={{ label: "Add Department", icon: Plus, to: "/admin/create-department" }}
      />

      {statsError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 mb-6 text-center">
          <p className="text-sm text-red-600">Unable to load department statistics.</p>
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
            icon={Building2}
            tone="blue"
            label="Total Departments"
            value={stats?.total?.total}
            change={stats?.total?.changePercent}
            loading={statsLoading}
          />
          <StatCard
            icon={CheckCircle2}
            tone="green"
            label="Active Departments"
            value={stats?.active?.count}
            helperText={stats ? `${stats.active.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={XCircle}
            tone="amber"
            label="Inactive Departments"
            value={stats?.inactive?.count}
            helperText={stats ? `${stats.inactive.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={Boxes}
            tone="purple"
            label="Total Units"
            value={stats?.units?.count}
            helperText="Across all departments"
            loading={statsLoading}
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6">
        <DepartmentsFilterBar
          key={resetKey}
          search={search}
          onSearchChange={withPageReset(setSearch)}
          isActive={isActive}
          onIsActiveChange={withPageReset(setIsActive)}
          onReset={handleReset}
        />
      </div>

      <DataTable
        data={departments}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        emptyTitle="No departments found"
        emptyMessage="Try adjusting your search or filters, or add a new department to get started."
        emptyIcon={Building2}
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

      {modals}
    </div>
  );
};

export default AllDepartments;
