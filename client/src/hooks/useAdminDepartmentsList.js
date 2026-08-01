import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getDepartments } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/**
 * Server-paginated Departments directory listing -- distinct from
 * useDepartments.js, which fetches a fixed isActive-only lookup for
 * dropdowns. `params` (page, limit, search, isActive, sortBy, sortOrder)
 * maps 1:1 onto GET /api/v1/departments' query params, so switching back to
 * an already-fetched page/filter combo resolves from cache instantly.
 */
export const useAdminDepartmentsList = (params) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-departments-list", params],
    queryFn: async () => {
      const { data } = await getDepartments(accessToken, params);
      return data;
    },
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.SHORT,
  });
};
