import { useQuery } from "@tanstack/react-query";
import { getFileById } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

export const useFileDetail = (fileId) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["file-detail", fileId],
    queryFn: async () => {
      const { data } = await getFileById(accessToken, fileId);
      return data.data;
    },
    enabled: Boolean(accessToken) && Boolean(fileId),
    staleTime: STALE_TIME.SHORT,
  });
};
