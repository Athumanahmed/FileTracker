import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getUnits } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/**
 * Server-paginated Units directory listing -- distinct from useUnits.js,
 * which fetches a fixed isActive-only lookup for dropdowns. `params`
 * (page, limit, search, isActive, departmentId, sortBy, sortOrder) maps
 * 1:1 onto GET /api/v1/units' query params.
 */
export const useAdminUnitsList = (params) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-units-list", params],
    queryFn: async () => {
      const { data } = await getUnits(accessToken, params);
      return data;
    },
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.SHORT,
  });
};
