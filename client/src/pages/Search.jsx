import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, FileText, Users, Loader2, AlertTriangle } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import useAuthStore from "../store/authStore";
import { getDashboardHomePath } from "../utils/dashboardHome";
import { getFileStatusMeta, getFilePriorityMeta } from "../utils/fileStatusMeta";
import { formatDateTime } from "../utils/formatters";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import useDebounce from "../hooks/useDebounce";

const MIN_TERM_LENGTH = 2;

const FileResultCard = ({ file, basePath }) => {
  const status = getFileStatusMeta(file.status);
  const priority = getFilePriorityMeta(file.priority);

  return (
    <Link
      to={`${basePath}/files/${file.id}`}
      className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primaryBlue/40 hover:shadow-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
        <FileText size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-gray-900 truncate">{file.title}</p>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.badgeClass}`}>
            {status.label}
          </span>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${priority.badgeClass}`}>
            {priority.label}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>File No: {file.fileNumber}</span>
          {file.registryNumber && <span>Reg No: {file.registryNumber}</span>}
          {file.trackingNumber && <span>Tracking No: {file.trackingNumber}</span>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {file.department?.name && <span>{file.department.name}</span>}
          {file.category?.name && <span>{file.category.name}</span>}
          <span>Registered {formatDateTime(file.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
};

const CitizenResultCard = ({ citizen }) => (
  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
      <Users size={18} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-gray-900 truncate">{citizen.fullName}</p>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>Citizen No: {citizen.citizenNumber}</span>
        {citizen.phoneNumber && <span>{citizen.phoneNumber}</span>}
        {citizen.nationalId && <span>NIDA: {citizen.nationalId}</span>}
      </div>
    </div>
  </div>
);

/**
 * Enterprise-style Global Search -- shared across every role holding
 * FILES.READ (same role set as Files.jsx). Backed by GET /api/v1/search
 * (search.service.js), which is cache-aside over Redis, so repeated terms
 * across users skip the Postgres fan-out. The `q` param round-trips into
 * the URL so a result page is shareable/bookmarkable and survives a
 * refresh, unlike a purely local input state.
 */
const SearchPage = () => {
  const user = useAuthStore((state) => state.user);
  const basePath = getDashboardHomePath(user);

  const [searchParams, setSearchParams] = useSearchParams();
  const [term, setTerm] = useState(searchParams.get("q") || "");
  const debouncedTerm = useDebounce(term, 400);

  const trimmed = debouncedTerm.trim();
  const isTermTooShort = trimmed.length > 0 && trimmed.length < MIN_TERM_LENGTH;

  const { data, isLoading, isFetching, isError, refetch } = useGlobalSearch(debouncedTerm);

  const handleChange = (event) => {
    const value = event.target.value;
    setTerm(value);
    setSearchParams(value ? { q: value } : {}, { replace: true });
  };

  const files = data?.files ?? [];
  const citizens = data?.citizens ?? [];
  const hasResults = files.length > 0 || citizens.length > 0;
  const hasSearched = trimmed.length >= MIN_TERM_LENGTH;

  const resultsSummary = useMemo(() => {
    if (!hasSearched || !data) return null;
    return `${files.length + citizens.length} result${files.length + citizens.length === 1 ? "" : "s"} for "${trimmed}"`;
  }, [hasSearched, data, files.length, citizens.length, trimmed]);

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Search"
        description="Find a file or citizen by file number, registry number, tracking number, title, name, phone or NIDA."
        breadcrumbs={[{ label: "Dashboard", to: basePath }, { label: "Search" }]}
      />

      <div className="relative max-w-2xl">
        <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          autoFocus
          value={term}
          onChange={handleChange}
          placeholder="Search by file number, registry number, tracking number, title, citizen name..."
          className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-primaryBlue focus:ring-2 focus:ring-primaryBlue/20"
        />
        {isFetching && !isLoading && (
          <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primaryBlue" />
        )}
      </div>

      {isTermTooShort && <p className="mt-3 text-sm text-gray-500">Keep typing -- at least {MIN_TERM_LENGTH} characters needed.</p>}

      {resultsSummary && <p className="mt-4 text-sm font-medium text-gray-600">{resultsSummary}</p>}

      {hasSearched && isLoading && (
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Searching...</span>
        </div>
      )}

      {hasSearched && isError && !isLoading && (
        <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-2 text-red-500" size={22} />
          <p className="text-sm text-red-600">Something went wrong while searching.</p>
          <button type="button" onClick={() => refetch()} className="mt-1.5 text-sm font-semibold text-red-700 hover:underline">
            Try again
          </button>
        </div>
      )}

      {hasSearched && !isLoading && !isError && !hasResults && (
        <EmptyState
          title="No matches found"
          message="Try a different file number, registry number, tracking number, title or citizen detail."
          icon={SearchIcon}
        />
      )}

      {hasSearched && !isLoading && !isError && hasResults && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {files.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText size={16} /> Files ({files.length})
              </h2>
              <div className="flex flex-col gap-3">
                {files.map((file) => (
                  <FileResultCard key={file.id} file={file} basePath={basePath} />
                ))}
              </div>
            </div>
          )}

          {citizens.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users size={16} /> Citizens ({citizens.length})
              </h2>
              <div className="flex flex-col gap-3">
                {citizens.map((citizen) => (
                  <CitizenResultCard key={citizen.id} citizen={citizen} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
