import { useState } from "react";
import toast from "react-hot-toast";
import { Archive, MapPin, CalendarClock, Loader2 } from "lucide-react";
import Modal from "../shared/Modal";
import BaseInput from "../shared/BaseInput";
import { useArchiveFile } from "../../hooks/useArchiveFile";

/**
 * retentionYears is optional -- the backend falls back to the file's
 * category's own defaultRetentionYears when omitted (see
 * archive.service.js#archiveFile), so leaving it blank is a legitimate,
 * common choice, not a shortcut around a required field.
 */
const ArchiveFileModal = ({ file, isOpen, onClose }) => {
  const [retentionYears, setRetentionYears] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [remarks, setRemarks] = useState("");
  const { mutate: submitArchive, isPending } = useArchiveFile();

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitArchive(
      {
        fileId: file.id,
        retentionYears: retentionYears ? Number(retentionYears) : undefined,
        storageLocation: storageLocation.trim() || undefined,
        remarks: remarks.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`${file.fileNumber} archived successfully.`);
          setRetentionYears("");
          setStorageLocation("");
          setRemarks("");
          onClose();
        },
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to archive this file."),
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Archive File" description={file?.fileNumber} icon={Archive} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <BaseInput
          type="number"
          label="Retention Period (years)"
          name="retentionYears"
          value={retentionYears}
          onChange={(_, value) => setRetentionYears(value)}
          placeholder="Defaults to the category's own retention period"
          leftIcon={<CalendarClock size={16} />}
          min={1}
          max={100}
        />
        <BaseInput
          label="Storage Location"
          name="storageLocation"
          value={storageLocation}
          onChange={(_, value) => setStorageLocation(value)}
          placeholder="e.g. Archive Room B, Shelf 12 (optional)"
          leftIcon={<MapPin size={16} />}
          helperText="For a hybrid paper archive -- where the physical folder now lives."
        />
        <BaseInput
          as="textarea"
          rows={3}
          label="Remarks"
          name="remarks"
          value={remarks}
          onChange={(_, value) => setRemarks(value)}
          placeholder="Optional notes for this archive record..."
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
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Archive size={15} />}
            Archive File
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ArchiveFileModal;
