import {
  Button,
  Collapse,
  Divider,
  Popover,
  Input,
  Select,
  Slider,
  Switch,
  Tooltip,
  Typography,
} from "antd";
import { useTranslation } from "react-i18next";
import StyleWrapper from "./style";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import TitleImage from "./TitleImage";
import { Sharing } from "./Sharing";
import FormIdentifier from "./FormIdentifier";
import { Notifications } from "./Notifications";
import { isMobile } from "../../../../utils/utility";
import RelayManagerModal from "./RelayManagerModal";
import { BackgroundImageSetting } from "./BackgroundImage";
import { SketchPicker, ColorResult } from "react-color";
import { useState } from "react";
import { ThankYouScreenImageSetting } from "./ThankYouImage";
import { IColorSettings } from "./types";

const { Text } = Typography;
const { Panel } = Collapse;
import Automations from "./Automations";

type ColorKey = keyof IColorSettings;

const COLOR_LABELS: Record<ColorKey, string> = {
  global: "builder.formSettings.colorLabels.global",
  title: "builder.formSettings.colorLabels.title",
  description: "builder.formSettings.colorLabels.description",
  question: "builder.formSettings.colorLabels.question",
};

function ColorSwatch({
  colorKey,
  label,
  value,
  onChange,
}: {
  colorKey: ColorKey;
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <Popover
        open={open}
        onOpenChange={setOpen}
        content={
          <div style={{ padding: 4 }}>
            <SketchPicker
              color={value}
              onChange={(c: ColorResult) => onChange(c.hex)}
            />
            <div style={{ marginTop: 8, textAlign: "right" }}>
              <Button
                size="small"
                onClick={() => {
                  onChange("#000000");
                  setOpen(false);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        }
        placement="topLeft"
        overlayStyle={{ padding: 0 }}
        destroyTooltipOnHide
      >
        <div
          role="button"
          aria-label={`Open ${label} color picker`}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: value,
            boxShadow: "0 0 0 2px #fff, 0 0 0 3px #d9d9d9",
            cursor: "pointer",
            transition: "box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px #fff, 0 0 0 3px #1677ff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px #fff, 0 0 0 3px #d9d9d9";
          }}
        />
      </Popover>
      <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{label}</Text>
    </div>
  );
}

function FormSettings() {
  const { t } = useTranslation();
  const {
    formSettings,
    relayList,
    updateFormSetting,
    toggleRelayManagerModal,
    isRelayManagerModalOpen,
  } = useFormBuilderContext();

  const colors = formSettings.colors || {};

  const updateColor = (key: ColorKey, hex: string) => {
    updateFormSetting({ colors: { ...colors, [key]: hex } });
  };
  return (
    <StyleWrapper>
      {/* Always visible */}
      <div className="form-setting">
        <Text className="property-name">
          {t("builder.formSettings.formIdentifier")}
        </Text>
        <FormIdentifier />
      </div>

      {/* Collapsible groups */}
      <Collapse expandIconPosition="end">
        <Panel header={t("builder.formSettings.sections.access")} key="access">
          <Tooltip
            title={t("builder.formSettings.postToBulletinTooltip")}
            trigger={isMobile() ? "click" : "hover"}
          >
            <div className="property-setting">
              <Text className="property-text">
                {t("builder.formSettings.postToBulletin")}
              </Text>
              <Switch
                checked={!formSettings.encryptForm}
                onChange={(checked) =>
                  updateFormSetting({ encryptForm: !checked })
                }
              />
            </div>
          </Tooltip>
          <Sharing />

          <Divider className="divider" />

          <div className="property-setting">
            <Text className="property-text">
              {t("builder.formSettings.disallowAnonymous")}
            </Text>
            <Switch
              checked={formSettings.disallowAnonymous}
              onChange={(checked) =>
                updateFormSetting({ disallowAnonymous: checked })
              }
            />
          </div>
          {formSettings.disallowAnonymous && (
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              {t("builder.formSettings.disallowAnonymousHint")}
            </Text>
          )}
          <Divider className="divider" />
          <Tooltip
            title={t("builder.formSettings.disablePreviewTooltip")}
            trigger={isMobile() ? "click" : "hover"}
          >
            <div className="property-setting">
              <Text className="property-text">
                {t("builder.formSettings.disablePreview")}
              </Text>
              <Switch
                checked={formSettings.disablePreview}
                onChange={(checked) =>
                  updateFormSetting({ disablePreview: checked })
                }
              />
            </div>
          </Tooltip>
          {!formSettings.disablePreview && (
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              {t("builder.formSettings.disablePreviewHint")}
            </Text>
          )}
        </Panel>

        <Panel
          header={t("builder.formSettings.sections.notifications")}
          key="notifications"
        >
          <Notifications />
        </Panel>

        <Panel
          header={t("builder.formSettings.sections.customization")}
          key="customization"
        >
          <Text style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
            {t("common.labels.colors")}
          </Text>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 8px", marginBottom: 4 }}>
            {(Object.keys(COLOR_LABELS) as ColorKey[]).map((key) => (
              <ColorSwatch
                key={key}
                colorKey={key}
                label={t(COLOR_LABELS[key])}
                value={colors[key] || "#000000"}
                onChange={(hex) => updateColor(key, hex)}
              />
            ))}
          </div>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
            {t("builder.formSettings.colorsFallback")}
          </Text>
          <Divider className="divider" />
          <TitleImage titleImageUrl={formSettings.titleImageUrl} />
          <Divider className="divider" />
          <BackgroundImageSetting
            value={formSettings.backgroundImageUrl}
            onChange={(url: string) => {
              updateFormSetting({ backgroundImageUrl: url });
            }}
          />
          <ThankYouScreenImageSetting
            value={formSettings.thankYouScreenImageUrl}
            onChange={(url: string) => {
              updateFormSetting({ thankYouScreenImageUrl: url });
            }}
          />
          <Divider className="divider" />
          <div className="property-setting">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Text>{t("builder.formSettings.cardTransparency")}</Text>
              <Slider
                min={0.5}
                max={1}
                step={0.01}
                value={formSettings.cardTransparency}
                onChange={(value) =>
                  updateFormSetting({ cardTransparency: value })
                }
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t("builder.formSettings.cardTransparencyHint")}
              </Text>
            </div>
          </div>
          <Tooltip
            title={t("builder.formSettings.brandingTooltip")}
            trigger={isMobile() ? "click" : "hover"}
          >
            <div className="property-setting">
              <Text className="property-text">
                {t("builder.formSettings.branding")}
              </Text>
              <Switch
                checked={formSettings.formstrBranding}
                onChange={(checked) =>
                  updateFormSetting({ formstrBranding: checked })
                }
              />
            </div>
          </Tooltip>
        </Panel>

        <Panel header={t("builder.formSettings.sections.relays")} key="relays">
          <Button
            onClick={toggleRelayManagerModal}
            type="default"
            style={{ width: "100%" }}
          >
            {t("builder.formSettings.manageRelays", {
              count: relayList.length,
            })}
          </Button>
        </Panel>
        <Panel
          header={t("builder.formSettings.sections.automations")}
          key="nrpc-webhook"
        >
          <Automations />
        </Panel>
      </Collapse>

      {isRelayManagerModalOpen && (
        <RelayManagerModal
          isOpen={isRelayManagerModalOpen}
          onClose={toggleRelayManagerModal}
        />
      )}
    </StyleWrapper>
  );
}

export default FormSettings;
