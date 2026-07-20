import React from "react";
import { Card, CardContent, CardHeader, Typography } from "@mui/material";

interface ChartCardProps {
  label: string;
  meta: string;
  children: React.ReactNode;
}

/** Shared card chrome for the analytics charts (MUI, Phase 4). */
export const ChartCard: React.FC<ChartCardProps> = ({
  label,
  meta,
  children,
}) => (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardHeader
      sx={{ pb: 0 }}
      title={
        <Typography component="span" sx={{ fontWeight: 600, fontSize: 14 }}>
          {label}
        </Typography>
      }
      subheader={
        <Typography component="span" variant="caption" color="text.secondary">
          {meta}
        </Typography>
      }
    />
    <CardContent sx={{ "&:last-child": { pb: 2 } }}>{children}</CardContent>
  </Card>
);
