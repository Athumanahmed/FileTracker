import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAdminAuditLogs } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/**
 * Server-paginated Audit Logs page listing. `params` (page, limit, search,
 * entity, dateFrom, dateTo, sortOrder) maps 1:1 onto GET
 * /api/v1/dashboard/admin/audit-logs' query params.
 */
export const useAdminAuditLogs = (params) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-audit-logs", params],
    queryFn: async () => {
      const { data } = await getAdminAuditLogs(accessToken, params);
      return data;
    },
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.SHORT,
  });
};
