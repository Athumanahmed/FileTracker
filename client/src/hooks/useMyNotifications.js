import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMyNotifications } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Raw response body ({ data: items, meta: { ...pagination, unreadCount } }). params: page, limit, isRead. */
export const useMyNotifications = (params = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["my-notifications", params],
    queryFn: async () => {
      const { data } = await getMyNotifications(accessToken, params);
      return data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.REALTIME,
    placeholderData: keepPreviousData,
  });
};
