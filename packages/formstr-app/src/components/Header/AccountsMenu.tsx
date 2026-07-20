import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  MenuItem,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useTranslation } from "react-i18next";
import type { StoredAccount } from "@formstr/signer";
import { useProfileContext } from "../../hooks/useProfileContext";
import { NostrAvatar } from "./NostrAvatar";
import { truncateNpub } from "../../utils/utility";

const METHOD_LABEL_KEYS: Record<StoredAccount["method"], string> = {
  extension: "accounts.methods.extension",
  nip46: "accounts.methods.nip46",
  ncryptsec: "accounts.methods.ncryptsec",
  android: "accounts.methods.android",
};

interface AccountsMenuListProps {
  /** Switching landed on a locked ncryptsec account — caller should prompt for its passphrase. */
  onNeedsPassphrase: (pubkey: string) => void;
  onAddAccount: () => void;
  /** Called after any terminal action so the caller can close its menus. */
  onDone: () => void;
}

/**
 * MUI MenuItem list for the account switcher + "Add account" entry.
 * A component (not a config-hook like the old antd version) because MUI
 * Menus are JSX subtrees, which also lets the remove-confirm dialog live
 * here instead of antd's imperative Modal.confirm.
 */
export const AccountsMenuList = ({
  onNeedsPassphrase,
  onAddAccount,
  onDone,
}: AccountsMenuListProps) => {
  const { t } = useTranslation();
  const { accounts, pubkey, switchAccount, removeAccount } =
    useProfileContext();
  const [removeTarget, setRemoveTarget] = useState<StoredAccount | null>(null);

  const handleSwitch = async (account: StoredAccount) => {
    if (account.pubkey === pubkey) return;
    const { locked } = await switchAccount(account.pubkey);
    onDone();
    if (locked) onNeedsPassphrase(account.pubkey);
  };

  const handleConfirmRemove = () => {
    if (removeTarget) removeAccount(removeTarget.pubkey);
    setRemoveTarget(null);
    onDone();
  };

  return (
    <>
      {accounts.map((account) => (
        <MenuItem
          key={account.pubkey}
          onClick={() => void handleSwitch(account)}
          sx={{ gap: 1, py: 1 }}
        >
          <NostrAvatar pubkey={account.pubkey} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: account.pubkey === pubkey ? 600 : 400 }}
              noWrap
            >
              {truncateNpub(account.pubkey)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t(METHOD_LABEL_KEYS[account.method])}
            </Typography>
          </Box>
          {account.pubkey === pubkey && (
            <CheckIcon color="success" fontSize="small" />
          )}
          <IconButton
            size="small"
            aria-label={t("accounts.removeAction")}
            onClick={(event) => {
              event.stopPropagation();
              setRemoveTarget(account);
            }}
          >
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </MenuItem>
      ))}
      <Divider />
      <MenuItem
        onClick={() => {
          onAddAccount();
        }}
      >
        <ListItemIcon>
          <AddIcon fontSize="small" />
        </ListItemIcon>
        {t("accounts.addAccount")}
      </MenuItem>

      <Dialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("accounts.removeTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {removeTarget?.method === "ncryptsec"
              ? t("accounts.removeBodyNcryptsec")
              : t("accounts.removeBody")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveTarget(null)}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmRemove}
          >
            {t("accounts.removeAction")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
