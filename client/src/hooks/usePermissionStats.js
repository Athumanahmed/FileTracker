import { useQuery } from "@tanstack/react-query";
import { getPermissionStats } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

export const usePermissionStats = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-permission-stats"],
    queryFn: async () => {
      const { data } = await getPermissionStats(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.SHORT,
  });
};
