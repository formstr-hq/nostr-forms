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
  global: "Global",
  title: "Title",
  description: "Description",
  question: "Question",
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
        <Text className="property-name">Form Identifier</Text>
        <FormIdentifier />
      </div>

      {/* Collapsible groups */}
      <Collapse expandIconPosition="end">
        <Panel header="Access & Participants" key="access">
          <Tooltip
            title="This toggle will leave the form un-encrypted and allow anyone to view the form."
            trigger={isMobile() ? "click" : "hover"}
          >
            <div className="property-setting">
              <Text className="property-text">Post to Bulletin Board</Text>
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
              Disallow Anonymous Submissions
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
              *This will require participants to be logged in with their Nostr
              account
            </Text>
          )}
          <Divider className="divider" />
          <Tooltip
            title="If enabled, Formstr servers can access your form to generate previews."
            trigger={isMobile() ? "click" : "hover"}
          >
            <div className="property-setting">
              <Text className="property-text">Disable Link Previews</Text>
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
              *Link preview generation is enabled. Formstr servers will be able
              to see the form template. This is required to generate the preview
              of the form.
            </Text>
          )}
        </Panel>

        <Panel header="Notifications" key="notifications">
          <Notifications />
        </Panel>

        <Panel header="Customization" key="customization">
          <Text style={{ fontSize: 12, display: "block", marginBottom: 8 }}>Colors</Text>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 8px", marginBottom: 4 }}>
            {(Object.keys(COLOR_LABELS) as ColorKey[]).map((key) => (
              <ColorSwatch
                key={key}
                colorKey={key}
                label={COLOR_LABELS[key]}
                value={colors[key] || "#000000"}
                onChange={(hex) => updateColor(key, hex)}
              />
            ))}
          </div>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
            Title, Description &amp; Question fall back to Global if not set.
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
              <Text>Card Transparency</Text>
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
                Adjust transparency of form cards (0 = fully transparent, 1 =
                fully opaque)
              </Text>
            </div>
          </div>
          <Tooltip
            title="This toggle will add Formstr branding to the bottom of your form."
            trigger={isMobile() ? "click" : "hover"}
          >
            <div className="property-setting">
              <Text className="property-text">Add Formstr branding</Text>
              <Switch
                checked={formSettings.formstrBranding}
                onChange={(checked) =>
                  updateFormSetting({ formstrBranding: checked })
                }
              />
            </div>
          </Tooltip>
        </Panel>

        <Panel header="Relay Configuration" key="relays">
          <Button
            onClick={toggleRelayManagerModal}
            type="default"
            style={{ width: "100%" }}
          >
            Manage Relays
          </Button>
        </Panel>
        <Panel header="Automations" key="nrpc-webhook">
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
