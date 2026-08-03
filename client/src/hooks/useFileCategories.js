import { useQuery } from "@tanstack/react-query";
import { getFileCategories } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Active file categories, for dropdowns -- read-only reference data (no create/update UI yet). */
export const useFileCategories = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["file-categories"],
    queryFn: async () => {
      const { data } = await getFileCategories(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.LONG,
  });
};
