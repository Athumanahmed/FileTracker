import { useMutation, useQueryClient } from "@tanstack/react-query";
import { revokeSession } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

export const useRevokeSession = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId) => {
      const { data } = await revokeSession(accessToken, sessionId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-sessions"] });
    },
  });
};
