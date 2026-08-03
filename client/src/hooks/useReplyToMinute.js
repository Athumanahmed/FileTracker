import { useMutation, useQueryClient } from "@tanstack/react-query";
import { replyToMinute } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** payload: { minuteId, fileId, formData } -- fileId is only needed to invalidate the right caches. */
export const useReplyToMinute = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ minuteId, formData }) => {
      const { data } = await replyToMinute(accessToken, minuteId, formData);
      return data.data;
    },
    onSuccess: (_data, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-minutes", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-timeline", fileId] });
    },
  });
};
