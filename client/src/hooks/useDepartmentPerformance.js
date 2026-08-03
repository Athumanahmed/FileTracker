import { useQuery } from "@tanstack/react-query";
import { getDepartmentPerformance } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** [{ department, totalFiles, pending, completed, overdue, avgProcessingDays }], sorted by totalFiles desc. params: { departmentId? }. */
export const useDepartmentPerformance = (params = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["department-performance", params],
    queryFn: async () => {
      const { data } = await getDepartmentPerformance(accessToken, params);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.SHORT,
  });
};
