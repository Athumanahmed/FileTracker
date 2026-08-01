import { useQuery } from "@tanstack/react-query";
import { getAdminRecentActivity } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

export const useAdminRecentActivity = (limit = 10) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-recent-activity", limit],
    queryFn: async () => {
      const { data } = await getAdminRecentActivity(accessToken, limit);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.REALTIME,
  });
};
