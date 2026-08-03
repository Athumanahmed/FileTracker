import { useState } from "react";
import toast from "react-hot-toast";
import { ArchiveRestore, Loader2 } from "lucide-react";
import Modal from "../shared/Modal";
import BaseInput from "../shared/BaseInput";
import { useRestoreFile } from "../../hooks/useRestoreFile";

/** Reinstates whatever status the file had the moment before archiving -- not always COMPLETED (see archive.service.js's previousStatus capture). */
const RestoreFileModal = ({ file, isOpen, onClose }) => {
  const [remarks, setRemarks] = useState("");
  const { mutate: submitRestore, isPending } = useRestoreFile();

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitRestore(
      { fileId: file.id, remarks: remarks.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`${file.fileNumber} restored -- it's editable again.`);
          setRemarks("");
          onClose();
        },
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to restore this file."),
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Restore File" description={file?.fileNumber} icon={ArchiveRestore} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          This returns the file to its status just before it was archived, and makes it editable again (new
          attachments, minutes, workflow actions).
        </p>
        <BaseInput
          as="textarea"
          rows={3}
          label="Reason for Restoring"
          name="remarks"
          value={remarks}
          onChange={(_, value) => setRemarks(value)}
          placeholder="Optional -- why is this file being reopened?"
        />

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
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
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <ArchiveRestore size={15} />}
            Restore File
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RestoreFileModal;
