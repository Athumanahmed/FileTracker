import { useQuery } from "@tanstack/react-query";
import { getPositionStats } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

export const usePositionStats = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-position-stats"],
    queryFn: async () => {
      const { data } = await getPositionStats(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.SHORT,
  });
};
