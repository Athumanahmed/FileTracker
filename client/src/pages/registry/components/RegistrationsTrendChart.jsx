import dayjs from "dayjs";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

const Skeleton = () => <div className="mt-4 h-64 sm:h-72 rounded-xl bg-gray-100 animate-pulse" />;

/** period is "YYYY-MM" (bucket=month) or "YYYY-MM-DD" (bucket=day) -- see server/services/report.service.js#getRegistrationsOverTime. */
const formatPeriod = (period, bucket) =>
  bucket === "day" ? dayjs(period).format("MMM D") : dayjs(`${period}-01`).format("MMM YYYY");

/** data: [{ period, count }] ascending -- GET /reports/charts/registrations-over-time. */
const RegistrationsTrendChart = ({ data, bucket = "month", loading }) => {
  const series = (data || []).map((row) => ({ ...row, label: formatPeriod(row.period, bucket) }));
  const isEmpty = series.length === 0 || series.every((row) => row.count === 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold text-gray-900">Registration Trend</h2>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-primaryBlue" />
          Files registered per {bucket === "day" ? "day" : "month"}
        </span>
      </div>

      {loading ? (
        <Skeleton />
      ) : isEmpty ? (
        <div className="mt-4 h-64 sm:h-72 flex items-center justify-center text-sm text-gray-400">
          No registrations in this period yet.
        </div>
      ) : (
        <div className="mt-4 h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(value) => [value, "Registered"]}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Registered"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: "#3b82f6" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RegistrationsTrendChart;
