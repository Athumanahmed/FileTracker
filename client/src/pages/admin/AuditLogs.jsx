import { useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ScrollText, ChevronDown, MapPin, Fingerprint } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import DataPagination from "../../components/shared/DataPagination";
import EmptyState from "../../components/shared/EmptyState";
import AuditLogsFilterBar from "../../components/dashboard/AuditLogsFilterBar";
import { useAdminAuditLogs } from "../../hooks/useAdminAuditLogs";
import { getAuditLogIcon } from "../../utils/auditLogIcons";
import { formatDateTime } from "../../utils/formatters";

dayjs.extend(relativeTime);

const DEFAULT_PAGE_SIZE = 20;

const ENTITY_BADGE_CLASS =
  "inline-flex items-center rounded-full bg-primaryBlueLight px-2 py-0.5 text-[11px] font-semibold text-primaryBlue whitespace-nowrap";

/** { before, after } snapshot (see server's AuditLog.metadata) rendered as two side-by-side JSON blocks -- most CRUD actions only ever populate one or the other, so an empty side just doesn't render. */
const MetadataDiff = ({ metadata }) => {
  if (!metadata || (!metadata.before && !metadata.after)) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      {metadata.before && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Before</p>
          <pre className="rounded-lg bg-gray-50 border border-gray-100 p-2.5 text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(metadata.before, null, 2)}
          </pre>
        </div>
      )}
      {metadata.after && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">After</p>
          <pre className="rounded-lg bg-gray-50 border border-gray-100 p-2.5 text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(metadata.after, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

/**
 * Full Audit Logs listing -- reached from the dashboard's Recent Activities
 * card ("View All Activities") and directly at /admin/audit-logs. Unlike
 * that card's fixed-size feed, this is a real filterable/searchable/
 * paginated view over the whole log, with each entry expandable to its
 * raw action/entityId/IP/before-after metadata.
 */
const AuditLogs = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [resetKey, setResetKey] = useState(0);
  // Which entries have their action/entityId/IP/before-after metadata
  // expanded -- a Set (not one active id) so more than one can be open at
  // once, same as a normal accordion-of-many-panels.
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const toggleExpanded = (id) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const withPageReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setEntity("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setResetKey((key) => key + 1);
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(search ? { search } : {}),
      ...(entity ? { entity } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [page, pageSize, search, entity, dateFrom, dateTo],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminAuditLogs(queryParams);
  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Audit Logs"
        description="Every recorded system action -- who did what, and when."
        icon={ScrollText}
        breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Audit Logs" }]}
      />

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6">
        <AuditLogsFilterBar
          key={resetKey}
          search={search}
          onSearchChange={withPageReset(setSearch)}
          entity={entity}
          onEntityChange={withPageReset(setEntity)}
          dateFrom={dateFrom}
          onDateFromChange={withPageReset(setDateFrom)}
          dateTo={dateTo}
          onDateToChange={withPageReset(setDateTo)}
          onReset={handleReset}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100" />
              <div className="flex-1 h-16 rounded-xl bg-gray-100" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error?.response?.data?.message || "Unable to load audit logs."}</p>
          <button type="button" onClick={() => refetch()} className="mt-1.5 text-sm font-semibold text-red-700 hover:underline">
            Try again
          </button>
        </div>
      ) : logs.length ? (
        <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
          <ol className="relative">
            {logs.map((log) => {
              const Icon = getAuditLogIcon(log);
              const hasDetail = Boolean(log.metadata?.before || log.metadata?.after || log.ipAddress);
              const expanded = expandedIds.has(log.id);

              return (
                <li key={log.id} className="relative pl-10 pb-6 last:pb-0">
                  <span className="absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
                    <Icon size={15} />
                  </span>

                  <div className="rounded-xl border border-gray-100 bg-white p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 leading-snug">{log.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(log.createdAt)} ({dayjs(log.createdAt).fromNow()}) &middot; by{" "}
                          {log.performedBy?.fullName || log.performedBy?.username || "System"}
                        </p>
                      </div>
                      <span className={ENTITY_BADGE_CLASS}>{log.entity}</span>
                    </div>

                    {hasDetail && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleExpanded(log.id)}
                          className="mt-2.5 flex items-center gap-1 text-xs font-medium text-primaryBlue hover:underline"
                        >
                          <ChevronDown size={13} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                          {expanded ? "Hide details" : "View details"}
                        </button>

                        {expanded && (
                          <div className="mt-1">
                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <Fingerprint size={12} />
                                Action: <span className="font-mono text-gray-600">{log.action}</span>
                              </span>
                              {log.entityId && (
                                <span className="inline-flex items-center gap-1">
                                  Entity ID: <span className="font-mono text-gray-600">{log.entityId}</span>
                                </span>
                              )}
                              {log.ipAddress && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin size={12} />
                                  IP: <span className="font-mono text-gray-600">{log.ipAddress}</span>
                                </span>
                              )}
                            </div>
                            <MetadataDiff metadata={log.metadata} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <EmptyState
          title="No activity found"
          message="Try adjusting your search or filters."
          icon={ScrollText}
        />
      )}

      {!isLoading && !isError && meta && (
        <div className="mt-4">
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

export default AuditLogs;
