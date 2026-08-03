import { useMutation } from "@tanstack/react-query";
import { exportReport } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

const extractFilename = (contentDisposition, fallback) => {
  const match = /filename="?([^"]+)"?/.exec(contentDisposition ?? "");
  return match?.[1] ?? fallback;
};

/** params: { report: "files"|"department-performance"|"officer-performance", format: "csv"|"excel"|"pdf", ...filters }. Triggers a real browser file save. */
export const useExportReport = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async (params) => {
      const response = await exportReport(accessToken, params);
      const filename = extractFilename(response.headers["content-disposition"], `${params.report}-report.${params.format}`);

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    },
  });
};
