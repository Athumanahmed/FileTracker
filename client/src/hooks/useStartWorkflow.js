import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startFileWorkflow } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** payload: { fileId, templateId, toUserId?, remarks? }. */
export const useStartWorkflow = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, ...payload }) => {
      const { data } = await startFileWorkflow(accessToken, fileId, payload);
      return data.data;
    },
    onSuccess: (_data, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-workflow-status", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-movements", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-timeline", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-detail", fileId] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["report-dashboard-kpis"] });
    },
  });
};
