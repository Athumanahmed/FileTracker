import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAdminUsers } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/**
 * `params` (page, limit, search, isActive, status, departmentId, unitId,
 * roleCode, sortBy, sortOrder) is the whole query key -- switching back to
 * a filter/page combo already fetched this session resolves from cache
 * instantly. `keepPreviousData` keeps the current table showing while a
 * new page/filter is in flight instead of flashing a loading skeleton, so
 * paging feels instant even though it's a real server round trip.
 */
export const useAdminUsersList = (params) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-users-list", params],
    queryFn: async () => {
      const { data } = await getAdminUsers(accessToken, params);
      return data;
    },
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.SHORT,
  });
};
