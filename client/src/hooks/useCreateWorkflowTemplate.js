import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkflowTemplate } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/**
 * Creates a workflow template (metadata only -- steps are added afterward on
 * the detail page). Invalidates the admin directory list and the active-only
 * lookup that feeds the "Start Workflow" picker, so a freshly created
 * template shows up in both without a manual refresh.
 */
export const useCreateWorkflowTemplate = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await createWorkflowTemplate(accessToken, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workflow-templates-list"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-templates-list"] });
    },
  });
};
