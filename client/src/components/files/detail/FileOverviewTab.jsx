import { Hash, Building2, Tag, Shield, UserCircle2, Calendar, User, Phone, IdCard, Archive } from "lucide-react";
import { formatDateTime } from "../../../utils/formatters";
import { getFileStatusMeta, getFilePriorityMeta } from "../../../utils/fileStatusMeta";

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
  const status = getFileStatusMeta(file.status);
  const priority = getFilePriorityMeta(file.priority);

  return (
    <div className="space-y-4">
      {archiveStatus && (
        <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-4">
          <Archive size={18} className="mt-0.5 shrink-0 text-purple-600" />
          <div>
            <p className="text-sm font-semibold text-purple-800">This file is archived and read-only.</p>
            <p className="text-xs text-purple-700 mt-0.5">
              Archived {formatDateTime(archiveStatus.archivedAt)} by {archiveStatus.archivedBy?.fullName ?? "—"}
              {archiveStatus.retentionExpiresAt && <> &middot; retention until {formatDateTime(archiveStatus.retentionExpiresAt)}</>}
            </p>
          </div>
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
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">No citizen linked to this file.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileOverviewTab;
