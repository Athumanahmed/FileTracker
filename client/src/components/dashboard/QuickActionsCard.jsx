import { Link } from "react-router-dom";
import { UserPlus, Building2, ShieldCheck, KeyRound, FileClock, Settings } from "lucide-react";

const ACTIONS = [
  { label: "Add New User", icon: UserPlus, to: "/admin/users", tone: "blue" },
  { label: "Create Department", icon: Building2, to: "/admin/departments", tone: "indigo" },
  { label: "Create Role", icon: ShieldCheck, to: "/admin/roles", tone: "purple" },
  { label: "Manage Permissions", icon: KeyRound, to: "/admin/permissions", tone: "teal" },
  { label: "Audit Logs", icon: FileClock, to: "/admin/audit-logs", tone: "amber" },
  { label: "System Settings", icon: Settings, to: "/admin/settings", tone: "gray" },
];

const TONE_STYLES = {
  blue: "bg-blue-50 text-blue-600",
  indigo: "bg-indigo-50 text-indigo-600",
  purple: "bg-purple-50 text-purple-600",
  teal: "bg-teal-50 text-teal-600",
  amber: "bg-amber-50 text-amber-600",
  gray: "bg-gray-100 text-gray-600",
};

const QuickActionsCard = () => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <h2 className="font-semibold text-gray-900">System Quick Actions</h2>
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

export default QuickActionsCard;
