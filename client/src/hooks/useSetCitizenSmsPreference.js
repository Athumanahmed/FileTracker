import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setCitizenSmsPreference } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/**
 * Flips the citizen-facing SMS milestone alerts on/off (Registry only).
 * The flag lives on the Citizen, so it affects every file linked to them --
 * invalidate the current file's detail query so the toggle reflects the new
 * value immediately.
 */
export const useSetCitizenSmsPreference = (fileId) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ citizenId, enabled }) => {
      const { data } = await setCitizenSmsPreference(accessToken, citizenId, enabled);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-detail", fileId] });
    },
  });
};
