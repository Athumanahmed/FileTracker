import { useQuery } from "@tanstack/react-query";
import { getAdminUserStats } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

export const useAdminUserStats = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: async () => {
      const { data } = await getAdminUserStats(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.SHORT,
  });
};
