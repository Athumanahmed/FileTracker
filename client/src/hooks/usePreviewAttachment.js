import { useMutation } from "@tanstack/react-query";
import { previewAttachmentFile } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/**
 * Opens the attachment inline in a new tab. The tab is opened synchronously
 * (before the await) so it carries the click's user-gesture -- opening it
 * only after the blob resolves would get silently blocked as a popup by
 * most browsers. Call as preview({ attachmentId }).
 */
export const usePreviewAttachment = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async ({ attachmentId }) => {
      const previewWindow = window.open("", "_blank");
      try {
        const { data: blob } = await previewAttachmentFile(accessToken, attachmentId);
        const url = window.URL.createObjectURL(blob);
        if (previewWindow) previewWindow.location.href = url;
        setTimeout(() => window.URL.revokeObjectURL(url), 60 * 1000);
      } catch (error) {
        previewWindow?.close();
        throw error;
      }
    },
  });
};
