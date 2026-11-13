import React, { useId, useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip as MuiTooltip,
  Typography,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import {
  AXIS_STYLE,
  CHART_COLORS,
  GRID_STYLE,
  SEQUENTIAL_CHART_HEIGHT,
  SEQUENTIAL_CHART_MARGIN,
} from "./chartStyles";

type ChartType = "bar" | "pie" | "doughnut" | "line" | "area";
type ChartNature = "categorical" | "numeric" | "date";
const CHART_OPTIONS: Record<ChartNature, readonly ChartType[]> = {
  categorical: ["bar", "pie", "doughnut"],
  numeric: ["bar", "line"],
  date: ["area", "bar", "line"],
};

interface Props {
  label: string;
  meta: string;
  data: { name: string; count: number }[];
  nature: ChartNature;
  multipleSelections?: boolean;
  children: React.ReactNode;
}

export const SelectableChartCard: React.FC<Props> = ({
  label,
  meta,
  data,
  nature,
  multipleSelections,
  children,
}) => {
  const { t } = useTranslation();
  const selectorId = useId();
  const options = CHART_OPTIONS[nature];
  const defaultType = options[0];
  const [selectedType, setSelectedType] = useState<ChartType>(defaultType);
  const chartType = options.includes(selectedType) ? selectedType : defaultType;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);
  const selectorLabel = t("responses.analytics.chooseChartType", {
    label,
    type: t(`responses.analytics.chartTypes.${chartType}`),
  });

  const renderCircular = () => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) {
      return (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          {t("responses.analytics.noChartData")}
        </Typography>
      );
    }
    return (
      <>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              innerRadius={chartType === "doughnut" ? "45%" : 0}
              outerRadius="75%"
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <Box
          component="ul"
          aria-label={t("responses.analytics.chartLegend")}
          sx={{ listStyle: "none", m: 0, p: 0 }}
        >
          {data.map((item, index) => (
            <Box
              component="li"
              key={index}
              sx={{ display: "flex", alignItems: "baseline", gap: 1, py: 0.5 }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  width: 10,
                  height: 10,
                  flexShrink: 0,
                  bgcolor: CHART_COLORS[index % CHART_COLORS.length],
                  borderRadius: "50%",
                }}
              />
              <Typography
                variant="body2"
                sx={{ minWidth: 0, overflowWrap: "anywhere" }}
              >
                {item.name} — {item.count} (
                {Math.round((item.count / total) * 100)}%)
              </Typography>
            </Box>
          ))}
        </Box>
      </>
    );
  };

  const renderCartesian = (type: "bar" | "line") => {
    const axes = (
      <>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="name" {...AXIS_STYLE} />
        <YAxis allowDecimals={false} {...AXIS_STYLE} />
        <Tooltip cursor={{ fill: "#f3f4f6" }} />
      </>
    );
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={SEQUENTIAL_CHART_HEIGHT}>
            <BarChart data={data} margin={SEQUENTIAL_CHART_MARGIN}>
              {axes}
              <Bar
                dataKey="count"
                fill={CHART_COLORS[0]}
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={SEQUENTIAL_CHART_HEIGHT}>
            <LineChart data={data} margin={SEQUENTIAL_CHART_MARGIN}>
              {axes}
              <Line
                dataKey="count"
                type="linear"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[0], r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderChart = () => {
    if (chartType === defaultType) return children;
    switch (chartType) {
      case "pie":
      case "doughnut":
        return renderCircular();
      case "bar":
      case "line":
        return renderCartesian(chartType);
      case "area":
        return children;
    }
  };

  return (
    <ChartCard
      label={label}
      meta={meta}
      action={
        <>
          <MuiTooltip title={selectorLabel}>
            <IconButton
              id={selectorId}
              aria-label={selectorLabel}
              aria-haspopup="menu"
              aria-controls={menuOpen ? `${selectorId}-menu` : undefined}
              aria-expanded={menuOpen}
              onClick={(event) => setAnchorEl(event.currentTarget)}
            >
              <BarChartIcon />
            </IconButton>
          </MuiTooltip>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={() => setAnchorEl(null)}
            slotProps={{
              list: { id: `${selectorId}-menu`, "aria-labelledby": selectorId },
            }}
          >
            {options.map((type) => (
              <MenuItem
                key={type}
                selected={chartType === type}
                role="menuitemradio"
                aria-checked={chartType === type}
                onClick={() => {
                  setSelectedType(type);
                  setAnchorEl(null);
                }}
              >
                {t(`responses.analytics.chartTypes.${type}`)}
              </MenuItem>
            ))}
          </Menu>
        </>
      }
    >
      {multipleSelections && (
        <Typography
          component="p"
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          {t("responses.analytics.multipleSelections")}
          {(chartType === "pie" || chartType === "doughnut") &&
            ` ${t("responses.analytics.shareOfSelections")}`}
        </Typography>
      )}
      {renderChart()}
    </ChartCard>
  );
};
