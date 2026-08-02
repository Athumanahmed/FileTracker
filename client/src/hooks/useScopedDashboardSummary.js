import { useQuery } from "@tanstack/react-query";
import { getScopedDashboardSummary } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** HOD/Supervisor's own department/unit summary -- shape adapts to scope.type ("DEPARTMENT" | "UNIT"). */
export const useScopedDashboardSummary = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["scoped-dashboard-summary"],
    queryFn: async () => {
      const { data } = await getScopedDashboardSummary(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.SHORT,
  });
};
