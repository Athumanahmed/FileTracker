import { useState } from "react";
import { CheckCircle2, Copy, Check, FolderOpen, RotateCcw } from "lucide-react";
import Modal from "../shared/Modal";
import FileQrCode from "./FileQrCode";

const CopyableField = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard permission denied -- the value is still selectable text, so this is a soft failure.
    }
  };

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="flex-1 select-all rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-gray-800 overflow-x-auto">
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            copied ? "border-green-200 bg-green-50 text-green-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"
          }`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
};

const FileRegisteredModal = ({ file, onClose, onRegisterAnother, onViewFile }) => {
  if (!file) return null;

  return (
    <Modal
      isOpen={Boolean(file)}
      onClose={onClose}
      title="File Registered Successfully"
      description={file.title}
      icon={CheckCircle2}
      iconTone="success"
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onRegisterAnother}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={15} />
            Register Another
          </button>
          <button
            type="button"
            onClick={onViewFile}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primaryBlue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors"
          >
            <FolderOpen size={15} />
            View File
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6">
        <div className="flex flex-col gap-4">
          <CopyableField label="File Number" value={file.fileNumber} />
          <CopyableField label="Registry Number" value={file.registryNumber} />
          <CopyableField label="Tracking Number" value={file.trackingNumber} />

          <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 text-sm">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-gray-500">Department</span>
              <span className="font-medium text-gray-800">{file.department?.name}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-gray-500">Category</span>
              <span className="font-medium text-gray-800">{file.category?.name}</span>
            </div>
            {file.citizen && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-gray-500">Citizen</span>
                <span className="font-medium text-gray-800">{file.citizen.fullName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="sm:w-40">
          <FileQrCode file={file} />
        </div>
      </div>
    </Modal>
  );
};

export default FileRegisteredModal;
