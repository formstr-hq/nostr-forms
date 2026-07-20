import { Typography } from "@mui/material";

export type SaveStatus = "idle" | "saving" | "saved";

interface AutoSaveIndicatorProps {
  saveStatus: SaveStatus;
  enabled: boolean;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  saveStatus,
  enabled,
}) => {
  if (!enabled || saveStatus === "idle") {
    return null;
  }

  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: "block", mt: "5px" }}
    >
      {saveStatus === "saving" ? "Saving locally..." : "Saved"}
    </Typography>
  );
};
