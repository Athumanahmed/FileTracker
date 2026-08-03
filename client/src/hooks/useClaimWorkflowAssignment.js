import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claimWorkflowAssignment } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

export const useClaimWorkflowAssignment = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId }) => {
      const { data } = await claimWorkflowAssignment(accessToken, fileId);
      return data.data;
    },
    onSuccess: (_data, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-workflow-status", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-movements", fileId] });
    },
  });
};
