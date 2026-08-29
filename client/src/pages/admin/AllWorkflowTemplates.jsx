import { useMemo, useState } from "react";
import { Workflow, Plus } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import DataPagination from "../../components/shared/DataPagination";
import WorkflowTemplatesFilterBar from "../../components/workflowTemplates/WorkflowTemplatesFilterBar";
import { useAdminWorkflowTemplatesList } from "../../hooks/useAdminWorkflowTemplatesList";
import { useWorkflowTemplateRowActions } from "../../hooks/useWorkflowTemplateRowActions";

const DEFAULT_PAGE_SIZE = 10;
const BASE_PATH = "/admin";

const AllWorkflowTemplates = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [sorting, setSorting] = useState([]);
  const [resetKey, setResetKey] = useState(0);

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
      ...(sorting.length > 0 ? { sortBy: sorting[0].id, sortOrder: sorting[0].desc ? "desc" : "asc" } : {}),
    }),
    [page, pageSize, search, isActive, sorting],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminWorkflowTemplatesList(queryParams);
  const { columns, modals } = useWorkflowTemplateRowActions(BASE_PATH);

  const templates = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Workflow Templates"
        description="Define the routing chains a registered file can travel through -- and back."
        breadcrumbs={[{ label: "Dashboard", to: BASE_PATH }, { label: "Workflow Templates" }]}
        primaryAction={{ label: "Add Template", icon: Plus, to: `${BASE_PATH}/create-workflow-template` }}
      />

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6">
        <WorkflowTemplatesFilterBar
          key={resetKey}
          search={search}
          onSearchChange={withPageReset(setSearch)}
          isActive={isActive}
          onIsActiveChange={withPageReset(setIsActive)}
          onReset={handleReset}
        />
      </div>

      <DataTable
        data={templates}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        emptyTitle="No workflow templates yet"
        emptyMessage="Add a template, then configure its ordered steps to route files end to end."
        emptyIcon={Workflow}
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

export default AllWorkflowTemplates;
