import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Editors } from "./Editors";
import { Participants } from "./Participants";
import { useProfileContext } from "../../../../../hooks/useProfileContext";

enum ROLE {
  VIEW,
  EDIT,
}

export const Sharing = () => {
  const { t } = useTranslation();
  const { pubkey: userPubkey, requestPubkey } = useProfileContext();
  const [isEditListOpen, setIsEditListOpen] = useState<boolean>(false);
  const [isViewListOpen, setIsViewListOpen] = useState<boolean>(false);
  return (
    <Tooltip title={t("builder.sharing.configureTooltip")}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          my: 1.5,
          fontSize: 14,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontSize: 14 }}>
            {t("builder.sharing.configureAdmins")}
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              setIsEditListOpen(true);
            }}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontSize: 14 }}>
            {t("builder.sharing.participantsVisibility")}
          </Typography>
          <IconButton size="small" onClick={() => setIsViewListOpen(true)}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
        <Editors
          open={isEditListOpen}
          onCancel={() => setIsEditListOpen(false)}
        />
        <Participants
          open={isViewListOpen}
          onCancel={() => setIsViewListOpen(false)}
        />
      </Box>
    </Tooltip>
  );
};
