import React from "react";
import {
  BarChart,
  CartesianGrid,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { NumberBucket } from "./dataUtils";
import { SelectableChartCard } from "./SelectableChartCard";

import {
  AXIS_STYLE,
  CHART_COLORS,
  GRID_STYLE,
  SEQUENTIAL_CHART_HEIGHT,
  SEQUENTIAL_CHART_MARGIN,
} from "./chartStyles";

interface Props {
  label: string;
  data: NumberBucket[];
  totalAnswered: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload as NumberBucket;
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 600 }}>{d.range}</div>
        <div>
          {d.count} response{d.count !== 1 ? "s" : ""}
        </div>
      </div>
    );
  }
  return null;
};

export const NumberChart: React.FC<Props> = ({
  label,
  data,
  totalAnswered,
}) => {
  return (
    <SelectableChartCard
      data={data.map((item) => ({ name: item.range, count: item.count }))}
      nature="numeric"
      label={label}
      meta={`number • ${totalAnswered} answered`}
    >
      <ResponsiveContainer width="100%" height={SEQUENTIAL_CHART_HEIGHT}>
        <BarChart data={data} margin={SEQUENTIAL_CHART_MARGIN}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="range" {...AXIS_STYLE} />
          <YAxis {...AXIS_STYLE} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={CHART_COLORS[0]}
                fillOpacity={0.6 + (0.4 * i) / Math.max(data.length - 1, 1)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SelectableChartCard>
  );
};
