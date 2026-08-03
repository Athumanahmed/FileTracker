import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileMinute } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** payload: { fileId, formData } -- formData built by the caller (content, minuteType?, addressedToId?, attachments?). */
export const useCreateMinute = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, formData }) => {
      const { data } = await createFileMinute(accessToken, fileId, formData);
      return data.data;
    },
    onSuccess: (_data, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-minutes", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-timeline", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-attachments", fileId] });
    },
  });
};
