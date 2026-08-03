import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setMyNotificationPreference } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** payload: { type, channel, isEnabled }. */
export const useSetNotificationPreference = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await setMyNotificationPreference(accessToken, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notification-preferences"] });
    },
  });
};
