import { Popover, Switch, Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface FormSettingsPopoverProps {
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
}

export const FormSettingsPopover: React.FC<FormSettingsPopoverProps> = ({
  autoSaveEnabled,
  onToggleAutoSave,
}) => {
  const content = (
    <div style={{ minWidth: 200 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Auto-save progress</span>
        <Switch
          checked={autoSaveEnabled}
          onChange={onToggleAutoSave}
          size="small"
        />
      </div>
      <Text
        type="secondary"
        style={{ fontSize: 11, display: "block", marginTop: 4 }}
      >
        Saves your answers locally so you can continue later
      </Text>
    </div>
  );

  return (
    <Popover
      content={content}
      title="Form Settings"
      trigger="click"
      placement="topRight"
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.65)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <SettingOutlined style={{ fontSize: 14, color: "#666" }} />
      </div>
    </Popover>
  );
};
