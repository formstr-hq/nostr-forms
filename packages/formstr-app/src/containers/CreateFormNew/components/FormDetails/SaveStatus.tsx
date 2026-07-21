import { Box, Button, CircularProgress, Typography } from "@mui/material";
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
    <Box className="save-status" sx={{ py: 1 }}>
      <Box>
        {t("builder.formDetails.savedLocally")} {savedLocally ? "✅" : "❌"}
      </Box>
      {userPub ? (
        <Box className="nostr-save-status">
          {!savedOnNostr ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
              }}
            >
              <Typography>
                {t("builder.formDetails.savingToProfile")}
              </Typography>
              <CircularProgress size={16} />
            </Box>
          ) : (
            <Box>
              {t("builder.formDetails.savedToProfile")}{" "}
              {savedOnNostr ? "✅" : "❌"}
            </Box>
          )}
        </Box>
      ) : (
        <Box
          className="login-prompt"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mt: 1,
          }}
        >
          <Typography>{t("builder.formDetails.loginToSave")}</Typography>
          <Button variant="outlined" size="small" onClick={requestPubkey}>
            {t("common.actions.login")}
          </Button>
        </Box>
      )}
    </Box>
  );
};
