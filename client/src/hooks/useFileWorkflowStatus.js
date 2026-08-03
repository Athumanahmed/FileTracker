import { useQuery } from "@tanstack/react-query";
import { getFileWorkflowStatus } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** { instance, currentAssignment } -- instance is null until a workflow is started. */
export const useFileWorkflowStatus = (fileId) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["file-workflow-status", fileId],
    queryFn: async () => {
      const { data } = await getFileWorkflowStatus(accessToken, fileId);
      return data.data;
    },
    enabled: Boolean(accessToken) && Boolean(fileId),
    staleTime: STALE_TIME.SHORT,
  });
};
