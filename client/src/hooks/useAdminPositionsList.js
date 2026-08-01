import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getPositions } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/**
 * Server-paginated Positions directory listing. `params` (page, limit,
 * search, isActive, departmentId, unitId, positionType, sortBy, sortOrder)
 * maps 1:1 onto GET /api/v1/positions' query params.
 */
export const useAdminPositionsList = (params) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-positions-list", params],
    queryFn: async () => {
      const { data } = await getPositions(accessToken, params);
      return data;
    },
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.SHORT,
  });
};
