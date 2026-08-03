import { useQuery } from "@tanstack/react-query";
import { getFileAttachments } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

export const useFileAttachments = (fileId) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["file-attachments", fileId],
    queryFn: async () => {
      const { data } = await getFileAttachments(accessToken, fileId);
      return data.data;
    },
    enabled: Boolean(accessToken) && Boolean(fileId),
    staleTime: STALE_TIME.SHORT,
  });
};
