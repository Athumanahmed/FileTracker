import { useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { LayoutGrid, Paperclip, Workflow, FileSignature, History, QrCode } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import Tabs from "../components/shared/Tabs";
import Modal from "../components/shared/Modal";
import { getFileStatusMeta } from "../utils/fileStatusMeta";
import { useFileDetail } from "../hooks/useFileDetail";
import { useFileArchiveStatus } from "../hooks/useFileArchiveStatus";
import FileOverviewTab from "../components/files/detail/FileOverviewTab";
import FileAttachmentsTab from "../components/files/detail/FileAttachmentsTab";
import FileWorkflowTab from "../components/files/detail/FileWorkflowTab";
import FileMinutesTab from "../components/files/detail/FileMinutesTab";
import FileTimelineTab from "../components/files/detail/FileTimelineTab";
import FileQrCode from "../components/files/FileQrCode";
import useAuthStore from "../store/authStore";
import { getDashboardHomePath } from "../utils/dashboardHome";
import { PERMISSIONS } from "../utils/permissions";

// Each tab beyond Overview is backed by its own permission-gated API. A
// role that holds FILES.READ but not, say, WORKFLOW.READ (e.g. the Archive
// Officer) simply doesn't see that tab, rather than opening it to a wall
// of 403s.
const ALL_TABS = [
  { id: "overview", name: "Overview", icon: LayoutGrid },
  { id: "attachments", name: "Attachments", icon: Paperclip, permission: PERMISSIONS.ATTACHMENTS_READ },
  { id: "workflow", name: "Workflow", icon: Workflow, permission: PERMISSIONS.WORKFLOW_READ },
  { id: "minutes", name: "Minutes", icon: FileSignature, permission: PERMISSIONS.MINUTES_READ },
  { id: "timeline", name: "Timeline", icon: History, permission: PERMISSIONS.TIMELINE_READ },
];

/** Shared across every role -- the tabs themselves (components/files/detail/*) were already role-agnostic; only the route prefix (for breadcrumbs/back link) varies. */
const FileDetails = () => {
  const { fileId } = useParams();
  const user = useAuthStore((state) => state.user);
  const basePath = getDashboardHomePath(user);

  const tabs = useMemo(
    () => ALL_TABS.filter((t) => !t.permission || user?.permissions?.includes(t.permission)),
    [user?.permissions],
  );
  const tabIds = tabs.map((t) => t.id);

  // Lets callers deep-link straight to a tab -- e.g. the Workflow page's
  // "Start Workflow" / "View Assignment" actions navigate here with
  // `state: { initialTab: "workflow" }` instead of always landing on
  // Overview and making the user click through again.
  const location = useLocation();
  const requestedTab = location.state?.initialTab;
  const [activeTab, setActiveTab] = useState(tabIds.includes(requestedTab) ? requestedTab : "overview");
  const [showQrModal, setShowQrModal] = useState(false);

  const { data: file, isLoading, isError, refetch } = useFileDetail(fileId);
  const { data: archiveStatus } = useFileArchiveStatus(fileId);

  if (isLoading) {
    return (
      <div className="p-2 xl:p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-gray-200" />
          <div className="h-40 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (isError || !file) {
    return (
      <div className="p-2 xl:p-4">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Unable to load this file.</p>
          <button type="button" onClick={() => refetch()} className="mt-1.5 text-sm font-semibold text-red-700 hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const status = getFileStatusMeta(file.status);
  const isReadOnly = Boolean(archiveStatus);
  const filesPath = `${basePath}/files`;
  const effectiveTab = tabIds.includes(activeTab) ? activeTab : "overview";

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title={file.title}
        description={file.fileNumber}
        backTo={filesPath}
        badge={{ label: status.label, tone: "blue" }}
        breadcrumbs={[
          { label: "Dashboard", to: basePath },
          { label: "Files", to: filesPath },
          { label: file.fileNumber },
        ]}
        secondaryActions={[{ label: "QR Code", icon: QrCode, onClick: () => setShowQrModal(true) }]}
        divider={false}
      >
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
      </PageHeader>

      <div className="mt-5">
        {effectiveTab === "overview" && <FileOverviewTab file={file} archiveStatus={archiveStatus} />}
        {effectiveTab === "attachments" && <FileAttachmentsTab fileId={fileId} readOnly={isReadOnly} />}
        {effectiveTab === "workflow" && <FileWorkflowTab fileId={fileId} />}
        {effectiveTab === "minutes" && <FileMinutesTab fileId={fileId} readOnly={isReadOnly} />}
        {effectiveTab === "timeline" && <FileTimelineTab fileId={fileId} />}
      </div>

      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title="File QR Label" description={file.fileNumber} size="sm">
        <FileQrCode file={file} />
      </Modal>
    </div>
  );
};

export default FileDetails;
