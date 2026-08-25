import { Link } from "react-router-dom";
import { FolderOpen, Workflow, BarChart3, Bell } from "lucide-react";

const ACTIONS = [
  { label: "Browse Files", icon: FolderOpen, path: "files", tone: "blue" },
  { label: "My Workflow", icon: Workflow, path: "workflow", tone: "teal" },
  { label: "Notifications", icon: Bell, path: "notifications", tone: "amber" },
  { label: "Reports", icon: BarChart3, path: "reports", tone: "purple" },
];

const TONE_STYLES = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  teal: "bg-teal-50 text-teal-600",
  purple: "bg-purple-50 text-purple-600",
};

/** Shared quick-links card for every workflow-assignee role's own dashboard (Officer, Director, ...) -- same four destinations every such role's sidebar already has, just prefixed by `basePath`. */
const WorkflowQuickActionsCard = ({ basePath }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <h2 className="font-semibold text-gray-900">Quick Actions</h2>
    <div className="mt-4 grid grid-cols-2 gap-3">
      {ACTIONS.map(({ label, icon: Icon, path, tone }) => (
        <Link
          key={label}
          to={`${basePath}/${path}`}
          className="flex items-center gap-2.5 rounded-xl border border-gray-100 p-3 hover:border-primaryBlue/20 hover:bg-gray-50 transition-colors"
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_STYLES[tone]}`}>
            <Icon size={16} />
          </span>
          <span className="text-sm font-medium text-gray-700 leading-tight">{label}</span>
        </Link>
      ))}
    </div>
  </div>
);

export default WorkflowQuickActionsCard;
