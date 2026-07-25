import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Popover,
  Slider,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import TitleImage from "./TitleImage";
import { Sharing } from "./Sharing";
import FormIdentifier from "./FormIdentifier";
import { Notifications } from "./Notifications";
import RelayManagerModal from "./RelayManagerModal";
import { BackgroundImageSetting } from "./BackgroundImage";
import { SketchPicker, ColorResult } from "react-color";
import { useState } from "react";
import { ThankYouScreenImageSetting } from "./ThankYouImage";
import { IColorSettings } from "./types";
import Automations from "./Automations";

type ColorKey = keyof IColorSettings;

const COLOR_LABELS: Record<ColorKey, string> = {
  global: "builder.formSettings.colorLabels.global",
  title: "builder.formSettings.colorLabels.title",
  description: "builder.formSettings.colorLabels.description",
  question: "builder.formSettings.colorLabels.question",
};

/** Replaces the old styled-components `.property-setting` row. */
const propertyRowSx = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  my: 1.5,
} as const;

const accordionSx = {
  "&:before": { display: "none" },
  // Square off the Paper so the full-bleed section dividers don't get clipped
  // into odd rounded corners by the theme's default 8px radius.
  borderRadius: 0,
  borderTop: "1px solid",
  borderColor: "divider",
} as const;

/** Section header row: inset to align with the Form Identifier label above. */
const summarySx = { px: 2, minHeight: 52 } as const;

/** Section body: same horizontal inset, no extra top padding under the header. */
const detailsSx = { px: 2, pt: 0 } as const;

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
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.75,
      }}
    >
      <Box
        role="button"
        aria-label={`Open ${label} color picker`}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: value,
          boxShadow: "0 0 0 2px #fff, 0 0 0 3px #d9d9d9",
          cursor: "pointer",
          transition: "box-shadow 0.15s",
          "&:hover": {
            boxShadow: "0 0 0 2px #fff, 0 0 0 3px #1677ff",
          },
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 0.5 } } }}
      >
        <Box>
          <SketchPicker
            color={value}
            onChange={(c: ColorResult) => onChange(c.hex)}
          />
          <Box sx={{ mt: 1, textAlign: "right" }}>
            <Button
              size="small"
              onClick={() => {
                onChange("#000000");
                setAnchorEl(null);
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Popover>
      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
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
    <Box sx={{ bgcolor: "background.paper", overflow: "auto" }}>
      {/* Always visible */}
      <Box sx={{ m: 2 }}>
        <Typography sx={{ fontSize: 14 }}>
          {t("builder.formSettings.formIdentifier")}
        </Typography>
        <FormIdentifier />
      </Box>

      {/* Collapsible groups */}
      <Box>
        <Accordion disableGutters elevation={0} sx={accordionSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={summarySx}>
            <Typography>{t("builder.formSettings.sections.access")}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={detailsSx}>
            <Tooltip title={t("builder.formSettings.postToBulletinTooltip")}>
              <Box sx={propertyRowSx}>
                <Typography sx={{ fontSize: 14 }}>
                  {t("builder.formSettings.postToBulletin")}
                </Typography>
                <Switch
                  checked={!formSettings.encryptForm}
                  onChange={(_e, checked) =>
                    updateFormSetting({ encryptForm: !checked })
                  }
                />
              </Box>
            </Tooltip>
            <Sharing />

            <Divider />

            <Box sx={propertyRowSx}>
              <Typography sx={{ fontSize: 14 }}>
                {t("builder.formSettings.disallowAnonymous")}
              </Typography>
              <Switch
                checked={formSettings.disallowAnonymous}
                onChange={(_e, checked) =>
                  updateFormSetting({ disallowAnonymous: checked })
                }
              />
            </Box>
            {formSettings.disallowAnonymous && (
              <Typography
                color="text.secondary"
                sx={{ fontSize: 12, display: "block" }}
              >
                {t("builder.formSettings.disallowAnonymousHint")}
              </Typography>
            )}
            <Divider />
            <Tooltip title={t("builder.formSettings.disablePreviewTooltip")}>
              <Box sx={propertyRowSx}>
                <Typography sx={{ fontSize: 14 }}>
                  {t("builder.formSettings.disablePreview")}
                </Typography>
                <Switch
                  checked={formSettings.disablePreview}
                  onChange={(_e, checked) =>
                    updateFormSetting({ disablePreview: checked })
                  }
                />
              </Box>
            </Tooltip>
            {!formSettings.disablePreview && (
              <Typography
                color="text.secondary"
                sx={{ fontSize: 12, display: "block" }}
              >
                {t("builder.formSettings.disablePreviewHint")}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters elevation={0} sx={accordionSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={summarySx}>
            <Typography>
              {t("builder.formSettings.sections.notifications")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={detailsSx}>
            <Notifications />
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters elevation={0} sx={accordionSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={summarySx}>
            <Typography>
              {t("builder.formSettings.sections.customization")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={detailsSx}>
            <Typography sx={{ fontSize: 12, display: "block", mb: 1 }}>
              {t("common.labels.colors")}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px 8px",
                mb: 0.5,
              }}
            >
              {(Object.keys(COLOR_LABELS) as ColorKey[]).map((key) => (
                <ColorSwatch
                  key={key}
                  colorKey={key}
                  label={t(COLOR_LABELS[key])}
                  value={colors[key] || "#000000"}
                  onChange={(hex) => updateColor(key, hex)}
                />
              ))}
            </Box>
            <Typography
              color="text.secondary"
              sx={{ fontSize: 11, display: "block", mb: 1 }}
            >
              {t("builder.formSettings.colorsFallback")}
            </Typography>
            <Divider />
            <TitleImage titleImageUrl={formSettings.titleImageUrl} />
            <Divider />
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
            <Divider />
            <Box sx={propertyRowSx}>
              <Box
                sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}
              >
                <Typography sx={{ fontSize: 14 }}>
                  {t("builder.formSettings.cardTransparency")}
                </Typography>
                <Slider
                  min={0.5}
                  max={1}
                  step={0.01}
                  value={formSettings.cardTransparency ?? 1}
                  onChange={(_e, value) =>
                    updateFormSetting({ cardTransparency: value as number })
                  }
                />
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  {t("builder.formSettings.cardTransparencyHint")}
                </Typography>
              </Box>
            </Box>
            <Tooltip title={t("builder.formSettings.brandingTooltip")}>
              <Box sx={propertyRowSx}>
                <Typography sx={{ fontSize: 14 }}>
                  {t("builder.formSettings.branding")}
                </Typography>
                <Switch
                  checked={formSettings.formstrBranding}
                  onChange={(_e, checked) =>
                    updateFormSetting({ formstrBranding: checked })
                  }
                />
              </Box>
            </Tooltip>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters elevation={0} sx={accordionSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={summarySx}>
            <Typography>{t("builder.formSettings.sections.relays")}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={detailsSx}>
            <Button
              variant="outlined"
              fullWidth
              onClick={toggleRelayManagerModal}
            >
              {t("builder.formSettings.manageRelays", {
                count: relayList.length,
              })}
            </Button>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          elevation={0}
          sx={{
            ...accordionSx,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={summarySx}>
            <Typography>
              {t("builder.formSettings.sections.automations")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={detailsSx}>
            <Automations />
          </AccordionDetails>
        </Accordion>
      </Box>

      {isRelayManagerModalOpen && (
        <RelayManagerModal
          isOpen={isRelayManagerModalOpen}
          onClose={toggleRelayManagerModal}
        />
      )}
    </Box>
  );
}

export default FormSettings;
