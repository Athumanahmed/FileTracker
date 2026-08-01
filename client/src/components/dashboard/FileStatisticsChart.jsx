import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Placeholder data -- there is no File/Document module on the backend yet
// (see server/prisma/schema.prisma), so this chart has nothing real to
// query. Swap for a real query the moment a Files module exists.
const DUMMY_DATA = [
  { day: "Mon", registered: 65, inProgress: 40, completed: 20, archived: 8 },
  { day: "Tue", registered: 72, inProgress: 45, completed: 25, archived: 8 },
  { day: "Wed", registered: 68, inProgress: 42, completed: 22, archived: 9 },
  { day: "Thu", registered: 85, inProgress: 55, completed: 30, archived: 10 },
  { day: "Fri", registered: 78, inProgress: 50, completed: 32, archived: 11 },
  { day: "Sat", registered: 80, inProgress: 48, completed: 35, archived: 12 },
  { day: "Sun", registered: 90, inProgress: 60, completed: 38, archived: 13 },
];

const SERIES = [
  { key: "registered", label: "Registered", color: "#3b82f6" },
  { key: "inProgress", label: "In Progress", color: "#f97316" },
  { key: "completed", label: "Completed", color: "#22c55e" },
  { key: "archived", label: "Archived", color: "#a855f7" },
];

const FileStatisticsChart = () => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="font-semibold text-gray-900">File Statistics Overview</h2>
      <div className="flex items-center gap-3 flex-wrap">
        {SERIES.map((series) => (
          <span key={series.key} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: series.color }} />
            {series.label}
          </span>
        ))}
      </div>
    </div>

    <div className="mt-4 h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={DUMMY_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
            labelStyle={{ fontWeight: 600 }}
          />
          {SERIES.map((series) => (
            <Area
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.label}
              stroke={series.color}
              fill={series.color}
              fillOpacity={0.08}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: series.color }}
              activeDot={{ r: 5 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default FileStatisticsChart;
