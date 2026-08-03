import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getFiles } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/**
 * Generic Files list/Advanced Search hook -- params passthrough to
 * GET /api/v1/files (search, status, priority, departmentId, categoryId,
 * assignedToId, dateFrom/dateTo, sortBy/sortOrder, page/limit). Returns the
 * raw response body ({ data: items, meta }), same convention as
 * useAdminDepartmentsList -- callers read `.data` for rows, `.meta` for
 * pagination. Reused as-is by the Files list page and by dashboards (which
 * just pass a small `limit` + `sortBy: "createdAt"` for a "recent files" widget).
 *
 * `enabled` lets a caller skip the request entirely (e.g. the Workflow
 * page's "Needs Routing" queue, which only applies to roles that hold
 * FILES.REGISTER) while still satisfying the Rules of Hooks.
 */
export const useFiles = (params = {}, { enabled = true } = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["files", params],
    queryFn: async () => {
      const { data } = await getFiles(accessToken, params);
      return data;
    },
    enabled: Boolean(accessToken) && enabled,
    staleTime: STALE_TIME.SHORT,
    placeholderData: keepPreviousData,
  });
};
