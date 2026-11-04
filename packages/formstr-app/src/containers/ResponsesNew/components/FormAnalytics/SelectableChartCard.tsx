import React, { useId, useState } from "react";
import { Box, MenuItem, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "./ChartCard";

type ChartType = "bar" | "pie" | "doughnut" | "line" | "area";
const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];

interface Props {
  label: string;
  meta: string;
  data: { name: string; count: number }[];
  defaultType: "bar" | "area";
  multipleSelections?: boolean;
  children: React.ReactNode;
}

export const SelectableChartCard: React.FC<Props> = ({
  label,
  meta,
  data,
  defaultType,
  multipleSelections,
  children,
}) => {
  const { t } = useTranslation();
  const selectorId = useId();
  const [chartType, setChartType] = useState<ChartType>(defaultType);
  const circular = chartType === "pie" || chartType === "doughnut";
  const options: ChartType[] = ["bar", "pie", "doughnut", "line"];
  if (defaultType === "area") options.push("area");
  const CartesianChart = chartType === "line" ? LineChart : BarChart;

  return (
    <ChartCard label={label} meta={meta}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <TextField
          select
          id={selectorId}
          label={t("responses.analytics.chartType")}
          size="small"
          value={chartType}
          onChange={(event) => setChartType(event.target.value as ChartType)}
          sx={{ minWidth: 140 }}
        >
          {options.map((type) => (
            <MenuItem key={type} value={type}>
              {t(`responses.analytics.chartTypes.${type}`)}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      {chartType === defaultType ? (
        children
      ) : circular ? (
        data.some((item) => item.count > 0) ? (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={chartType === "doughnut" ? "45%" : 0}
                  outerRadius="75%"
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ maxHeight: 80, overflowY: "auto" }}
                />
              </PieChart>
            </ResponsiveContainer>
            {multipleSelections && (
              <Typography variant="caption" color="text.secondary">
                {t("responses.analytics.shareOfSelections")}
              </Typography>
            )}
          </>
        ) : (
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center", py: 4 }}
          >
            {t("responses.analytics.noChartData")}
          </Typography>
        )
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <CartesianChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip />
            {chartType === "line" ? (
              <Line
                dataKey="count"
                type="linear"
                stroke={COLORS[0]}
                strokeWidth={2}
              />
            ) : (
              <Bar
                dataKey="count"
                fill={COLORS[0]}
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            )}
          </CartesianChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
};
