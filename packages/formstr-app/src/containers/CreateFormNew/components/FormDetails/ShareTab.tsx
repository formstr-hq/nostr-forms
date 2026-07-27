import { UrlBox } from "./UrlBox";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Box, Typography } from "@mui/material";
import { SupportUsButton } from "@formstr/support-us-button";

export const ShareTab = ({
  formUrl,
  responsesUrl,
}: {
  formUrl: string;
  responsesUrl?: string;
}) => {
  return (
    <Box
      className="share-links"
      sx={{
        wordWrap: "break-word",
        overflowWrap: "anywhere",
      }}
    >
      {/* Compact confirmation header — replaces the oversized success badge. */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          mb: 2.5,
        }}
      >
        <CheckCircleRoundedIcon color="success" fontSize="small" />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Your form is ready to share
        </Typography>
      </Box>

      <UrlBox label="Live Form URL" url={formUrl} />

      {responsesUrl && (
        <UrlBox
          label="Responses URL"
          url={responsesUrl}
          warning="Anyone with this link can view responses to this form. Share it carefully."
        />
      )}

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ display: "block", textAlign: "center", mt: 2 }}
      >
        Enjoying Formstr?{" "}
        <SupportUsButton
          buttonText="Support Us"
          type="link"
          style={{ fontSize: 12, padding: 0, height: "auto" }}
        />
      </Typography>
    </Box>
  );
};
