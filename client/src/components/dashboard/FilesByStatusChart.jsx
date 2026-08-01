import { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import toast from "react-hot-toast";

// Placeholder data -- see FileStatisticsChart.jsx for why (no Files module yet).
const DUMMY_DATA = [
  { name: "Registered", value: 95, color: "#3b82f6" },
  { name: "In Progress", value: 110, color: "#f97316" },
  { name: "Pending Review", value: 45, color: "#eab308" },
  { name: "Completed", value: 50, color: "#22c55e" },
  { name: "Archived", value: 20, color: "#a855f7" },
];

const TOTAL = DUMMY_DATA.reduce((sum, item) => sum + item.value, 0);

const FilesByStatusChart = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col">
      <h2 className="font-semibold text-gray-900">Files by Current Status</h2>

      <div className="mt-2 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DUMMY_DATA}
                dataKey="value"
                nameKey="name"
                innerRadius="68%"
                outerRadius="100%"
                paddingAngle={2}
                stroke="none"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {DUMMY_DATA.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    opacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.4
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #f1f5f9",
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  `${value} (${((value / TOTAL) * 100).toFixed(1)}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-gray-400">Total</span>
            <span className="text-2xl font-bold text-gray-900">{TOTAL}</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2.5">
          {DUMMY_DATA.map((entry) => (
            <div
              key={entry.name}
              className="flex items-center justify-between text-xs text-gray-600"
            >
              <span className="flex items-center gap-2 text-gray-600">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-medium  text-gray-900 shrink-0 whitespace-nowrap">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => toast("File tracking is coming soon.")}
        className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        View All Files
      </button>
    </div>
  );
};

export default FilesByStatusChart;
