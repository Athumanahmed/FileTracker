import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardSummary } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

export const useAdminDashboardSummary = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-dashboard-summary"],
    queryFn: async () => {
      const { data } = await getAdminDashboardSummary(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
  });
};
