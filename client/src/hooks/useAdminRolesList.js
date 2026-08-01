import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getRoles } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/**
 * Server-paginated Roles directory listing -- distinct from useRoles.js,
 * which fetches a fixed isActive-only lookup for dropdowns. `params`
 * (page, limit, search, isActive, isSystem, sortBy, sortOrder) maps 1:1
 * onto GET /api/v1/roles' query params.
 */
export const useAdminRolesList = (params) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-roles-list", params],
    queryFn: async () => {
      const { data } = await getRoles(accessToken, params);
      return data;
    },
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.SHORT,
  });
};
