import { UrlBox } from "./UrlBox";
import { ReactComponent as Success } from "../../../../Images/success.svg";
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
        textAlign: "center",
        wordWrap: "break-word",
        overflowWrap: "anywhere",
      }}
    >
      <Success />

      <Box sx={{ mt: 1.5 }}>
        <UrlBox label="Live Form URL" url={formUrl} />

        {responsesUrl && (
          <>
            <UrlBox
              label="Responses URL"
              url={responsesUrl}
              warning="Anyone with this link can view responses to this form. Share it carefully."
            />
          </>
        )}
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ display: "block", mt: 2.5 }}
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
