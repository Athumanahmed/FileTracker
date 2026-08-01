import { useMemo, useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Lock, Plus } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import DataTable from "../../components/shared/DataTable";
import DataPagination from "../../components/shared/DataPagination";
import RolesFilterBar from "../../components/roles/RolesFilterBar";
import { roleTableColumns } from "../../components/roles/roleTableColumns";
import { useAdminRolesList } from "../../hooks/useAdminRolesList";
import { useRoleStats } from "../../hooks/useRoleStats";

const DEFAULT_PAGE_SIZE = 10;

const AllRoles = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [isSystem, setIsSystem] = useState("");
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
    setIsSystem("");
    setIsActive("");
    setPage(1);
    setResetKey((key) => key + 1);
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(search ? { search } : {}),
      ...(isSystem ? { isSystem } : {}),
      ...(isActive ? { isActive } : {}),
      ...(sorting.length > 0
        ? { sortBy: sorting[0].id, sortOrder: sorting[0].desc ? "desc" : "asc" }
        : {}),
    }),
    [page, pageSize, search, isSystem, isActive, sorting],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminRolesList(queryParams);
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useRoleStats();

  const roles = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Roles"
        description="Manage system roles and their assignment across users."
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Roles" }]}
        primaryAction={{ label: "Add Role", icon: Plus, to: "/admin/create-role" }}
      />

      {statsError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 mb-6 text-center">
          <p className="text-sm text-red-600">Unable to load role statistics.</p>
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
            icon={ShieldCheck}
            tone="blue"
            label="Total Roles"
            value={stats?.total?.total}
            change={stats?.total?.changePercent}
            loading={statsLoading}
          />
          <StatCard
            icon={CheckCircle2}
            tone="green"
            label="Active Roles"
            value={stats?.active?.count}
            helperText={stats ? `${stats.active.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={XCircle}
            tone="amber"
            label="Inactive Roles"
            value={stats?.inactive?.count}
            helperText={stats ? `${stats.inactive.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={Lock}
            tone="purple"
            label="System Roles"
            value={stats?.system?.count}
            helperText="Built-in, cannot be deactivated"
            loading={statsLoading}
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6">
        <RolesFilterBar
          key={resetKey}
          search={search}
          onSearchChange={withPageReset(setSearch)}
          isSystem={isSystem}
          onIsSystemChange={withPageReset(setIsSystem)}
          isActive={isActive}
          onIsActiveChange={withPageReset(setIsActive)}
          onReset={handleReset}
        />
      </div>

      <DataTable
        data={roles}
        columns={roleTableColumns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        emptyTitle="No roles found"
        emptyMessage="Try adjusting your search or filters, or add a new role to get started."
        emptyIcon={ShieldCheck}
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

export default AllRoles;
