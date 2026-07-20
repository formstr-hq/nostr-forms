import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useProfileContext } from "../../hooks/useProfileContext";
import { useSnackbar } from "../../providers/SnackbarProvider";
import { truncateNpub } from "../../utils/utility";

interface UnlockAccountModalProps {
  open: boolean;
  pubkey?: string;
  onClose: () => void;
}

/** Prompts for a passphrase after switchAccount lands on a locked ncryptsec account. */
export const UnlockAccountModal: React.FC<UnlockAccountModalProps> = ({
  open,
  pubkey,
  onClose,
}) => {
  const { t } = useTranslation();
  const { unlockActiveWithPassphrase } = useProfileContext();
  const { showMessage } = useSnackbar();
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setPassphrase("");
    onClose();
  };

  const handleUnlock = async () => {
    if (!passphrase) return;
    setLoading(true);
    try {
      await unlockActiveWithPassphrase(passphrase);
      setPassphrase("");
      onClose();
    } catch {
      showMessage(t("accounts.unlockFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("accounts.unlockTitle")}</DialogTitle>
      <DialogContent>
        {pubkey && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("accounts.unlockBody", { npub: truncateNpub(pubkey) })}
          </Typography>
        )}
        <TextField
          type="password"
          fullWidth
          size="small"
          autoFocus
          placeholder={t("accounts.passphrasePlaceholder")}
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleUnlock();
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          fullWidth
          disabled={loading || !passphrase}
          onClick={() => void handleUnlock()}
        >
          {t("accounts.unlockAction")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
