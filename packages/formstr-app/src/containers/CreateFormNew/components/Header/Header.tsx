import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
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
  const isMobile = useMediaQuery("(max-width:768px)", { noSsr: true });
  const [isPostPublishModalOpen, setIsPostPublishModalOpen] = useState(false);
  const [acceptedRelays, setAcceptedRelays] = useState<string[]>([]);
  const [publishFailed, setPublishFailed] = useState(false);
  const [overflowAnchor, setOverflowAnchor] = useState<HTMLElement | null>(null);

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

  const isPreview = selectedTab === HEADER_MENU_KEYS.PREVIEW;
  const togglePreview = () => {
    setSelectedTab(
      isPreview ? HEADER_MENU_KEYS.BUILDER : HEADER_MENU_KEYS.PREVIEW,
    );
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

      {isMobile ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            onClick={togglePreview}
            aria-label={isPreview ? t("builder.header.formBuilder") : t("builder.header.preview")}
          >
            {isPreview ? <EditOutlinedIcon /> : <VisibilityOutlinedIcon />}
          </IconButton>
          <Button
            variant="contained"
            size="small"
            onClick={handlePublishClick}
            disabled={isPostPublishModalOpen}
          >
            {t("builder.header.publish")}
          </Button>
          <IconButton
            aria-label="more actions"
            onClick={(e) => setOverflowAnchor(e.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={overflowAnchor}
            open={Boolean(overflowAnchor)}
            onClose={() => setOverflowAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setIsImportModalVisible(true);
                setOverflowAnchor(null);
              }}
            >
              {t("builder.header.importForms")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setIsAiModalOpen(true);
                setOverflowAnchor(null);
              }}
            >
              {t("builder.header.aiBuilder")}
            </MenuItem>
          </Menu>
        </Box>
      ) : (
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
      )}

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
