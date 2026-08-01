import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getPermissions } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/**
 * Server-paginated Permissions directory listing. `params` (page, limit,
 * search, isActive, module, sortBy, sortOrder) maps 1:1 onto
 * GET /api/v1/permissions' query params.
 */
export const useAdminPermissionsList = (params) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-permissions-list", params],
    queryFn: async () => {
      const { data } = await getPermissions(accessToken, params);
      return data;
    },
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.SHORT,
  });
};
