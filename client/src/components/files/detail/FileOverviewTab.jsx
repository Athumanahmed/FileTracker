import { useState } from "react";
import toast from "react-hot-toast";
import { Hash, Building2, Tag, Shield, UserCircle2, Calendar, User, Phone, IdCard, Archive, ArchiveRestore, MessageSquare, Loader2 } from "lucide-react";
import { formatDateTime } from "../../../utils/formatters";
import { getFileStatusMeta, getFilePriorityMeta } from "../../../utils/fileStatusMeta";
import useAuthStore from "../../../store/authStore";
import { PERMISSIONS } from "../../../utils/permissions";
import { useSetCitizenSmsPreference } from "../../../hooks/useSetCitizenSmsPreference";
import ArchiveFileModal from "../ArchiveFileModal";
import RestoreFileModal from "../RestoreFileModal";

const ARCHIVABLE_STATUSES = ["COMPLETED", "REJECTED", "CLOSED"];

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <span className="flex items-center gap-2 text-sm text-gray-500">
      <Icon size={15} className="text-gray-400" />
      {label}
    </span>
    <span className="text-sm font-medium text-gray-900 text-right">{value ?? "—"}</span>
  </div>
);

const CONFIDENTIALITY_LABELS = {
  PUBLIC: "Public",
  INTERNAL: "Internal",
  CONFIDENTIAL: "Confidential",
  RESTRICTED: "Restricted",
};

/** file: GET /files/:id's response shape. archiveStatus: GET /files/:id/archive's response shape (null if never archived). */
const FileOverviewTab = ({ file, archiveStatus }) => {
  const user = useAuthStore((state) => state.user);
  const canManageArchive = user?.permissions?.includes(PERMISSIONS.ARCHIVE_MANAGE);
  const canManageCitizenSms = user?.permissions?.includes(PERMISSIONS.FILES_REGISTER);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const { mutate: setSmsPreference, isPending: smsPending } = useSetCitizenSmsPreference(file.id);
  const smsEnabled = file.citizen?.smsNotificationsEnabled;

  const toggleCitizenSms = () => {
    setSmsPreference(
      { citizenId: file.citizen.id, enabled: !smsEnabled },
      {
        onSuccess: (data) =>
          toast.success(`SMS updates ${data.smsNotificationsEnabled ? "enabled" : "disabled"} for this citizen.`),
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to update SMS preference."),
      },
    );
  };

  const status = getFileStatusMeta(file.status);
  const priority = getFilePriorityMeta(file.priority);
  const canArchive = canManageArchive && !archiveStatus && ARCHIVABLE_STATUSES.includes(file.status);

  return (
    <div className="space-y-4">
      {archiveStatus && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-4">
          <div className="flex items-start gap-3">
            <Archive size={18} className="mt-0.5 shrink-0 text-purple-600" />
            <div>
              <p className="text-sm font-semibold text-purple-800">This file is archived and read-only.</p>
              <p className="text-xs text-purple-700 mt-0.5">
                Archived {formatDateTime(archiveStatus.archivedAt)} by {archiveStatus.archivedBy?.fullName ?? "—"}
                {archiveStatus.retentionExpiresAt && <> &middot; retention until {formatDateTime(archiveStatus.retentionExpiresAt)}</>}
                {archiveStatus.storageLocation && <> &middot; {archiveStatus.storageLocation}</>}
              </p>
            </div>
          </div>
          {canManageArchive && (
            <button
              type="button"
              onClick={() => setShowRestoreModal(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <ArchiveRestore size={15} />
              Restore
            </button>
          )}
        </div>
      )}

      {canArchive && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-gray-900">This file is ready to archive.</p>
            <p className="text-xs text-gray-500 mt-0.5">Its case is {status.label.toLowerCase()} -- move it into long-term retention.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowArchiveModal(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primaryBlue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors"
          >
            <Archive size={15} />
            Archive File
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.badgeClass}`}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
          {status.label}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priority.badgeClass}`}>{priority.label} Priority</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          <Shield size={12} />
          {CONFIDENTIALITY_LABELS[file.confidentiality] ?? file.confidentiality}
        </span>
      </div>

      {file.description && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{file.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">File Details</h3>
          <div className="divide-y divide-gray-50">
            <InfoRow icon={Hash} label="File Number" value={file.fileNumber} />
            <InfoRow icon={Hash} label="Registry Number" value={file.registryNumber} />
            <InfoRow icon={Hash} label="Tracking Number" value={file.trackingNumber} />
            <InfoRow icon={Tag} label="Category" value={file.category?.name} />
            <InfoRow icon={Building2} label="Department" value={file.department?.name} />
            <InfoRow icon={UserCircle2} label="Registered By" value={file.registeredBy?.fullName} />
            <InfoRow icon={Calendar} label="Registered On" value={formatDateTime(file.createdAt)} />
            <InfoRow icon={Calendar} label="Last Updated" value={formatDateTime(file.updatedAt)} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Citizen</h3>
          {file.citizen ? (
            <div className="divide-y divide-gray-50">
              <InfoRow icon={User} label="Full Name" value={file.citizen.fullName} />
              <InfoRow icon={IdCard} label="Citizen Number" value={file.citizen.citizenNumber} />
              {file.citizen.phoneNumber && <InfoRow icon={Phone} label="Phone Number" value={file.citizen.phoneNumber} />}
              <div className="flex items-center justify-between gap-4 py-2.5">
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <MessageSquare size={15} className="text-gray-400" />
                  SMS status updates
                </span>
                {canManageCitizenSms && file.citizen.phoneNumber ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(smsEnabled)}
                    disabled={smsPending}
                    onClick={toggleCitizenSms}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                      smsEnabled ? "bg-primaryBlue" : "bg-gray-300"
                    }`}
                  >
                    {smsPending && (
                      <Loader2 size={11} className="absolute left-1/2 -translate-x-1/2 animate-spin text-white" />
                    )}
                    <span
                      className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
                        smsEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                ) : (
                  <span className="text-sm font-medium text-gray-900 text-right">
                    {!file.citizen.phoneNumber ? "No phone on file" : smsEnabled ? "On" : "Off"}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">No citizen linked to this file.</p>
          )}
        </div>
      </div>

      {canManageArchive && (
        <>
          <ArchiveFileModal file={file} isOpen={showArchiveModal} onClose={() => setShowArchiveModal(false)} />
          <RestoreFileModal file={file} isOpen={showRestoreModal} onClose={() => setShowRestoreModal(false)} />
        </>
      )}
    </div>
  );
};

export default FileOverviewTab;
