"use client";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

const StatCard = ({ value, label, growth, accent, data, color }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-md transition-all duration-200">
      {/* Top: Value + optional chart */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-semibold text-gray-800">{value}</span>

        {/* Mini Chart (optional) */}
        {data && (
          <div className="w-20 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Tooltip
                  cursor={{ stroke: "transparent" }}
                  contentStyle={{
                    background: "white",
                    border: "1px solid #ddd",
                    fontSize: "10px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color || "#16a34a"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bottom: Labels */}
      <div>
        <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
          {label}
        </div>
        <div className={`text-xs font-semibold mt-1 ${accent}`}>{growth}</div>
      </div>
    </div>
  );
};

export default StatCard;
