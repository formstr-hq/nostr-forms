import { Box, IconButton, Typography } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useTranslation } from "react-i18next";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { ColorfulMarkdownTextarea } from "../../../../components/SafeMarkdown/ColorfulMarkdownInput";

function FormTitle({
  className,
  edit = true,
  imageUrl,
  formTitle,
}: {
  className: string;
  edit?: boolean;
  imageUrl?: string;
  formTitle?: string;
}) {
  const { t } = useTranslation();
  const {
    formSettings,
    formName,
    updateFormName,
    toggleSettingsWindow,
    isRightSettingsOpen,
    setQuestionIdInFocus,
  } = useFormBuilderContext();

  const settings = {
    name: edit ? formName : formTitle,
    image: edit ? formSettings.titleImageUrl : imageUrl,
  };

  const handleTitleChange = (name: string) => {
    updateFormName(name);
  };

  // The gear always opens Form settings: clearing the focused question makes
  // the settings pane/sheet render FormSettings instead of AnswerSettings.
  const openFormSettings = () => {
    setQuestionIdInFocus(undefined);
    if (!isRightSettingsOpen) toggleSettingsWindow();
  };

  return (
    <Box
      className={className}
      sx={{
        ...(settings.image
          ? {
              backgroundImage: `linear-gradient(180deg, rgb(0 0 0 / 0%), rgb(200 200 200) 110%), url(${settings.image})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { backgroundImage: "none" }),
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
        }}
      >
        {edit && (
          <IconButton
            title={t("builder.formSettings.title")}
            aria-label={t("builder.formSettings.title")}
            onClick={openFormSettings}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.7)",
              opacity: 0.8,
              "&:hover": { bgcolor: "rgba(255,255,255,0.9)", opacity: 1 },
            }}
          >
            <SettingsOutlinedIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      {!edit && (
        <Typography
          sx={{
            color: "white",
            fontSize: 24,
            fontWeight: 500,
            maxWidth: "95%",
            position: settings.image ? "absolute" : "static",
            bottom: settings.image ? 10 : "auto",
            left: settings.image ? 16 : "auto",
          }}
        >
          {settings.name}
        </Typography>
      )}
      {edit && (
        <Box
          sx={{
            color: "white",
            fontSize: 24,
            fontWeight: 500,
            maxWidth: "95%",
            position: settings.image ? "absolute" : "static",
            bottom: settings.image ? 10 : "auto",
            left: settings.image ? 16 : "auto",
          }}
        >
          <ColorfulMarkdownTextarea
            value={formName || ""}
            onChange={handleTitleChange}
            fontSize={24}
            color={
              formSettings.colors?.title ??
              formSettings.colors?.global ??
              formSettings.globalColor
            }
          />
        </Box>
      )}
    </Box>
  );
}

export default FormTitle;
