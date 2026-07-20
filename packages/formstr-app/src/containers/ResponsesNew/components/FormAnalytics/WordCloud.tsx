import React from "react";
import { Typography } from "@mui/material";
import { WordData } from "./dataUtils";
import { ChartCard } from "./ChartCard";

const FONT_SIZES = [13, 16, 20, 26, 34];
const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

interface Props {
  label: string;
  data: WordData[];
  totalAnswered: number;
}

export const WordCloud: React.FC<Props> = ({ label, data, totalAnswered }) => {
  return (
    <ChartCard label={label} meta={`text • ${totalAnswered} answered`}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px 14px",
          padding: "12px 8px",
          minHeight: 100,
          alignItems: "center",
        }}
      >
        {data.map(({ word, count, size }, i) => (
          <span
            key={word}
            title={`"${word}" — ${count} occurrence${count !== 1 ? "s" : ""}`}
            style={{
              fontSize: FONT_SIZES[size - 1],
              color: COLORS[i % COLORS.length],
              fontWeight: size >= 4 ? 700 : size >= 3 ? 600 : 400,
              lineHeight: 1.2,
              cursor: "default",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.opacity = "0.7")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.opacity = "1")
            }
          >
            {word}
          </span>
        ))}
      </div>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ pl: 1, display: "block" }}
      >
        Top {data.length} words &mdash; larger = more frequent
      </Typography>
    </ChartCard>
  );
};
