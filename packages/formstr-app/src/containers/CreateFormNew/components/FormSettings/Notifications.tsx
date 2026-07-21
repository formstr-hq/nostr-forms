import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useTranslation } from "react-i18next";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { useState } from "react";
import { NpubList } from "./Sharing/NpubList";

export const Notifications = () => {
  const { t } = useTranslation();
  const { updateFormSetting, formSettings } = useFormBuilderContext();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleSetNpubs = (npubs: Set<string>) => {
    updateFormSetting({
      notifyNpubs: Array.from(npubs),
    });
  };

  const hasNpubs = (formSettings.notifyNpubs || []).length > 0;

  return (
    <>
      <Tooltip title={t("builder.notifications.configureTooltip")}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            my: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 14 }}>
            {t("builder.notifications.configure")}
          </Typography>
          <IconButton size="small" onClick={() => setIsModalOpen(true)}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <NpubList
            NpubList={new Set(formSettings.notifyNpubs || [])}
            setNpubList={handleSetNpubs}
            ListHeader={t("builder.notifications.recipients")}
          />
          {hasNpubs && (
            <Typography
              sx={{
                fontSize: 12,
                color: "#ea8dea",
                display: "block",
                mt: 0.5,
                "& a": { color: "inherit", textDecoration: "underline" },
              }}
            >
              {t("builder.notifications.warningPrefix")}
              <a
                href="https://github.com/nostr-protocol/nips/blob/master/04.md"
                target="_blank"
                rel="noreferrer"
              >
                {" "}
                nip-04{" "}
              </a>
              {t("builder.notifications.warningSuffix")}
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
