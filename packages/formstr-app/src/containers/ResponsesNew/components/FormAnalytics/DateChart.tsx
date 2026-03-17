import React from "react";
import { Card, Typography } from "antd";
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

const { Text } = Typography;

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
            {fieldType} &bull; {totalAnswered} answered
          </Text>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        >
          <defs>
            <linearGradient id="dateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
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
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#dateGradient)"
            dot={{ fill: "#6366f1", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};
