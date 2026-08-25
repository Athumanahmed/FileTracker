import { useQuery } from "@tanstack/react-query";
import { getMyRecentActivity } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** The logged-in user's own recent actions -- works for any role, unlike useScopedRecentActivity (HOD/Supervisor only, DASHBOARD.READ_SCOPED_SUMMARY-gated). Powers dashboards for roles with no administrative scope (Officer, Director, ...). */
export const useMyRecentActivity = (limit = 10) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["my-recent-activity", limit],
    queryFn: async () => {
      const { data } = await getMyRecentActivity(accessToken, limit);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.REALTIME,
  });
};
