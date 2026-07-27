import { Box, Link, Typography } from "@mui/material";
import { CopyButton } from "../../../../components/CopyButton";
import { makeFormNAddr } from "../../../../utils/utility";
import { useTranslation } from "react-i18next";

export const EmbedWithSDKTab = ({
  pubKey,
  formId,
  relays,
  viewKey,
}: {
  pubKey: string;
  formId: string;
  relays: string[];
  viewKey?: string;
}) => {
  const { t } = useTranslation();
  const naddr = makeFormNAddr(pubKey, formId, relays);
  const isPrivate = Boolean(viewKey);

  const sdkSnippet = isPrivate
    ? `<!-- Container -->
<div id="formstr-container"></div>

<script src="https://cdn.jsdelivr.net/npm/@formstr/sdk@0/dist/formstr.bundle.js"></script>
<script>
  const sdk = new FormstrSDK.FormstrSDK();

  async function mountForm() {
    const naddr = "${naddr}";
    const viewKey = "${viewKey}";

    const form = await sdk.fetchFormWithViewKey(naddr, viewKey);
    sdk.renderHtml(form);

    document.getElementById("formstr-container").innerHTML =
      form.html.form;

    sdk.attachSubmitListener(form);
  }

  mountForm();
</script>`
    : `<!-- Container -->
<div id="formstr-container"></div>

<script src="https://cdn.jsdelivr.net/npm/@formstr/sdk@0/dist/formstr.bundle.js"></script>
<script>
  const sdk = new FormstrSDK.FormstrSDK();

  async function mountForm() {
    const naddr = "${naddr}";

    const form = await sdk.fetchForm(naddr);
    sdk.renderHtml(form);

    document.getElementById("formstr-container").innerHTML =
      form.html.form;

    sdk.attachSubmitListener(form);
  }

  mountForm();
</script>`;

  return (
    <Box
      className="sdk-embed"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        textAlign: "left",
        wordBreak: "keep-all",
      }}
    >
      {/* Explanation / docs */}
      <Box sx={{ mb: 1.5 }}>
        <Typography>{t("builder.formDetails.sdk.intro")}</Typography>
      </Box>

      {/* Code block — copy lives in the block's own header bar so it reads as
          part of the snippet instead of floating above it. */}
      <Box
        sx={{
          width: "100%",
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            py: 0.25,
            bgcolor: "background.default",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            HTML
          </Typography>
          <CopyButton getText={() => sdkSnippet} />
        </Box>
        <Box
          component="pre"
          sx={{
            m: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: 360,
            overflow: "auto",
            bgcolor: "#0f172a",
            color: "#e5e7eb",
            p: "1rem",
            fontSize: 12,
            width: "100%",
          }}
        >
          {sdkSnippet}
        </Box>
      </Box>
      <Box
        component="ul"
        sx={{
          pl: 2,
          m: 0,
          fontSize: 12,
          color: "text.secondary",
        }}
      >
        <li>{t("builder.formDetails.sdk.neutralHtml")}</li>
        <li>
          {t("builder.formDetails.sdk.classesIntro")}
          <ul style={{ marginTop: 4, paddingLeft: 16 }}>
            <li>
              <code>.form-body</code> – main form wrapper
            </li>
            <li>
              <code>.form-section</code> – each section/page
            </li>
            <li>
              <code>.form-intro</code> – intro block (title + description)
            </li>
            <li>
              <code>.section-title</code> – section headings
            </li>
            <li>
              <code>.section-description</code> – section descriptions
            </li>
            <li>
              <code>.option-group</code> – radio / option fields
            </li>
            <li>
              <code>#submit-container</code> – submit button wrapper
            </li>
          </ul>
        </li>
        <li>
          {t("builder.formDetails.sdk.docsIntro")}{" "}
          <Link
            href="https://github.com/abh3po/nostr-forms/blob/master/packages/formstr-sdk/README.md"
            target="_blank"
            rel="noreferrer"
          >
            {t("builder.formDetails.sdk.docsLink")}
          </Link>
          .
        </li>
      </Box>
    </Box>
  );
};
