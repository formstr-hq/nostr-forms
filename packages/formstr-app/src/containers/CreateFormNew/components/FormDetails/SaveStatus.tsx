import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import { useTranslation } from "react-i18next";

export const SaveStatus = ({
  savedLocally,
  savedOnNostr,
  userPub,
  requestPubkey,
}: {
  savedLocally: boolean;
  savedOnNostr: boolean;
  userPub: string | undefined;
  requestPubkey: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Box
      className="save-status"
      sx={{
        py: 1.5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Chip
        size="small"
        variant="outlined"
        color={savedLocally ? "success" : "default"}
        icon={
          savedLocally ? (
            <CheckCircleRoundedIcon />
          ) : (
            <RadioButtonUncheckedRoundedIcon />
          )
        }
        label={t("builder.formDetails.savedLocally")}
      />

      {userPub ? (
        <Box className="nostr-save-status">
          {!savedOnNostr ? (
            <Chip
              size="small"
              variant="outlined"
              icon={<CircularProgress size={12} thickness={5} />}
              label={t("builder.formDetails.savingToProfile")}
            />
          ) : (
            <Chip
              size="small"
              variant="outlined"
              color="success"
              icon={<CheckCircleRoundedIcon />}
              label={t("builder.formDetails.savedToProfile")}
            />
          )}
        </Box>
      ) : (
        <Box
          className="login-prompt"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 1,
            mt: 0.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t("builder.formDetails.loginToSave")}
          </Typography>
          <Button variant="outlined" size="small" onClick={requestPubkey}>
            {t("common.actions.login")}
          </Button>
        </Box>
      )}
    </Box>
  );
};
