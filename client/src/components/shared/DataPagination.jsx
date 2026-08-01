import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPaginationPages } from "../../utils/getPaginationPages";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * `totalItems`/`pageSize`/`onPageSizeChange` are optional -- omit all
 * three to get the original page-number-only bar. Passing them adds the
 * "Showing X-Y of Z" label and a rows-per-page selector, which is what
 * any server-paginated list (like the Users directory) wants.
 */
const DataPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  delta = 2,
  totalItems,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}) => {
  const showRangeInfo = typeof totalItems === "number" && typeof pageSize === "number";
  const showPageNumbers = totalPages > 1;

  if (!showRangeInfo && !showPageNumbers) return null;

  const pages = showPageNumbers ? getPaginationPages(currentPage, totalPages, delta) : [];
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems ?? 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-4 text-sm text-gray-600">
        {showRangeInfo && (
          <span>
            Showing {rangeStart} to {rangeEnd} of {totalItems} {totalItems === 1 ? "result" : "results"}
          </span>
        )}
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 whitespace-nowrap">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primaryBlue/20"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {showPageNumbers && (
        <div className="flex items-center gap-2 select-none">
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
            className={`flex items-center justify-center size-8 rounded-full transition-all
              ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={idx} className="px-2 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={currentPage === p ? "page" : undefined}
                className={`size-8 rounded-full flex items-center justify-center transition-all
                  ${
                    currentPage === p
                      ? "bg-primaryBlue text-white shadow"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
            className={`flex items-center justify-center size-8 rounded-full transition-all
              ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DataPagination;
