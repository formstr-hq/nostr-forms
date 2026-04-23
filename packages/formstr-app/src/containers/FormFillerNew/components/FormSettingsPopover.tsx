import { Button, Divider, Modal, Popover, Switch, Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface FormSettingsPopoverProps {
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  onClearForm?: () => void;
}

export const FormSettingsPopover: React.FC<FormSettingsPopoverProps> = ({
  autoSaveEnabled,
  onToggleAutoSave,
  onClearForm,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleClearClick = () => {
    setOpen(false);
    Modal.confirm({
      title: t("filler.settings.clearAllTitle"),
      content: t("filler.settings.clearAllBody"),
      okText: t("filler.settings.clearForm"),
      cancelText: t("common.actions.cancel"),
      okButtonProps: { danger: true },
      onOk: onClearForm,
    });
  };

  const content = (
    <div style={{ minWidth: 200 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{t("filler.settings.autoSave")}</span>
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
        {t("filler.settings.autoSaveHint")}
      </Text>
      {onClearForm && (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <Button danger block onClick={handleClearClick}>
            {t("filler.settings.clearForm")}
          </Button>
        </>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title={t("filler.settings.title")}
      trigger="click"
      placement="topRight"
      open={open}
      onOpenChange={setOpen}
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
