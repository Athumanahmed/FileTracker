import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Paperclip, Upload, Download, Eye, RefreshCw, Trash2, X, Loader2 } from "lucide-react";
import BaseInput from "../../shared/BaseInput";
import RowActionsMenu from "../../shared/RowActionsMenu";
import EmptyState from "../../shared/EmptyState";
import { formatDateTime, formatFileSize } from "../../../utils/formatters";
import { useFileAttachments } from "../../../hooks/useFileAttachments";
import { useUploadAttachment } from "../../../hooks/useUploadAttachment";
import { useReplaceAttachment } from "../../../hooks/useReplaceAttachment";
import { useDeleteAttachment } from "../../../hooks/useDeleteAttachment";
import { useDownloadAttachment } from "../../../hooks/useDownloadAttachment";
import { usePreviewAttachment } from "../../../hooks/usePreviewAttachment";

// Mirrors server's fileAttachment PREVIEWABLE_MIME_TYPES exactly.
const PREVIEWABLE_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"];

const ATTACHMENT_TYPE_OPTIONS = [
  { value: "DOCUMENT", label: "Document" },
  { value: "IMAGE", label: "Image" },
  { value: "SCAN", label: "Scan" },
  { value: "LETTER", label: "Letter" },
  { value: "MEMO", label: "Memo" },
  { value: "REPORT", label: "Report" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INVOICE", label: "Invoice" },
  { value: "OTHER", label: "Other" },
];

const UploadForm = ({ fileId, onDone }) => {
  const [title, setTitle] = useState("");
  const [attachmentType, setAttachmentType] = useState("DOCUMENT");
  const [file, setFile] = useState(null);
  const { mutate: upload, isPending } = useUploadAttachment();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    formData.append("attachmentType", attachmentType);

    upload(
      { fileId, formData },
      {
        onSuccess: () => {
          toast.success("Attachment uploaded successfully.");
          onDone();
        },
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to upload attachment."),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Upload Attachment</h3>
        <button type="button" onClick={onDone} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          File <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primaryBlueLight file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-primaryBlue hover:file:bg-primaryBlue/15"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput
          label="Title"
          name="title"
          value={title}
          onChange={(_, value) => setTitle(value)}
          placeholder="Defaults to the file name"
        />
        <BaseInput
          as="select"
          label="Type"
          name="attachmentType"
          value={attachmentType}
          onChange={(_, value) => setAttachmentType(value)}
          options={ATTACHMENT_TYPE_OPTIONS}
        />
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primaryBlue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          Upload
        </button>
      </div>
    </form>
  );
};

const FileAttachmentsTab = ({ fileId, readOnly = false }) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const replaceInputRef = useRef(null);
  const [replacingId, setReplacingId] = useState(null);

  const { data: attachments, isLoading, isError, refetch } = useFileAttachments(fileId);
  const { mutate: replaceAttachment, isPending: isReplacing } = useReplaceAttachment();
  const { mutate: deleteAttachment } = useDeleteAttachment();
  const { mutate: downloadAttachment } = useDownloadAttachment();
  const { mutate: previewAttachment } = usePreviewAttachment();

  const triggerReplace = (attachmentId) => {
    setReplacingId(attachmentId);
    replaceInputRef.current?.click();
  };

  const handleReplaceFileChosen = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !replacingId) return;

    const formData = new FormData();
    formData.append("file", file);
    replaceAttachment(
      { attachmentId: replacingId, fileId, formData },
      {
        onSuccess: () => toast.success("Attachment replaced successfully."),
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to replace attachment."),
      },
    );
  };

  const handleDelete = (attachment) => {
    if (!window.confirm(`Delete "${attachment.title}"? This can't be undone.`)) return;
    deleteAttachment(
      { attachmentId: attachment.id, fileId },
      {
        onSuccess: () => toast.success("Attachment deleted."),
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to delete attachment."),
      },
    );
  };

  const handleDownload = (attachment) => {
    downloadAttachment(
      { attachmentId: attachment.id, fileName: attachment.currentVersion?.originalFileName },
      { onError: () => toast.error("Unable to download attachment.") },
    );
  };

  const handlePreview = (attachment) => {
    previewAttachment({ attachmentId: attachment.id }, { onError: () => toast.error("Unable to preview this file type.") });
  };

  return (
    <div className="space-y-4">
      <input type="file" ref={replaceInputRef} onChange={handleReplaceFileChosen} className="hidden" />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{attachments?.length ?? 0} Attachment{attachments?.length === 1 ? "" : "s"}</h3>
        {!readOnly && !showUploadForm && (
          <button
            type="button"
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primaryBlue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors"
          >
            <Upload size={15} />
            Upload Attachment
          </button>
        )}
      </div>

      {isReplacing && <p className="text-xs text-gray-500">Replacing attachment…</p>}

      {showUploadForm && <UploadForm fileId={fileId} onDone={() => setShowUploadForm(false)} />}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Unable to load attachments.</p>
          <button type="button" onClick={() => refetch()} className="mt-1.5 text-sm font-semibold text-red-700 hover:underline">
            Try again
          </button>
        </div>
      ) : attachments?.length ? (
        <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-50 shadow-sm">
          {attachments.map((attachment) => {
            const version = attachment.currentVersion;
            const canPreview = version && PREVIEWABLE_MIME_TYPES.includes(version.mimeType);

            return (
              <div key={attachment.id} className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
                  <Paperclip size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{attachment.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {version?.originalFileName} &middot; {formatFileSize(version?.fileSizeBytes)} &middot; v{version?.versionNumber} &middot;{" "}
                    {formatDateTime(attachment.createdAt)}
                  </p>
                </div>
                <span className="hidden sm:inline-flex shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {attachment.attachmentType}
                </span>
                <RowActionsMenu
                  label={`Actions for ${attachment.title}`}
                  actions={[
                    { label: "Download", icon: Download, onClick: () => handleDownload(attachment) },
                    ...(canPreview ? [{ label: "Preview", icon: Eye, onClick: () => handlePreview(attachment) }] : []),
                    ...(!readOnly
                      ? [
                          { type: "divider" },
                          { label: "Replace", icon: RefreshCw, onClick: () => triggerReplace(attachment.id) },
                          { label: "Delete", icon: Trash2, variant: "danger", onClick: () => handleDelete(attachment) },
                        ]
                      : []),
                  ]}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No attachments yet"
          message={readOnly ? "No documents have been attached to this file." : "Upload supporting documents for this file."}
          icon={Paperclip}
        />
      )}
    </div>
  );
};

export default FileAttachmentsTab;
