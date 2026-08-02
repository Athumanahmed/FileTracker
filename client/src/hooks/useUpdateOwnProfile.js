import { useMutation } from "@tanstack/react-query";
import { updateOwnProfile } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/**
 * Self-service profile update -- no query invalidation needed (nothing
 * else in the app queries this user's own record; the authStore itself
 * IS the source of truth for "the logged-in user"). On success, merges
 * the response straight into authStore.user so the Navbar/UserMenu avatar
 * and name update immediately, without a re-login or a fetchUserProfile refetch.
 */
export const useUpdateOwnProfile = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await updateOwnProfile(accessToken, payload);
      return data.data;
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
    },
  });
};
