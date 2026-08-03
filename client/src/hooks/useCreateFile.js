import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFile } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** payload: a FormData built by the caller -- multipart, matches server/validators/file.validation.js's registerFileValidationRules exactly. */
export const useCreateFile = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const { data } = await createFile(accessToken, formData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["report-dashboard-kpis"] });
    },
  });
};
