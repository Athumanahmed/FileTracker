import { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { getFileStatusMeta } from "../../../utils/fileStatusMeta";

const Skeleton = () => (
  <div className="mt-2 flex flex-col sm:flex-row items-center gap-4 animate-pulse">
    <div className="h-52 w-52 shrink-0 rounded-full bg-gray-100" />
    <div className="flex-1 w-full space-y-2.5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-3.5 w-full rounded bg-gray-100" />
      ))}
    </div>
  </div>
);

/** data: [{ status, count }] -- the dashboard KPI response's statusDistribution field. */
const FileStatusPieChart = ({ data, loading }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const slices = (data || [])
    .filter((row) => row.count > 0)
    .map((row) => ({ ...row, ...getFileStatusMeta(row.status) }))
    .sort((a, b) => b.count - a.count);
  const total = slices.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col">
      <h2 className="font-semibold text-gray-900">Files by Current Status</h2>

      {loading ? (
        <Skeleton />
      ) : slices.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-14 text-sm text-gray-400">
          No files registered yet.
        </div>
      ) : (
        <div className="mt-2 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative h-52 w-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={2}
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {slices.map((entry, index) => (
                    <Cell
                      key={entry.status}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
                  formatter={(value, name) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-400">Total</span>
              <span className="text-2xl font-bold text-gray-900">{total}</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2.5">
            {slices.map((entry) => (
              <div key={entry.status} className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.label}
                </span>
                <span className="font-medium text-gray-900 shrink-0 whitespace-nowrap">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileStatusPieChart;
