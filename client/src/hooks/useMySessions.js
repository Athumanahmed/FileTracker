import { useQuery } from "@tanstack/react-query";
import { getMySessions } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** [{ id, deviceName, browser, operatingSystem, ipAddress, lastActivityAt, createdAt, expiresAt, isCurrent }]. */
export const useMySessions = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["my-sessions"],
    queryFn: async () => {
      const { data } = await getMySessions(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.SHORT,
  });
};
