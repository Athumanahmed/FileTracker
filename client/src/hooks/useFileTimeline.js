import { useQuery } from "@tanstack/react-query";
import { getFileTimeline } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Raw response body ({ data: items, meta }) -- the file's permanent, chronological history. */
export const useFileTimeline = (fileId, params = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["file-timeline", fileId, params],
    queryFn: async () => {
      const { data } = await getFileTimeline(accessToken, fileId, params);
      return data;
    },
    enabled: Boolean(accessToken) && Boolean(fileId),
    staleTime: STALE_TIME.SHORT,
  });
};
