import React from "react";
import { Card, Typography, Tooltip } from "antd";
import { GridHeatmapData } from "./dataUtils";

const { Text } = Typography;

// Interpolate between white and indigo based on 0–1 intensity
function heatColor(intensity: number): string {
  const r = Math.round(255 - intensity * (255 - 99));
  const g = Math.round(255 - intensity * (255 - 102));
  const b = Math.round(255 - intensity * (255 - 241));
  return `rgb(${r},${g},${b})`;
}

function textColor(intensity: number): string {
  return intensity > 0.5 ? "#fff" : "#1f2937";
}

interface Props {
  label: string;
  data: GridHeatmapData;
  totalAnswered: number;
}

export const GridHeatmap: React.FC<Props> = ({ label, data, totalAnswered }) => {
  const { rows, columns, matrix, maxCount, fieldType } = data;
  const typeLabel =
    fieldType === "checkboxGrid" ? "checkbox grid" : "multiple choice grid";

  const COL_WIDTH = Math.max(64, Math.floor(480 / columns.length));

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
            {typeLabel} &bull; {totalAnswered} answered
          </Text>
        </div>
      }
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            minWidth: 300,
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              {/* empty corner */}
              <th
                style={{
                  padding: "6px 10px",
                  textAlign: "left",
                  fontWeight: 600,
                  borderBottom: "2px solid #e5e7eb",
                  minWidth: 120,
                }}
              />
              {columns.map((col) => (
                <th
                  key={col.id}
                  style={{
                    padding: "6px 4px",
                    textAlign: "center",
                    fontWeight: 600,
                    borderBottom: "2px solid #e5e7eb",
                    width: COL_WIDTH,
                    maxWidth: COL_WIDTH,
                    wordBreak: "break-word",
                    color: "#374151",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={row.id}>
                <td
                  style={{
                    padding: "6px 10px",
                    fontWeight: 500,
                    borderBottom: "1px solid #f3f4f6",
                    color: "#374151",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.label}
                </td>
                {columns.map((col, cIdx) => {
                  const count = matrix[rIdx][cIdx];
                  const intensity = count / maxCount;
                  const pct =
                    totalAnswered > 0
                      ? ((count / totalAnswered) * 100).toFixed(0)
                      : "0";
                  return (
                    <Tooltip
                      key={col.id}
                      title={`${row.label} → ${col.label}: ${count} selection${count !== 1 ? "s" : ""} (${pct}%)`}
                    >
                      <td
                        style={{
                          padding: "10px 4px",
                          textAlign: "center",
                          borderBottom: "1px solid #f3f4f6",
                          background: heatColor(intensity),
                          color: textColor(intensity),
                          fontWeight: count > 0 ? 600 : 400,
                          transition: "background 0.2s",
                          cursor: "default",
                          borderRadius: 4,
                        }}
                      >
                        {count > 0 ? count : ""}
                      </td>
                    </Tooltip>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Low
        </Text>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <div
            key={v}
            style={{
              width: 18,
              height: 18,
              borderRadius: 3,
              background: heatColor(v),
              border: "1px solid #e5e7eb",
            }}
          />
        ))}
        <Text type="secondary" style={{ fontSize: 11 }}>
          High
        </Text>
      </div>
    </Card>
  );
};
