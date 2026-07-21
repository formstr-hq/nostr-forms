import React, { useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import LinkIcon from "@mui/icons-material/Link";
import { Event } from "nostr-tools";
import { useTranslation } from "react-i18next";
import { parseFormUrl, ParsedFormUrl } from "../../utils/formUrlParser";
import { fetchFormTemplate } from "../../nostr/fetchFormTemplate";
import { ILocalForm } from "../../containers/CreateFormNew/providers/FormBuilder/typeDefs";
import { useLocalForms } from "../../provider/LocalFormsProvider";
import { useSnackbar } from "../../providers/SnackbarProvider";

interface ImportFormModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

interface FormPreview {
  parsed: ParsedFormUrl;
  formName: string;
  formEvent: Event;
}

const ImportFormModal: React.FC<ImportFormModalProps> = ({
  open,
  onClose,
  onImported,
}) => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<FormPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { localForms, saveLocalForm } = useLocalForms();

  const resetState = () => {
    setUrlInput("");
    setPreview(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleParseUrl = async () => {
    setError(null);
    setPreview(null);

    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      setError(t("import.enterUrl"));
      return;
    }

    const parsed = parseFormUrl(trimmedUrl);
    if (!parsed) {
      setError(t("import.invalidUrl"));
      return;
    }

    if (!parsed.secretKey) {
      setError(t("import.requiresEditAccess"));
      return;
    }

    // Check if already imported
    const formKey = `${parsed.pubkey}:${parsed.formId}`;
    if (localForms.some((f) => f.key === formKey)) {
      setError(t("import.alreadyImported"));
      return;
    }

    // Fetch form to get name and validate it exists
    setLoading(true);
    try {
      const formEvent = await new Promise<Event | null>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        }, 10000);

        fetchFormTemplate(
          parsed.pubkey,
          parsed.formId,
          (event: Event) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(event);
            }
          },
          parsed.relays.length > 0 ? parsed.relays : undefined,
        );
      });

      if (!formEvent) {
        setError(t("import.notFound"));
        setLoading(false);
        return;
      }

      // Extract form name from tags
      const nameTag = formEvent.tags.find((t) => t[0] === "name");
      const formName = nameTag?.[1] || t("common.status.untitledForm");

      setPreview({
        parsed,
        formName,
        formEvent,
      });
    } catch (e) {
      console.error("Error fetching form:", e);
      setError(t("import.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    const { parsed, formName } = preview;
    const relays =
      parsed.relays.length > 0 ? parsed.relays : ["wss://relay.damus.io"];

    const formToSave: ILocalForm = {
      key: `${parsed.pubkey}:${parsed.formId}`,
      publicKey: parsed.pubkey,
      privateKey: parsed.secretKey!,
      name: formName,
      formId: parsed.formId,
      relay: relays[0],
      relays: relays,
      createdAt: new Date().toString(),
      ...(parsed.viewKey && { viewKey: parsed.viewKey }),
    };

    try {
      await saveLocalForm(formToSave);
      showMessage(t("import.importSuccess"), "success");
      handleClose();
      onImported();
    } catch (e) {
      showMessage(t("import.importFailed"), "error");
    }
  };

  const truncatePubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ transition: { onExited: resetState } }}
    >
      <DialogContent>
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h4" sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
            <DownloadIcon fontSize="small" />
            {t("import.title")}
          </Typography>
          <Typography color="text.secondary">{t("import.subtitle")}</Typography>
        </Box>

        <Stack spacing={2}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            placeholder={t("import.placeholder")}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={loading || !!preview}
          />

          {error && <Alert severity="error">{error}</Alert>}

          {!preview && (
            <Button
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <LinkIcon />
                )
              }
              onClick={handleParseUrl}
              disabled={loading}
              fullWidth
            >
              {loading ? t("import.fetching") : t("import.parse")}
            </Button>
          )}

          {preview && (
            <>
              <Alert severity="success">
                <AlertTitle>{t("import.formFound")}</AlertTitle>
                <Box sx={{ mt: 1 }}>
                  <p>
                    <strong>{t("import.labels.name")}:</strong> {preview.formName}
                  </p>
                  <p>
                    <strong>{t("import.labels.formId")}:</strong>{" "}
                    {preview.parsed.formId}
                  </p>
                  <p>
                    <strong>{t("import.labels.author")}:</strong>{" "}
                    {truncatePubkey(preview.parsed.pubkey)}
                  </p>
                  <p>
                    <strong>{t("import.labels.relays")}:</strong>{" "}
                    {preview.parsed.relays.length > 0
                      ? preview.parsed.relays.length
                      : 1}{" "}
                    {t("import.relayCount", {
                      count:
                        preview.parsed.relays.length > 0
                          ? preview.parsed.relays.length
                          : 1,
                    })}
                  </p>
                  {preview.parsed.viewKey && (
                    <p>
                      <strong>{t("import.labels.viewKey")}:</strong>{" "}
                      {t("import.included")}
                    </p>
                  )}
                  <p>
                    <strong>{t("import.labels.editAccess")}:</strong>{" "}
                    {t("import.editAccessIncluded")}
                  </p>
                </Box>
              </Alert>

              <Alert severity="info">
                <AlertTitle>{t("import.editAccessNoticeTitle")}</AlertTitle>
                {t("import.editAccessNoticeBody")}
              </Alert>

              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "flex-end",
                  gap: 1,
                }}
              >
                <Button onClick={resetState}>{t("common.actions.cancel")}</Button>
                <Button variant="contained" onClick={handleImport}>
                  {t("import.title")}
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ImportFormModal;
