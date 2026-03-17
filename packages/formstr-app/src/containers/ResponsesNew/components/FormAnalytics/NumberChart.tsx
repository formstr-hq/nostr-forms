import React from "react";
import { Card, Typography } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { NumberBucket } from "./dataUtils";

const { Text } = Typography;

const COLOR = "#6366f1";

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

export const NumberChart: React.FC<Props> = ({ label, data, totalAnswered }) => {
  return (
    <Card
      size="small"
      style={{ marginBottom: 16, borderRadius: 12 }}
      title={
        <div>
          <Text strong style={{ fontSize: 14 }}>
            {label}
          </Text>
          <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
            number &bull; {totalAnswered} answered
          </Text>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        >
          <XAxis
            dataKey="range"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={COLOR}
                fillOpacity={0.6 + (0.4 * i) / Math.max(data.length - 1, 1)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
