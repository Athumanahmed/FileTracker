import { useQuery } from "@tanstack/react-query";
import { getAdminAuditLogEntityOptions } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Distinct entity values actually present in the audit log -- powers the Audit Logs page's entity filter dropdown without hardcoding every possible value. */
export const useAdminAuditLogEntityOptions = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-audit-log-entities"],
    queryFn: async () => {
      const { data } = await getAdminAuditLogEntityOptions(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.LONG,
  });
};
