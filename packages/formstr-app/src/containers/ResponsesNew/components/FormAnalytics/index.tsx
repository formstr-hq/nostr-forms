import React, { useMemo } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Tag } from "../../../../nostr/types";
import {
  computeAnalytics,
  computeSummaryStats,
  ChoiceData,
  WordData,
  NumberBucket,
  DateBucket,
  GridHeatmapData,
} from "./dataUtils";
import { ChoiceChart } from "./ChoiceChart";
import { WordCloud } from "./WordCloud";
import { NumberChart } from "./NumberChart";
import { DateChart } from "./DateChart";
import { GridHeatmap } from "./GridHeatmap";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle }) => (
  <Card variant="outlined">
    <CardContent sx={{ p: "16px 12px", textAlign: "center" }}>
      <Typography variant="body2" sx={{ display: "block" }}>
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 600,
          display: "block",
          lineHeight: 1.2,
          mt: 0.5,
        }}
      >
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

interface Props {
  responsesData: Array<{ [key: string]: string }>;
  formSpec: Tag[];
}

export const FormAnalytics: React.FC<Props> = ({ responsesData, formSpec }) => {
  const { t } = useTranslation();
  const stats = useMemo(
    () => computeSummaryStats(responsesData, formSpec),
    [responsesData, formSpec],
  );

  const fieldAnalytics = useMemo(
    () => computeAnalytics(responsesData, formSpec),
    [responsesData, formSpec],
  );

  if (!responsesData.length) {
    return (
      <Box sx={{ textAlign: "center", p: 6, color: "text.disabled" }}>
        {t("responses.analytics.noResponses")}
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, pb: 4 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
          gap: 1.5,
          mb: 3,
        }}
      >
        <StatCard
          title={t("responses.analytics.totalSubmissions")}
          value={stats.totalSubmissions}
        />
        <StatCard
          title={t("responses.analytics.uniqueResponders")}
          value={stats.uniqueResponders}
        />
        <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}>
          <StatCard
            title={t("responses.analytics.fieldsAnswered")}
            value={`${stats.answeredFields} / ${stats.totalFields}`}
            subtitle={t("responses.analytics.answeredSubtitle")}
          />
        </Box>
      </Box>

      {fieldAnalytics.length === 0 && (
        <Box sx={{ textAlign: "center", p: 4, color: "text.disabled" }}>
          {t("responses.analytics.noChartableFields")}
        </Box>
      )}

      {fieldAnalytics.map((field) => {
        if (
          field.fieldType === "radioButton" ||
          field.fieldType === "checkboxes" ||
          field.fieldType === "dropdown"
        ) {
          return (
            <ChoiceChart
              key={field.fieldId}
              label={field.label}
              fieldType={field.fieldType}
              data={field.data as ChoiceData[]}
              totalAnswered={field.totalAnswered}
            />
          );
        }

        if (field.fieldType === "text") {
          return (
            <WordCloud
              key={field.fieldId}
              label={field.label}
              data={field.data as WordData[]}
              totalAnswered={field.totalAnswered}
            />
          );
        }

        if (field.fieldType === "number") {
          return (
            <NumberChart
              key={field.fieldId}
              label={field.label}
              data={field.data as NumberBucket[]}
              totalAnswered={field.totalAnswered}
            />
          );
        }

        if (field.fieldType === "date") {
          return (
            <DateChart
              key={field.fieldId}
              label={field.label}
              fieldType={field.fieldType}
              data={field.data as DateBucket[]}
              totalAnswered={field.totalAnswered}
            />
          );
        }

        if (
          field.fieldType === "multipleChoiceGrid" ||
          field.fieldType === "checkboxGrid"
        ) {
          const heatmapData = (field.data as unknown as GridHeatmapData[])[0];
          if (!heatmapData) return null;
          return (
            <GridHeatmap
              key={field.fieldId}
              label={field.label}
              data={heatmapData}
              totalAnswered={field.totalAnswered}
            />
          );
        }

        return null;
      })}
    </Box>
  );
};
