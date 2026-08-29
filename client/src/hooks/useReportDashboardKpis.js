import { useQuery } from "@tanstack/react-query";
import { getReportDashboardKpis } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** { totalFiles, pending, completed, overdue, avgProcessingDays, statusDistribution: [{status,count}] } */
export const useReportDashboardKpis = (params = {}, { enabled = true } = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["report-dashboard-kpis", params],
    queryFn: async () => {
      const { data } = await getReportDashboardKpis(accessToken, params);
      return data.data;
    },
    enabled: Boolean(accessToken) && enabled,
    staleTime: STALE_TIME.SHORT,
  });
};
