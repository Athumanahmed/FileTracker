import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useRef, useState } from "react";
import { useClickAway } from "react-use";
import { ArrowUp, ArrowDown, ArrowUpDown, Columns } from "lucide-react";
import TableSkeleton from "./TableSkeleton";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";

const resolveUpdater = (updater, prev) => (typeof updater === "function" ? updater(prev) : updater);

/**
 * Enterprise-grade data table -- column visibility toggle, sortable
 * headers, and an optional selection column, all on top of TanStack
 * Table. Two modes for both sorting and pagination:
 *
 *  - Uncontrolled (default): sorts client-side over whatever `data` it's
 *    given. Fine for small, fully-loaded datasets.
 *  - Controlled (`manualSorting` + `sorting`/`onSortingChange`): the
 *    table only renders whatever order `data` already arrives in and
 *    reports sort-header clicks upward -- required whenever `data` is one
 *    server-paginated page, since client-side sorting a single page would
 *    silently only sort *that* page instead of the whole dataset.
 *
 * Pagination itself is deliberately NOT this component's job -- render
 * DataPagination (or anything else) alongside it, driven by the same
 * page state that feeds the query producing `data`.
 */
const DataTable = ({
  data = [],
  columns = [],
  isLoading = false,
  isError = false,
  error = null,
  emptyTitle = "No Data",
  emptyMessage = "No records found",
  emptyIcon,
  onRetry,
  skeletonRows = 8,
  manualSorting = false,
  sorting: controlledSorting,
  onSortingChange: controlledOnSortingChange,
  enableRowSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange: controlledOnRowSelectionChange,
  getRowId,
  stickyHeader = true,
}) => {
  const [internalSorting, setInternalSorting] = useState([]);
  const [internalRowSelection, setInternalRowSelection] = useState({});
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef(null);
  useClickAway(columnMenuRef, () => setIsColumnMenuOpen(false));

  const sorting = controlledSorting ?? internalSorting;
  const rowSelection = controlledRowSelection ?? internalRowSelection;

  const handleSortingChange = (updater) => {
    const next = resolveUpdater(updater, sorting);
    (controlledOnSortingChange ?? setInternalSorting)(next);
  };

  const handleRowSelectionChange = (updater) => {
    const next = resolveUpdater(updater, rowSelection);
    (controlledOnRowSelectionChange ?? setInternalRowSelection)(next);
  };

  const initialVisibility = useMemo(
    () => Object.fromEntries(columns.map((col) => [col.id, col.meta?.visible ?? true])),
    [columns],
  );
  const [columnVisibility, setColumnVisibility] = useState(initialVisibility);

  const selectionColumn = useMemo(
    () => ({
      id: "__select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="size-4 rounded border-gray-300 text-primaryBlue focus:ring-primaryBlue/30"
          checked={table.getIsAllRowsSelected()}
          ref={(el) => el && (el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected())}
          onChange={table.getToggleAllRowsSelectedHandler()}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="size-4 rounded border-gray-300 text-primaryBlue focus:ring-primaryBlue/30"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    [],
  );

  const tableColumns = useMemo(
    () => (enableRowSelection ? [selectionColumn, ...columns] : columns),
    [enableRowSelection, selectionColumn, columns],
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnVisibility, ...(enableRowSelection ? { rowSelection } : {}) },
    manualSorting,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    ...(enableRowSelection ? { enableRowSelection: true, onRowSelectionChange: handleRowSelectionChange } : {}),
    ...(getRowId ? { getRowId } : {}),
    getCoreRowModel: getCoreRowModel(),
    ...(manualSorting ? {} : { getSortedRowModel: getSortedRowModel() }),
  });

  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} columns={tableColumns.length || 6} />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} title="Failed to load data" />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} icon={emptyIcon} />;
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-end items-center mb-3">
        <div className="relative" ref={columnMenuRef}>
          <button
            type="button"
            onClick={() => setIsColumnMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Columns className="size-4" />
            Columns
          </button>

          {isColumnMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1.5">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Toggle Columns
              </p>
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-gray-300 text-primaryBlue focus:ring-primaryBlue/30"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                    />
                    {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                  </label>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-auto bg-white border border-gray-100 rounded-2xl">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className={`bg-gray-50 ${stickyHeader ? "sticky top-0 z-10" : ""}`}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      <div
                        className={`flex items-center gap-1.5 ${canSort ? "cursor-pointer select-none hover:text-gray-700" : ""}`}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sortDirection === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 text-gray-300" />
                          ))}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 sm:px-6 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
