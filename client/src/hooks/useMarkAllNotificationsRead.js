import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markAllNotificationsRead } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

export const useMarkAllNotificationsRead = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await markAllNotificationsRead(accessToken);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });
};
