import { useQuery } from "@tanstack/react-query";
import { getFileMinutes } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** The file's full decision history, oldest first. */
export const useFileMinutes = (fileId) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["file-minutes", fileId],
    queryFn: async () => {
      const { data } = await getFileMinutes(accessToken, fileId);
      return data.data;
    },
    enabled: Boolean(accessToken) && Boolean(fileId),
    staleTime: STALE_TIME.SHORT,
  });
};
