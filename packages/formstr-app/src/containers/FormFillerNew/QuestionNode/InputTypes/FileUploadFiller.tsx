import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useRef, useState, useEffect } from "react";
import { IAnswerSettings } from "../../../CreateFormNew/components/AnswerSettings/types";
import { Field, FileUploadMetadata } from "../../../../nostr/types";
import { BlossomClient } from "../../../../utils/blossom";
import { createAuthEvent } from "../../../../utils/blossomAuth";
import {
  encryptFileToAuthor,
  decryptFileFromUploader,
} from "../../../../utils/blossomCrypto";
import { hexToBytes } from "nostr-tools/utils";
import { DEFAULT_SERVERS } from "../../../CreateFormNew/components/AnswerSettings/settings/FileUploadSettings";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "../../../../providers/SnackbarProvider";

interface FileUploadFillerProps {
  fieldConfig: IAnswerSettings;
  onChange: (value: string, displayValue?: string) => void;
  field?: Field;
  disabled?: boolean;
  defaultValue?: string;
  formAuthorPubkey?: string;
  formEditKey?: string;
  responderSecretKey: Uint8Array; // Required - always used for file encryption (signers can't handle large files)
  uploaderPubkey?: string; // For decryption when viewing responses
}

export const FileUploadFiller: React.FC<FileUploadFillerProps> = ({
  fieldConfig,
  onChange,
  disabled,
  defaultValue,
  formAuthorPubkey,
  formEditKey,
  responderSecretKey,
  uploaderPubkey,
}) => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const blossomServer: string = fieldConfig.blossomServer || DEFAULT_SERVERS[0];
  const maxFileSize: number = (fieldConfig.maxFileSize || 10) * 1024 * 1024; // Convert MB to bytes
  const allowedTypes: string[] = fieldConfig.allowedTypes || [];

  const parseExistingMetadata = (
    value: string | undefined,
  ): FileUploadMetadata | null => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && parsed.sha256) {
        return parsed as FileUploadMetadata;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const existingMetadata = parseExistingMetadata(defaultValue);
  const [uploadedMetadata, setUploadedMetadata] =
    useState<FileUploadMetadata | null>(existingMetadata);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadSteps = [
    t("filler.inputs.fileUpload.uploadSteps.reading"),
    t("filler.inputs.fileUpload.uploadSteps.encrypting"),
    t("filler.inputs.fileUpload.uploadSteps.preparing"),
    t("filler.inputs.fileUpload.uploadSteps.uploading"),
    t("filler.inputs.fileUpload.uploadSteps.complete"),
  ];

  const downloadSteps = [
    t("filler.inputs.fileUpload.downloadSteps.authenticating"),
    t("filler.inputs.fileUpload.downloadSteps.downloading"),
    t("filler.inputs.fileUpload.downloadSteps.decrypting"),
    t("filler.inputs.fileUpload.downloadSteps.saving"),
    t("filler.inputs.fileUpload.downloadSteps.complete"),
  ];

  useEffect(() => {
    const parsed = parseExistingMetadata(defaultValue);
    if (parsed) {
      setUploadedMetadata(parsed);
    } else if (!defaultValue) {
      setUploadedMetadata(null);
    }
  }, [defaultValue]);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxFileSize) {
      showMessage(
        t("filler.inputs.fileUpload.sizeLimit", {
          size: fieldConfig.maxFileSize || 10,
        }),
        "error",
      );
      return false;
    }

    // Check file type if restrictions exist
    if (allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some((type) => {
        if (type.endsWith("/*")) {
          const prefix = type.slice(0, -2);
          return file.type.startsWith(prefix);
        }
        return file.type === type;
      });

      if (!isAllowed) {
        showMessage(
          t("filler.inputs.fileUpload.fileTypeNotAllowed", {
            type: file.type,
          }),
          "error",
        );
        return false;
      }
    }

    return true;
  };

  const handleUpload = async (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    setUploading(true);
    setCurrentStep(0);

    try {
      if (!formAuthorPubkey) {
        throw new Error(t("filler.inputs.fileUpload.authorKeyUnavailable"));
      }

      // Step 0: Read file as Uint8Array
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      setCurrentStep(1);

      // Step 1: Encrypt file TO form author
      // Always uses responderSecretKey (signers can't handle large files)
      const { ciphertext, uploaderPubkey } = await encryptFileToAuthor(
        fileBytes,
        formAuthorPubkey,
        responderSecretKey,
      );
      setCurrentStep(2);

      // Step 2: Convert encrypted ciphertext to bytes for upload & create auth
      const encryptedBytes = new TextEncoder().encode(ciphertext);
      const sha256Hash = await calculateSHA256(encryptedBytes);
      const authHeader = await createAuthEvent(
        "upload",
        sha256Hash,
        60,
        responderSecretKey,
      );
      setCurrentStep(3);

      // Step 3: Upload to Blossom server
      const client = new BlossomClient(blossomServer);
      const uploadResponse = await client.upload(encryptedBytes, authHeader);

      // Parse upload response to get actual sha256
      const uploadData = JSON.parse(uploadResponse);
      const actualSha256 = uploadData.sha256;

      // Create metadata using actual sha256 from server
      const metadata: FileUploadMetadata = {
        sha256: actualSha256,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        server: blossomServer,
        uploadedAt: Math.floor(Date.now() / 1000),
        uploaderPubkey, // Store the pubkey used for encryption
      };

      const metadataString = JSON.stringify(metadata);
      setUploadedMetadata(metadata);
      onChange(metadataString, file.name);
      setCurrentStep(4);

      showMessage(t("filler.inputs.fileUpload.uploadSuccess"), "success");
    } catch (error: any) {
      console.error("Upload failed:", error);
      if (error.isCorsError) {
        showMessage(t("filler.inputs.fileUpload.uploadCorsError"), "error");
      } else {
        showMessage(
          t("filler.inputs.fileUpload.uploadFailed", {
            message: error.message || t("common.status.unknownError"),
          }),
          "error",
        );
      }
    } finally {
      setUploading(false);
      setTimeout(() => setCurrentStep(0), 1000);
    }
  };

  const calculateSHA256 = async (data: Uint8Array): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleDownload = async () => {
    if (!uploadedMetadata) return;
    if (!formEditKey) {
      showMessage(
        t("filler.inputs.fileUpload.downloadKeyUnavailable"),
        "error",
      );
      return;
    }
    if (!uploaderPubkey) {
      showMessage(t("filler.inputs.fileUpload.uploaderUnavailable"), "error");
      return;
    }

    setDownloading(true);
    setCurrentStep(0);

    try {
      // Step 0: Create auth event for download (use formEditKey)
      const formEditKeyBytes = hexToBytes(formEditKey);
      const authHeader = await createAuthEvent(
        "get",
        uploadedMetadata.sha256,
        60,
        formEditKeyBytes,
      );
      setCurrentStep(1);

      // Step 1: Download from Blossom server
      const client = new BlossomClient(uploadedMetadata.server);
      const encryptedBytes = await client.download(
        uploadedMetadata.sha256,
        authHeader,
      );
      setCurrentStep(2);

      // Step 2: Convert bytes to ciphertext string & decrypt
      const ciphertext = new TextDecoder().decode(encryptedBytes);

      // Decrypt file using form editKey + uploader's pubkey (from response event)
      const decryptedBytes = await decryptFileFromUploader(
        ciphertext,
        formEditKey,
        uploaderPubkey,
      );
      setCurrentStep(3);

      // Step 3: Trigger browser download with original filename
      const blob = new Blob([decryptedBytes], {
        type: uploadedMetadata.mimeType,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = uploadedMetadata.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setCurrentStep(4);

      showMessage(t("filler.inputs.fileUpload.downloadSuccess"), "success");
    } catch (error: any) {
      console.error("Download failed:", error);
      if (error.isCorsError) {
        showMessage(t("filler.inputs.fileUpload.downloadCorsError"), "error");
      } else {
        showMessage(
          t("filler.inputs.fileUpload.downloadFailed", {
            message: error.message || t("common.status.unknownError"),
          }),
          "error",
        );
      }
    } finally {
      setDownloading(false);
      setTimeout(() => setCurrentStep(0), 1000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleClearUpload = async () => {
    if (!uploadedMetadata) return;

    setDeleting(true);
    try {
      // Create auth event for deletion
      const authHeader = await createAuthEvent(
        "delete",
        uploadedMetadata.sha256,
        60,
        responderSecretKey,
      );

      // Delete from Blossom server
      const client = new BlossomClient(uploadedMetadata.server);
      await client.delete(uploadedMetadata.sha256, authHeader);

      // Clear local state
      setUploadedMetadata(null);
      onChange("", ""); // Clear the form field value
      showMessage(t("filler.inputs.fileUpload.deleteSuccess"), "success");
    } catch (error: any) {
      console.error("Delete failed:", error);
      if (error.isCorsError) {
        showMessage(t("filler.inputs.fileUpload.deleteCorsError"), "error");
      } else {
        showMessage(
          t("filler.inputs.fileUpload.deleteFailed", {
            message: error.message || t("common.status.unknownError"),
          }),
          "error",
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleFilePicked = (files: FileList | null) => {
    const file = files?.[0];
    if (file) {
      void handleUpload(file);
    }
  };

  const hasUploadedFile = !!uploadedMetadata;

  return (
    <Box sx={{ width: "100%" }}>
      {!hasUploadedFile && !uploading && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept={allowedTypes.join(",")}
            disabled={disabled}
            onChange={(e) => {
              handleFilePicked(e.target.files);
              e.target.value = "";
            }}
          />
          <Box
            role="button"
            aria-disabled={disabled}
            onClick={() => {
              if (!disabled) fileInputRef.current?.click();
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!disabled) handleFilePicked(e.dataTransfer.files);
            }}
            sx={{
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              cursor: disabled ? "default" : "pointer",
              backgroundColor: "background.paper",
              transition: "border-color 0.2s",
              "&:hover": disabled
                ? undefined
                : { borderColor: "primary.main" },
            }}
          >
            <InboxOutlinedIcon
              sx={{ fontSize: 42, color: "primary.main", mb: 1 }}
            />
            <Typography variant="body1">
              {t("filler.inputs.fileUpload.clickOrDrag")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("filler.inputs.fileUpload.encryptedHint")}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block" }}
            >
              {t("filler.inputs.fileUpload.maxSize", {
                size: fieldConfig.maxFileSize || 10,
              })}
              {allowedTypes.length > 0 && (
                <>
                  {" "}
                  • {t("filler.inputs.fileUpload.allowed")}:{" "}
                  {allowedTypes.join(", ")}
                </>
              )}
            </Typography>
          </Box>
        </>
      )}

      {(uploading || downloading) && (
        <Stack spacing={2} sx={{ width: "100%" }}>
          <Typography sx={{ fontWeight: 600 }}>
            {uploading
              ? t("filler.inputs.fileUpload.uploading")
              : t("filler.inputs.fileUpload.downloading")}
          </Typography>
          <Stepper
            activeStep={currentStep}
            alternativeLabel
            sx={{
              "& .MuiStepLabel-root.Mui-active .MuiStepIcon-root": {
                animation: "calmBlink 2s ease-in-out infinite",
              },
              "@keyframes calmBlink": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.4 },
              },
            }}
          >
            {(uploading ? uploadSteps : downloadSteps).map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Stack>
      )}

      {hasUploadedFile && uploadedMetadata && (
        <Box
          sx={{
            backgroundColor: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: 2,
            p: 2,
          }}
        >
          <Stack spacing={1} sx={{ width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleOutlineOutlinedIcon
                sx={{ color: "#52c41a", fontSize: 20 }}
              />
              <Typography sx={{ fontWeight: 600, fontSize: 16 }}>
                {t("filler.inputs.fileUpload.uploaded")}
              </Typography>
            </Box>

            <Box sx={{ pl: 3.5 }}>
              <Typography component="span" sx={{ fontWeight: 600 }}>
                {t("filler.inputs.fileUpload.filename")}:
              </Typography>{" "}
              <Typography component="span">
                {uploadedMetadata.filename}
              </Typography>
            </Box>

            <Box sx={{ pl: 3.5 }}>
              <Typography component="span" sx={{ fontWeight: 600 }}>
                {t("filler.inputs.fileUpload.size")}:
              </Typography>{" "}
              <Typography component="span">
                {formatFileSize(uploadedMetadata.size)}
              </Typography>
            </Box>

            <Box sx={{ pl: 3.5 }}>
              <Typography component="span" sx={{ fontWeight: 600 }}>
                {t("filler.inputs.fileUpload.type")}:
              </Typography>{" "}
              <Typography component="span">
                {uploadedMetadata.mimeType}
              </Typography>
            </Box>

            <Box sx={{ pl: 3.5 }}>
              <Typography component="span" sx={{ fontWeight: 600 }}>
                {t("filler.inputs.fileUpload.uploadedAt")}:
              </Typography>{" "}
              <Typography component="span">
                {formatDate(uploadedMetadata.uploadedAt)}
              </Typography>
            </Box>

            <Box sx={{ pl: 3.5 }}>
              <Typography component="span" sx={{ fontWeight: 600 }}>
                {t("filler.inputs.fileUpload.server")}:
              </Typography>{" "}
              <Typography
                component="span"
                sx={{
                  fontSize: "12px",
                  color: "text.secondary",
                  wordBreak: "break-all",
                }}
              >
                {uploadedMetadata.server}
              </Typography>
            </Box>

            <Box
              sx={{
                pl: 3.5,
                mt: 1,
                pt: 1,
                borderTop: "1px solid #d9f7be",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {`\u2713 ${t("filler.inputs.fileUpload.encryptedLabel")}`}
              </Typography>
            </Box>

            <Box sx={{ pl: 3.5, mt: 1.5 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<DownloadOutlinedIcon />}
                  onClick={handleDownload}
                  disabled={downloading || deleting}
                >
                  {t("filler.inputs.fileUpload.downloadFile")}
                </Button>
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteOutlinedIcon />}
                  disabled={disabled || deleting}
                  onClick={() => setConfirmClearOpen(true)}
                >
                  {t("filler.inputs.fileUpload.clearUpload")}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      )}

      <Dialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
      >
        <DialogTitle>{t("filler.inputs.fileUpload.clearUpload")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("filler.inputs.fileUpload.clearUploadConfirm")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClearOpen(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setConfirmClearOpen(false);
              void handleClearUpload();
            }}
          >
            {t("filler.inputs.fileUpload.clearUploadOk")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
