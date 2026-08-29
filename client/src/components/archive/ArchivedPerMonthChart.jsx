import dayjs from "dayjs";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

const Skeleton = () => <div className="mt-4 h-56 rounded-xl bg-gray-100 animate-pulse" />;

/** data: [{ period: "YYYY-MM", count }] oldest-first -- GET /archive/stats#archivedByMonth. */
const ArchivedPerMonthChart = ({ data, loading }) => {
  const series = (data || []).map((row) => ({ ...row, label: dayjs(`${row.period}-01`).format("MMM YYYY") }));
  const isEmpty = series.length === 0 || series.every((row) => row.count === 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold text-gray-900">Archived per Month</h2>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-primaryBlue" />
          Files moved into retention
        </span>
      </div>

      {loading ? (
        <Skeleton />
      ) : isEmpty ? (
        <div className="mt-4 h-56 flex items-center justify-center text-sm text-gray-400">
          Nothing archived in the last 6 months.
        </div>
      ) : (
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(value) => [value, "Archived"]}
              />
              <Bar dataKey="count" name="Archived" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ArchivedPerMonthChart;
