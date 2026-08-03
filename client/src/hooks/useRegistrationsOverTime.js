import { useQuery } from "@tanstack/react-query";
import { getRegistrationsOverTime } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Chart-ready series: [{ period, count }], ascending. params: { bucket: "day"|"month", dateFrom?, dateTo?, departmentId? } */
export const useRegistrationsOverTime = (params = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["registrations-over-time", params],
    queryFn: async () => {
      const { data } = await getRegistrationsOverTime(accessToken, params);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.SHORT,
  });
};
