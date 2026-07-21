import { Box, Button, IconButton, Tab, Tabs, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link } from "react-router-dom";
import { HEADER_MENU_KEYS } from "./config";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { useState } from "react";
import { normalizeURL } from "nostr-tools/utils";
import { RelayPublishModal } from "../../../../components/RelayPublishModal/RelaysPublishModal";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "../../../../providers/SnackbarProvider";
import { MEDIA_QUERY_MOBILE } from "../../../../utils/css";

/**
 * Builder header (MUI, ui-rewrite-mui Phase 5): back link, Publish action,
 * and the Builder/Preview tab switch. Import/AI-builder are action buttons
 * (previously non-selectable antd menu items).
 */
export const CreateFormHeader: React.FC = () => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const [isPostPublishModalOpen, setIsPostPublishModalOpen] = useState(false);
  const [acceptedRelays, setAcceptedRelays] = useState<string[]>([]);
  const [publishFailed, setPublishFailed] = useState(false);

  const {
    saveForm,
    setSelectedTab,
    formSettings,
    relayList,
    setIsAiModalOpen,
    setIsImportModalVisible,
    selectedTab,
    questionsList,
  } = useFormBuilderContext();

  const handlePublishClick = async () => {
    if (questionsList.length === 0) {
      showMessage(t("builder.header.noQuestions"), "error");
      return;
    }

    if (!formSettings?.formId) {
      showMessage(t("builder.header.formIdRequired"), "error");
      return;
    }

    setIsPostPublishModalOpen(true);
    setAcceptedRelays([]);
    setPublishFailed(false);

    try {
      await saveForm((url: string) => {
        const normalizedUrl = normalizeURL(url);
        setAcceptedRelays((prev) => [...prev, normalizedUrl]);
      });
    } catch (error) {
      console.error("Failed to publish the form", error);
      setPublishFailed(true);
    }
  };

  return (
    <Box
      className="create-form-header"
      sx={{
        boxShadow:
          "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        px: 2,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        [MEDIA_QUERY_MOBILE]: { px: "15px" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <IconButton component={Link} to="/" aria-label="back to forms">
          <ArrowBackIcon />
        </IconButton>
        <Typography>{t("builder.header.allForms")}</Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="contained"
          onClick={handlePublishClick}
          disabled={isPostPublishModalOpen}
        >
          {t("builder.header.publish")}
        </Button>
        <Button onClick={() => setIsImportModalVisible(true)}>
          {t("builder.header.importForms")}
        </Button>
        <Button onClick={() => setIsAiModalOpen(true)}>
          {t("builder.header.aiBuilder")}
        </Button>
        <Tabs
          value={selectedTab}
          onChange={(_e, value) => {
            if (
              value === HEADER_MENU_KEYS.BUILDER ||
              value === HEADER_MENU_KEYS.PREVIEW
            ) {
              setSelectedTab(value);
            }
          }}
          sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40 } }}
        >
          <Tab
            value={HEADER_MENU_KEYS.BUILDER}
            label={t("builder.header.formBuilder")}
          />
          <Tab
            value={HEADER_MENU_KEYS.PREVIEW}
            label={t("builder.header.preview")}
          />
        </Tabs>
      </Box>

      <RelayPublishModal
        relays={relayList.map((r) => r.url)}
        acceptedRelays={acceptedRelays}
        isOpen={isPostPublishModalOpen}
        publishFailed={publishFailed}
        onClose={() => {
          setIsPostPublishModalOpen(false);
          setPublishFailed(false);
        }}
      />
    </Box>
  );
};
