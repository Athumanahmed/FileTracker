import { useQuery } from "@tanstack/react-query";
import { getDepartments } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Active departments, for dropdowns -- limit=100 comfortably covers a municipal council's roster. */
export const useDepartments = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["departments", { isActive: true }],
    queryFn: async () => {
      const { data } = await getDepartments(accessToken, { isActive: true, limit: 100, sortBy: "name" });
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.LONG,
  });
};
