import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Popover,
  Switch,
  Typography,
} from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FormSettingsPopoverProps {
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  onClearForm?: () => void;
}

export const FormSettingsPopover: React.FC<FormSettingsPopoverProps> = ({
  autoSaveEnabled,
  onToggleAutoSave,
  onClearForm,
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const closePopover = () => setAnchorEl(null);

  const handleClearClick = () => {
    closePopover();
    setConfirmClear(true);
  };

  const handleConfirmClear = () => {
    setConfirmClear(false);
    onClearForm?.();
  };

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label={t("filler.settings.title")}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: 0,
          p: 0,
          background: "rgba(255, 255, 255, 0.65)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <SettingsOutlinedIcon sx={{ fontSize: 14, color: "#666" }} />
      </Box>
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ minWidth: 200, p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t("filler.settings.title")}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="text.primary">
              {t("filler.settings.autoSave")}
            </Typography>
            <Switch
              checked={autoSaveEnabled}
              onChange={onToggleAutoSave}
              size="small"
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5 }}
          >
            {t("filler.settings.autoSaveHint")}
          </Typography>
          {onClearForm && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Button
                color="error"
                variant="outlined"
                fullWidth
                onClick={handleClearClick}
              >
                {t("filler.settings.clearForm")}
              </Button>
            </>
          )}
        </Box>
      </Popover>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("filler.settings.clearAllTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t("filler.settings.clearAllBody")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClear(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmClear}>
            {t("filler.settings.clearForm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
