import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Users, UserCheck, UserX, Lock, Plus, Upload } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import DataTable from "../../components/shared/DataTable";
import DataPagination from "../../components/shared/DataPagination";
import UsersFilterBar from "../../components/users/UsersFilterBar";
import { userTableColumns } from "../../components/users/userTableColumns";
import { useAdminUsersList } from "../../hooks/useAdminUsersList";
import { useAdminUserStats } from "../../hooks/useAdminUserStats";

const DEFAULT_PAGE_SIZE = 10;

const SystemUsers = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [status, setStatus] = useState("");
  const [roleCode, setRoleCode] = useState("");
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
    setStatus("");
    setRoleCode("");
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
      ...(status ? { status } : {}),
      ...(roleCode ? { roleCode } : {}),
      ...(sorting.length > 0
        ? { sortBy: sorting[0].id, sortOrder: sorting[0].desc ? "desc" : "asc" }
        : {}),
    }),
    [page, pageSize, search, departmentId, unitId, status, roleCode, sorting],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminUsersList(queryParams);
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } =
    useAdminUserStats();

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Users"
        description="Manage system users, their roles and access permissions."
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Users" }]}
        secondaryActions={[
          {
            label: "Import Users",
            icon: Upload,
            onClick: () => toast("Bulk user import is coming soon."),
          },
        ]}
        primaryAction={{ label: "Create New User", icon: Plus, to: "/admin/create-users" }}
      />

      {statsError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 mb-6 text-center">
          <p className="text-sm text-red-600">Unable to load user statistics.</p>
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
            icon={Users}
            tone="blue"
            label="Total Users"
            value={stats?.total?.total}
            change={stats?.total?.changePercent}
            loading={statsLoading}
          />
          <StatCard
            icon={UserCheck}
            tone="green"
            label="Active Users"
            value={stats?.active?.count}
            helperText={stats ? `${stats.active.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={UserX}
            tone="amber"
            label="Inactive Users"
            value={stats?.inactive?.count}
            helperText={stats ? `${stats.inactive.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={Lock}
            tone="red"
            label="Locked Users"
            value={stats?.locked?.count}
            helperText={stats ? `${stats.locked.percent}% of total` : undefined}
            loading={statsLoading}
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6">
        <UsersFilterBar
          key={resetKey}
          search={search}
          onSearchChange={withPageReset(setSearch)}
          departmentId={departmentId}
          onDepartmentChange={withPageReset(setDepartmentId)}
          unitId={unitId}
          onUnitChange={withPageReset(setUnitId)}
          status={status}
          onStatusChange={withPageReset(setStatus)}
          roleCode={roleCode}
          onRoleChange={withPageReset(setRoleCode)}
          onReset={handleReset}
        />
      </div>

      <DataTable
        data={users}
        columns={userTableColumns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        emptyTitle="No users found"
        emptyMessage="Try adjusting your search or filters, or create a new user to get started."
        emptyIcon={Users}
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

export default SystemUsers;
