import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { ChoiceData } from "./dataUtils";
import { SelectableChartCard } from "./SelectableChartCard";

import { CHART_COLORS } from "./chartStyles";

interface Props {
  label: string;
  fieldType: string;
  data: ChoiceData[];
  totalAnswered: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload as ChoiceData;
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
        <div style={{ fontWeight: 600 }}>{d.option}</div>
        <div>
          {d.count} response{d.count !== 1 ? "s" : ""} &mdash; {d.percentage}%
        </div>
      </div>
    );
  }
  return null;
};

export const ChoiceChart: React.FC<Props> = ({
  label,
  fieldType,
  data,
  totalAnswered,
}) => {
  const typeLabel =
    fieldType === "checkboxes"
      ? "checkboxes"
      : fieldType === "dropdown"
      ? "dropdown"
      : "single choice";

  const chartHeight = Math.max(180, data.length * 44);

  return (
    <SelectableChartCard
      data={data.map((item) => ({ name: item.option, count: item.count }))}
      nature="categorical"
      multipleSelections={fieldType === "checkboxes"}
      label={label}
      meta={`${typeLabel} • ${totalAnswered} answered`}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="option"
            width={140}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={32}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
            <LabelList
              dataKey="percentage"
              position="right"
              formatter={(v: string | number | boolean | null | undefined) =>
                `${v}%`
              }
              style={{ fontSize: 12, fill: "#6b7280" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SelectableChartCard>
  );
};
