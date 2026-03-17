import React, { useMemo } from "react";
import { Card, Col, Row, Typography } from "antd";
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

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle }) => (
  <Card
    size="small"
    style={{ borderRadius: 12, textAlign: "center" }}
    bodyStyle={{ padding: "16px 12px" }}
  >
    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
      {title}
    </Text>
    <Text
      strong
      style={{ fontSize: 28, display: "block", lineHeight: 1.2, marginTop: 4 }}
    >
      {value}
    </Text>
    {subtitle && (
      <Text type="secondary" style={{ fontSize: 11 }}>
        {subtitle}
      </Text>
    )}
  </Card>
);

interface Props {
  responsesData: Array<{ [key: string]: string }>;
  formSpec: Tag[];
}

export const FormAnalytics: React.FC<Props> = ({ responsesData, formSpec }) => {
  const stats = useMemo(
    () => computeSummaryStats(responsesData, formSpec),
    [responsesData, formSpec]
  );

  const fieldAnalytics = useMemo(
    () => computeAnalytics(responsesData, formSpec),
    [responsesData, formSpec]
  );

  if (!responsesData.length) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
        No responses yet to analyze.
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px 32px" }}>
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <StatCard
            title="Total Submissions"
            value={stats.totalSubmissions}
          />
        </Col>
        <Col xs={12} sm={8}>
          <StatCard
            title="Unique Responders"
            value={stats.uniqueResponders}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Fields Answered"
            value={`${stats.answeredFields} / ${stats.totalFields}`}
            subtitle="at least one response"
          />
        </Col>
      </Row>

      {fieldAnalytics.length === 0 && (
        <div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>
          No chart-able fields found (e.g. choice, number, or text questions).
        </div>
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
    </div>
  );
};
