import { useQuery } from "@tanstack/react-query";
import { getExpiredRetention } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Array of { ...archiveRecord, file } -- every archived file already past its retention window. */
export const useExpiredRetention = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["expired-retention"],
    queryFn: async () => {
      const { data } = await getExpiredRetention(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.SHORT,
  });
};
