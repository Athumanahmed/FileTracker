import React from "react";
import {
  LayoutDashboard,
  FolderOpen,
  FilePlus,
  ArrowLeftRight,
  BookText,
  BarChart2,
  Bell,
  Building2,
  Users,
  Settings,
  ChevronDown,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const sidebarLinks = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Files", icon: FolderOpen },
  { label: "New File", icon: FilePlus },
  { label: "Transfers", icon: ArrowLeftRight },
  { label: "Minutes", icon: BookText },
  { label: "Reports", icon: BarChart2 },
  { label: "Notifications", icon: Bell },
  { label: "Departments", icon: Building2 },
  { label: "Users", icon: Users },
  { label: "Settings", icon: Settings },
];

const stats = [
  { label: "Files Registered", value: "1,248" },
  { label: "Pending Files", value: "356" },
  { label: "Today's Transfers", value: "28" },
  { label: "Completed Files", value: "892" },
];

const activities = [
  { time: "10:15 AM", file: "EFTMS-2026-00124", note: "Received by Registry" },
  { time: "10:32 AM", file: "EFTMS-2026-00124", note: "Assigned to Finance Department" },
  { time: "11:08 AM", file: "EFTMS-2026-00118", note: "Approved by Department Head" },
  { time: "11:21 AM", file: "EFTMS-2026-00107", note: "Archived" },
];

const chartData = [
  { v: 20 }, { v: 35 }, { v: 30 }, { v: 55 }, { v: 48 },
  { v: 65 }, { v: 58 }, { v: 45 }, { v: 60 }, { v: 85 },
];

const DashboardPreview = () => {
  return (
    <div className="flex w-full overflow-hidden rounded-2xl bg-primaryBlue shadow-xl shadow-primaryBlue/10">
      {/* MINI SIDEBAR */}
      <aside className="hidden w-40 shrink-0 flex-col gap-1 bg-primaryBlue px-3 py-4 sm:flex">
        <p className="mb-3 px-2 text-sm font-bold tracking-wide text-white">
          EFTMS
        </p>
        {sidebarLinks.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
              active
                ? "bg-white text-primaryBlue"
                : "text-white/70"
            }`}
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
        ))}
      </aside>

      {/* CONTENT */}
      <div className="flex-1 space-y-3 rounded-2xl bg-gray-50 p-4">
        {/* GREETING */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400">Good Morning,</p>
            <p className="text-sm font-bold text-primaryBlue">Registry Officer</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative rounded-full bg-white p-1.5 shadow-sm">
              <Bell className="size-3.5 text-gray-500" />
              <span className="absolute -right-0.5 -top-0.5 flex size-3 items-center justify-center rounded-full bg-red-500 text-[7px] text-white">
                1
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow-sm">
              <div className="size-5 rounded-full bg-primaryBlue/20" />
              <span className="hidden text-[10px] font-medium text-gray-600 md:inline">
                Registry Officer
              </span>
              <ChevronDown className="size-3 text-gray-400" />
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg bg-white p-2 shadow-sm"
            >
              <p className="truncate text-[9px] text-gray-400">{s.label}</p>
              <p className="text-sm font-bold text-primaryBlue">{s.value}</p>
            </div>
          ))}
        </div>

        {/* CHART + ACTIVITIES */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <p className="mb-1 text-[10px] font-semibold text-gray-500">
              File Movement Overview
            </p>
            <div className="h-16 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="#162660"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg bg-white p-3 shadow-sm">
            <p className="mb-1.5 text-[10px] font-semibold text-gray-500">
              Recent Activities
            </p>
            <div className="space-y-1.5">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[9px]">
                  <span className="mt-0.5 shrink-0 text-gray-400">{a.time}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-700">{a.file}</p>
                    <p className="truncate text-gray-400">{a.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
