import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markNotificationRead } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

export const useMarkNotificationRead = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      const { data } = await markNotificationRead(accessToken, notificationId);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });
};
