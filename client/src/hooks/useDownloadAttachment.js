import { useMutation } from "@tanstack/react-query";
import { downloadAttachmentFile } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** Triggers a real browser file save via a throwaway object URL + anchor click -- call as download({ attachmentId, fileName }). */
export const useDownloadAttachment = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async ({ attachmentId, fileName }) => {
      const { data: blob } = await downloadAttachmentFile(accessToken, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    },
  });
};
