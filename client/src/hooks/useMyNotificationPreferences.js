import { useQuery } from "@tanstack/react-query";
import { getMyNotificationPreferences } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** No row for a (type, channel) pair means the default applies: IN_APP on, everything else off. */
export const useMyNotificationPreferences = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["my-notification-preferences"],
    queryFn: async () => {
      const { data } = await getMyNotificationPreferences(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.LONG,
  });
};
