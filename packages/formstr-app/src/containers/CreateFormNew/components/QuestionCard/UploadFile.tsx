import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import AudioFileOutlinedIcon from "@mui/icons-material/AudioFileOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onImageUpload?: (url: string) => void;
}

type MediaType = "image" | "audio" | "video";

const UploadFile: React.FC<Props> = ({ onImageUpload }) => {
  const { t } = useTranslation();
  const [urlInput, setUrlInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [selectedMediaType, setSelectedMediaType] =
    useState<MediaType>("image");

  const formatMediaUrl = (url: string, mediaType: MediaType = "image") => {
    if (mediaType === "image") {
      const fileName = (
        url
          .split("/")
          .pop()
          ?.replace(/\.[^/.]+$/, "") || "image"
      ).slice(0, 5);
      return `![${fileName}](${url})`;
    } else if (mediaType === "audio") {
      return `<audio controls src="${url}"></audio>`;
    } else if (mediaType === "video") {
      return `<video controls src="${url}" style="max-width:100%;max-height:300px;"></video>`;
    }
    return "";
  };

  const showModal = () => {
    setIsModalOpen(true);
    setPreviewError(false);
    setUrlInput("");
    setSelectedMediaType("image");
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setUrlInput("");
    setPreviewError(false);
    setSelectedMediaType("image");
  };

  const handleUrlInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setUrlInput(e.target.value);
    setPreviewError(false);
  };

  const handlePreviewError = () => {
    setPreviewError(true);
  };

  const handleUrlSubmit = (mediaType: MediaType) => {
    if (urlInput && !previewError) {
      onImageUpload?.(formatMediaUrl(urlInput, mediaType));
      setIsModalOpen(false);
      setUrlInput("");
      setPreviewError(false);
    }
  };

  const renderMediaTab = (mediaType: MediaType) => (
    <Box sx={{ py: "20px" }}>
      <TextField
        multiline
        rows={4}
        fullWidth
        placeholder={t("builder.inputPreviews.mediaEnterUrl", {
          type: t(`builder.inputPreviews.${mediaType}`).toLowerCase(),
        })}
        value={urlInput}
        onChange={handleUrlInputChange}
        sx={{ mb: "16px" }}
        slotProps={{
          htmlInput: { "aria-label": `${mediaType} URL input` },
        }}
      />
      {urlInput && selectedMediaType === mediaType && (
        <Box sx={{ mb: "16px" }}>
          {previewError ? (
            <Alert severity="error" sx={{ mb: "16px" }}>
              {t("builder.inputPreviews.mediaInvalidUrl", {
                type: t(`builder.inputPreviews.${mediaType}`).toLowerCase(),
              })}
            </Alert>
          ) : (
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "8px",
                p: "8px",
                mb: "16px",
              }}
            >
              <Typography sx={{ display: "block", mb: "8px" }}>
                {t("builder.inputPreviews.preview")}
              </Typography>
              {mediaType === "image" ? (
                <img
                  src={urlInput}
                  alt="Preview"
                  onError={handlePreviewError}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    objectFit: "contain",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              ) : mediaType === "audio" ? (
                <audio
                  controls
                  src={urlInput}
                  onError={handlePreviewError}
                  style={{ width: "100%" }}
                />
              ) : (
                <video
                  controls
                  src={urlInput}
                  onError={handlePreviewError}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    display: "block",
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      )}
      <Button
        variant="contained"
        onClick={() => handleUrlSubmit(mediaType)}
        disabled={!urlInput || previewError}
        fullWidth
      >
        {t("builder.inputPreviews.submitUrl")}
      </Button>
    </Box>
  );

  return (
    <Box>
      <Tooltip title={t("builder.inputPreviews.mediaButton")}>
        <IconButton
          onClick={showModal}
          aria-label={t("builder.inputPreviews.mediaButton")}
          size="small"
          sx={{
            mr: "10px",
            height: 32,
            width: 32,
            color: "primary.main",
            bgcolor: "rgba(0, 0, 0, 0.05)",
            "&:hover": { bgcolor: "rgba(0, 0, 0, 0.09)" },
          }}
        >
          <PermMediaOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Dialog open={isModalOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>{t("builder.inputPreviews.mediaModalTitle")}</DialogTitle>
        <DialogContent>
          <Tabs
            value={selectedMediaType}
            onChange={(_, key) => {
              setSelectedMediaType(key as MediaType);
              setUrlInput("");
              setPreviewError(false);
            }}
          >
            <Tab
              value="image"
              icon={<ImageOutlinedIcon />}
              iconPosition="start"
              label={t("builder.inputPreviews.image")}
            />
            <Tab
              value="audio"
              icon={<AudioFileOutlinedIcon />}
              iconPosition="start"
              label={t("builder.inputPreviews.audio")}
            />
            <Tab
              value="video"
              icon={<VideocamOutlinedIcon />}
              iconPosition="start"
              label={t("builder.inputPreviews.video")}
            />
          </Tabs>
          {renderMediaTab(selectedMediaType)}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UploadFile;
