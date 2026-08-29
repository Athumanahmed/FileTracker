import { FileText, User, Paperclip } from "lucide-react";
import { formatFileSize } from "../../../utils/formatters";

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right">{value || "—"}</span>
  </div>
);

const ReviewStep = ({ values, categoryLabel, departmentLabel, files }) => (
  <div className="space-y-4">
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
        <FileText size={15} className="text-gray-400" />
        File Details
      </h3>
      <div className="divide-y divide-gray-50">
        <Row label="Title" value={values.title} />
        <Row label="Category" value={categoryLabel} />
        <Row label="Department" value={departmentLabel} />
        <Row label="Priority" value={values.priority} />
        <Row label="Confidentiality" value={values.confidentiality} />
        <Row label="Source" value={values.source?.replace("_", " ")} />
        {values.dueDate && <Row label="Due Date" value={values.dueDate} />}
        {values.description && <Row label="Description" value={values.description} />}
      </div>
    </div>

    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
        <User size={15} className="text-gray-400" />
        Citizen
      </h3>
      {values.linkCitizen ? (
        <div className="divide-y divide-gray-50">
          <Row label="Name" value={[values.citizenFirstName, values.citizenMiddleName, values.citizenLastName].filter(Boolean).join(" ")} />
          {values.citizenNationalId && <Row label="National ID" value={values.citizenNationalId} />}
          {values.citizenPhoneNumber && <Row label="Phone Number" value={values.citizenPhoneNumber} />}
          {values.citizenEmail && <Row label="Email" value={values.citizenEmail} />}
          {values.citizenOrganizationName && <Row label="Organization" value={values.citizenOrganizationName} />}
          {values.citizenPhoneNumber && (
            <Row label="SMS status updates" value={values.citizenSmsEnabled ? "On" : "Off"} />
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-2">No citizen linked -- internal file.</p>
      )}
    </div>

    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
        <Paperclip size={15} className="text-gray-400" />
        Attachments
      </h3>
      {files.length ? (
        <div className="divide-y divide-gray-50">
          {files.map((file, index) => (
            <Row key={`${file.name}-${index}`} label={file.name} value={formatFileSize(file.size)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-2">No attachments -- you can add these later.</p>
      )}
    </div>
  </div>
);

export default ReviewStep;
