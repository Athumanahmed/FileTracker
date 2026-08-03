import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAttachment } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** payload: { attachmentId, fileId }. */
export const useDeleteAttachment = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attachmentId }) => {
      const { data } = await deleteAttachment(accessToken, attachmentId);
      return data.data;
    },
    onSuccess: (_data, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-attachments", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-detail", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-timeline", fileId] });
    },
  });
};
