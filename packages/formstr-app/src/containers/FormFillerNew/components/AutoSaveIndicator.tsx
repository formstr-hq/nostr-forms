import { Typography } from "antd";

const { Text } = Typography;

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
    <Text type="secondary" style={{ fontSize: 12, marginTop: 5 }}>
      {saveStatus === "saving" ? "Saving locally..." : "Saved"}
    </Text>
  );
};
