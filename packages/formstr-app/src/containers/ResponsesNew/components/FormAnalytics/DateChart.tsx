import React, { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DateBucket } from "./dataUtils";
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
  fieldType: string;
  data: DateBucket[];
  totalAnswered: number;
}

const CustomTooltip = ({ active, payload, label: tooltipLabel }: any) => {
  if (active && payload && payload.length) {
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
        <div style={{ fontWeight: 600 }}>{tooltipLabel}</div>
        <div>
          {payload[0].value} response{payload[0].value !== 1 ? "s" : ""}
        </div>
      </div>
    );
  }
  return null;
};

export const DateChart: React.FC<Props> = ({
  label,
  fieldType,
  data,
  totalAnswered,
}) => {
  const gradientId = useId();
  return (
    <SelectableChartCard
      data={data.map((item) => ({ name: item.date, count: item.count }))}
      nature="date"
      label={label}
      meta={`${fieldType} • ${totalAnswered} answered`}
    >
      <ResponsiveContainer width="100%" height={SEQUENTIAL_CHART_HEIGHT}>
        <AreaChart data={data} margin={SEQUENTIAL_CHART_MARGIN}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="date" {...AXIS_STYLE} />
          <YAxis {...AXIS_STYLE} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ fill: CHART_COLORS[0], r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </SelectableChartCard>
  );
};
