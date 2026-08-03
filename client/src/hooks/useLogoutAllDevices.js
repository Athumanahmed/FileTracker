import { useMutation } from "@tanstack/react-query";
import { logoutAllDevices } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** Ends every session, including the caller's own current one -- the component is responsible for clearing local auth state and redirecting afterward, same contract as regular logout. */
export const useLogoutAllDevices = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async () => {
      const { data } = await logoutAllDevices(accessToken);
      return data;
    },
  });
};
