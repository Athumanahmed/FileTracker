import { useMutation, useQueryClient } from "@tanstack/react-query";
import { replaceAttachment } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** payload: { attachmentId, fileId, formData } -- fileId is only needed to invalidate the right caches. */
export const useReplaceAttachment = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attachmentId, formData }) => {
      const { data } = await replaceAttachment(accessToken, attachmentId, formData);
      return data.data;
    },
    onSuccess: (_data, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-attachments", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-timeline", fileId] });
    },
  });
};
