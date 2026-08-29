import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const Skeleton = () => <div className="mt-4 h-56 rounded-xl bg-gray-100 animate-pulse" />;

// Expired stands out (needs action); the rest cool off as the runway lengthens.
const BUCKET_COLORS = {
  expired: "#ef4444",
  within1: "#f59e0b",
  within3: "#eab308",
  within7: "#3b82f6",
  beyond7: "#14b8a6",
  none: "#94a3b8",
};

/** data: [{ key, label, count }] -- GET /archive/stats#retentionRunway. */
const RetentionRunwayChart = ({ data, loading }) => {
  const series = data || [];
  const total = series.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-gray-900">Retention Runway</h2>
        <p className="text-xs text-gray-500">Archived files by time left before destruction review.</p>
      </div>

      {loading ? (
        <Skeleton />
      ) : total === 0 ? (
        <div className="mt-4 h-56 flex items-center justify-center text-sm text-gray-400">
          No files are in retention yet.
        </div>
      ) : (
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={64}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
                formatter={(value) => [value, "Files"]}
              />
              <Bar dataKey="count" name="Files" radius={[0, 6, 6, 0]} maxBarSize={22}>
                {series.map((entry) => (
                  <Cell key={entry.key} fill={BUCKET_COLORS[entry.key] ?? "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RetentionRunwayChart;
