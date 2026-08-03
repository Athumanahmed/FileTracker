import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transitionFileWorkflow } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** payload: { fileId, action, toUserId?, remarks? }. */
export const useWorkflowTransition = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, ...payload }) => {
      const { data } = await transitionFileWorkflow(accessToken, fileId, payload);
      return data.data;
    },
    onSuccess: (_data, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-workflow-status", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-movements", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-timeline", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-minutes", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-detail", fileId] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["report-dashboard-kpis"] });
    },
  });
};
