import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { ImagePicker } from "../BackgroundImagePicker";
import { ChangeEvent, useRef, useState } from "react";

import { BlossomClient } from "../../../../utils/blossom";
import { createAuthEvent } from "../../../../utils/blossomAuth";

interface ImageSettingProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  pickerTitle: string;
  options: string[];
}

export default function ImageSetting({
  value,
  onChange,
  label,
  pickerTitle,
  options,
}: ImageSettingProps) {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInProgress = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploadInProgress.current) return;
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError(t("builder.formSettings.imageFileRequired"));
      return;
    }
    if (!file.size || file.size > 10 * 1024 * 1024) {
      setUploadError(t("builder.formSettings.imageSizeLimit"));
      return;
    }

    uploadInProgress.current = true;
    setUploading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const hash = await crypto.subtle.digest("SHA-256", bytes);
      const sha256 = Array.from(new Uint8Array(hash))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      const auth = await createAuthEvent("upload", sha256);
      const response = await new BlossomClient("https://nostr.download").upload(
        bytes,
        auth,
        file.type,
      );
      const data = JSON.parse(response);
      if (typeof data.url !== "string") throw new Error("Missing image URL");
      const url = new URL(data.url);
      if (!["https:", "http:"].includes(url.protocol)) {
        throw new Error("Invalid image URL");
      }
      onChange(url.href);
    } catch {
      setUploadError(t("builder.formSettings.imageUploadFailed"));
    } finally {
      uploadInProgress.current = false;
      setUploading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          my: 1.5,
        }}
      >
        <Typography sx={{ fontSize: 14 }}>{label}</Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          alignItems: "center",
        }}
      >
        <TextField
          disabled={uploading}
          size="small"
          fullWidth
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("builder.formSettings.customImageUrl")}
        />
        <Button
          disabled={uploading}
          aria-label={pickerTitle}
          variant="outlined"
          onClick={() => setDrawerOpen(true)}
          sx={{ minWidth: 40, px: 1 }}
        >
          ...
        </Button>
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleUpload}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        startIcon={uploading ? <CircularProgress size={16} /> : undefined}
        sx={{ mt: 1 }}
      >
        {t(
          uploading
            ? "builder.formSettings.uploadingImage"
            : "builder.formSettings.uploadImage",
        )}
      </Button>
      {uploadError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {uploadError}
        </Alert>
      )}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: "100%", sm: 500 } } } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {pickerTitle}
          </Typography>
          <ImagePicker
            options={options}
            selectedUrl={value}
            onSelect={(url: string) => {
              onChange(url);
              setDrawerOpen(false);
            }}
          />
        </Box>
      </Drawer>
    </>
  );
}
