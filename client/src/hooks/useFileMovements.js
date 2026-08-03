import { useQuery } from "@tanstack/react-query";
import { getFileMovements } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Raw response body ({ data: items, meta }) -- the file's chain-of-custody log. */
export const useFileMovements = (fileId, params = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["file-movements", fileId, params],
    queryFn: async () => {
      const { data } = await getFileMovements(accessToken, fileId, params);
      return data;
    },
    enabled: Boolean(accessToken) && Boolean(fileId),
    staleTime: STALE_TIME.SHORT,
  });
};
