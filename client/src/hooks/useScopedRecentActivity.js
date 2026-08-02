import { useQuery } from "@tanstack/react-query";
import { getScopedRecentActivity } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** The logged-in HOD/Supervisor's own recent actions (not their whole department/unit's). */
export const useScopedRecentActivity = (limit = 10) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["scoped-recent-activity", limit],
    queryFn: async () => {
      const { data } = await getScopedRecentActivity(accessToken, limit);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.REALTIME,
  });
};
