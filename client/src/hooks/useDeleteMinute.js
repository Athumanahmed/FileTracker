import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMinute } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** payload: { minuteId, fileId }. */
export const useDeleteMinute = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ minuteId }) => {
      const { data } = await deleteMinute(accessToken, minuteId);
      return data.data;
    },
    onSuccess: (_data, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-minutes", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-timeline", fileId] });
    },
  });
};
