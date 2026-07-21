import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { normalizeURL } from "nostr-tools/utils";
import { useTranslation } from "react-i18next";

interface RelayPublishModalProps {
  relays: string[];
  acceptedRelays: string[];
  isOpen: boolean;
  publishFailed?: boolean;
  onClose?: () => void;
}

export const RelayPublishModal: React.FC<RelayPublishModalProps> = ({
  isOpen,
  relays,
  acceptedRelays,
  publishFailed,
  onClose,
}) => {
  const { t } = useTranslation();
  const allRelaysAccepted =
    relays && relays.every((url) => acceptedRelays.includes(normalizeURL(url)));

  const canClose = allRelaysAccepted || publishFailed;

  const renderRelays = () => {
    if (!relays) return null;

    return relays.map((url) => {
      const normalizedUrl = normalizeURL(url);
      const isAccepted = acceptedRelays.includes(normalizedUrl);
      const showFailed = publishFailed && !isAccepted;

      return (
        <Box
          key={url}
          sx={{ display: "flex", alignItems: "center", mb: 1 }}
        >
          {isAccepted ? (
            <CheckCircleIcon sx={{ color: "#52c41a", mr: 1, fontSize: 16 }} />
          ) : showFailed ? (
            <CancelIcon sx={{ color: "#ff4d4f", mr: 1, fontSize: 16 }} />
          ) : (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          )}
          <Typography>{url}</Typography>
        </Box>
      );
    });
  };

  return (
    <Dialog
      open={isOpen}
      onClose={canClose ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t("relayPublish.title")}</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontWeight: 600, display: "block", mb: 2 }}>
          {t("relayPublish.relays")}{" "}
          {allRelaysAccepted && `(${t("relayPublish.complete")})`}
        </Typography>
        {renderRelays()}
        {publishFailed && acceptedRelays.length === 0 && (
          <Typography color="error" sx={{ display: "block", mt: 2 }}>
            {t("relayPublish.noRelaysAccepted")}
          </Typography>
        )}
      </DialogContent>
      {canClose && (
        <DialogActions>
          <Button
            variant="contained"
            color={
              publishFailed && acceptedRelays.length === 0 ? "error" : "primary"
            }
            onClick={onClose}
          >
            {publishFailed && acceptedRelays.length === 0
              ? t("common.actions.close")
              : t("common.actions.done")}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
