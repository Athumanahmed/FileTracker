import toast from "react-hot-toast";
import { UploadCloud, FileText, X } from "lucide-react";
import { formatFileSize } from "../../../utils/formatters";

const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt,.csv";

const AttachmentsStep = ({ files, onFilesChange }) => {
  const addFiles = (fileList) => {
    const incoming = Array.from(fileList ?? []);
    if (!incoming.length) return;

    const oversized = incoming.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length) {
      toast.error(`${oversized.length === 1 ? oversized[0].name : `${oversized.length} files`} exceed the 25 MB limit.`);
    }

    const accepted = incoming.filter((f) => f.size <= MAX_FILE_SIZE_BYTES);
    const combined = [...files, ...accepted].slice(0, MAX_ATTACHMENTS);
    if (files.length + accepted.length > MAX_ATTACHMENTS) {
      toast.error(`Only the first ${MAX_ATTACHMENTS} files were kept -- that's the limit per file.`);
    }
    onFilesChange(combined);
  };

  const removeFile = (index) => onFilesChange(files.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      {/*
        A native <label> wrapping the (hidden) <input type="file"> -- clicking
        anywhere in the label opens the file picker via the browser itself,
        no JS ref/click() proxy involved. Strictly more reliable than an
        onClick-triggered ref, and avoids the invalid-HTML-nesting hazard of
        putting the input inside a <button>.
      */}
      <label
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        className="block w-full cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center hover:border-primaryBlue/40 hover:bg-primaryBlueLight/30 transition-colors"
      >
        <UploadCloud className="mx-auto text-gray-400" size={30} />
        <p className="mt-3 text-sm font-medium text-gray-700">Click to browse, or drag files here</p>
        <p className="mt-1 text-xs text-gray-400">
          Up to {MAX_ATTACHMENTS} files, 25 MB each -- PDF, Word, Excel, PowerPoint, images, or text
        </p>
        <input
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </label>

      {files.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-50">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryBlueLight text-primaryBlue">
                <FileText size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        {files.length ? `${files.length}/${MAX_ATTACHMENTS} files attached` : "Optional -- you can also attach documents later from the file's detail page."}
      </p>
    </div>
  );
};

export default AttachmentsStep;
