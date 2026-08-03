import { useQuery } from "@tanstack/react-query";
import { getFileArchiveStatus } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** null if the file has never been archived. */
export const useFileArchiveStatus = (fileId) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["file-archive-status", fileId],
    queryFn: async () => {
      const { data } = await getFileArchiveStatus(accessToken, fileId);
      return data.data;
    },
    enabled: Boolean(accessToken) && Boolean(fileId),
    staleTime: STALE_TIME.SHORT,
  });
};
