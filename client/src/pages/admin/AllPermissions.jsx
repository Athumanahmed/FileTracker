import { useMemo, useState } from "react";
import { KeyRound, CheckCircle2, XCircle, Unlink, Plus } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import DataTable from "../../components/shared/DataTable";
import DataPagination from "../../components/shared/DataPagination";
import PermissionsFilterBar from "../../components/permissions/PermissionsFilterBar";
import { permissionTableColumns } from "../../components/permissions/permissionTableColumns";
import { useAdminPermissionsList } from "../../hooks/useAdminPermissionsList";
import { usePermissionStats } from "../../hooks/usePermissionStats";

const DEFAULT_PAGE_SIZE = 10;

const AllPermissions = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
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
    setModule("");
    setIsActive("");
    setPage(1);
    setResetKey((key) => key + 1);
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(search ? { search } : {}),
      ...(module ? { module } : {}),
      ...(isActive ? { isActive } : {}),
      ...(sorting.length > 0
        ? { sortBy: sorting[0].id, sortOrder: sorting[0].desc ? "desc" : "asc" }
        : {}),
    }),
    [page, pageSize, search, module, isActive, sorting],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminPermissionsList(queryParams);
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } =
    usePermissionStats();

  const permissions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Permissions"
        description="Manage system permissions and which roles they're granted to."
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Permissions" }]}
        primaryAction={{ label: "Add Permission", icon: Plus, to: "/admin/create-permission" }}
      />

      {statsError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 mb-6 text-center">
          <p className="text-sm text-red-600">Unable to load permission statistics.</p>
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
            icon={KeyRound}
            tone="blue"
            label="Total Permissions"
            value={stats?.total?.total}
            change={stats?.total?.changePercent}
            loading={statsLoading}
          />
          <StatCard
            icon={CheckCircle2}
            tone="green"
            label="Active Permissions"
            value={stats?.active?.count}
            helperText={stats ? `${stats.active.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={XCircle}
            tone="amber"
            label="Inactive Permissions"
            value={stats?.inactive?.count}
            helperText={stats ? `${stats.inactive.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={Unlink}
            tone="purple"
            label="Unassigned"
            value={stats?.unassigned?.count}
            helperText="Not granted to any role"
            loading={statsLoading}
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6">
        <PermissionsFilterBar
          key={resetKey}
          search={search}
          onSearchChange={withPageReset(setSearch)}
          module={module}
          onModuleChange={withPageReset(setModule)}
          isActive={isActive}
          onIsActiveChange={withPageReset(setIsActive)}
          onReset={handleReset}
        />
      </div>

      <DataTable
        data={permissions}
        columns={permissionTableColumns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        emptyTitle="No permissions found"
        emptyMessage="Try adjusting your search or filters."
        emptyIcon={KeyRound}
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

export default AllPermissions;
