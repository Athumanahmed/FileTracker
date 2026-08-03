import { Link } from "react-router-dom";
import { FilePlus2, FolderOpen, Workflow, BarChart3 } from "lucide-react";

const ACTIONS = [
  { label: "Register File", icon: FilePlus2, to: "/registry/files/new", tone: "blue" },
  { label: "Browse Files", icon: FolderOpen, to: "/registry/files", tone: "amber" },
  { label: "My Workflow", icon: Workflow, to: "/registry/workflow", tone: "teal" },
  { label: "Reports", icon: BarChart3, to: "/registry/reports", tone: "purple" },
];

const TONE_STYLES = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  teal: "bg-teal-50 text-teal-600",
  purple: "bg-purple-50 text-purple-600",
};

const RegistryQuickActionsCard = () => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <h2 className="font-semibold text-gray-900">Quick Actions</h2>
    <div className="mt-4 grid grid-cols-2 gap-3">
      {ACTIONS.map(({ label, icon: Icon, to, tone }) => (
        <Link
          key={label}
          to={to}
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

export default RegistryQuickActionsCard;
