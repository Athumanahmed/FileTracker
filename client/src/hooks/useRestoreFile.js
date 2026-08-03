import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restoreFile } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** payload: { fileId, remarks? }. Reinstates whatever status the file had the moment before archiving. */
export const useRestoreFile = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, ...payload }) => {
      const { data } = await restoreFile(accessToken, fileId, payload);
      return data.data;
    },
    onSuccess: (_data, { fileId }) => {
      queryClient.invalidateQueries({ queryKey: ["file-archive-status", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-detail", fileId] });
      queryClient.invalidateQueries({ queryKey: ["file-timeline", fileId] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["expired-retention"] });
    },
  });
};
