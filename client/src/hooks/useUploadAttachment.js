import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadAttachment } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** payload: { fileId, formData } -- formData built by the caller (file, title?, attachmentType?). */
export const useUploadAttachment = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, formData }) => {
      const { data } = await uploadAttachment(accessToken, fileId, formData);
      return data.data;
    },
    onSuccess: (_data, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-attachments", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-detail", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-timeline", fileId] });
    },
  });
};
