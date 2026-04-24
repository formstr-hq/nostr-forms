import { Typography } from "antd";
import { CopyButton } from "../../../../components/CopyButton";
import { makeFormNAddr } from "../../../../utils/formLinks";

const { Text } = Typography;

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
    <div
      className="sdk-embed"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        textAlign: "left",
        wordBreak: "keep-all",
      }}
    >
      {/* Explanation / docs */}
      <div style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontSize: 16,
            display: "block",
            marginBottom: 6,
          }}
        >
          Styling & customization
        </Text>
        <Text>Start by copying the below snippet into your html!</Text>
      </div>

      {/* Copy button */}
      <div style={{ marginBottom: 10 }}>
        <CopyButton getText={() => sdkSnippet} />
      </div>

      {/* Code block */}
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: 420,
          overflow: "auto",
          background: "#0f172a",
          color: "#e5e7eb",
          padding: "1rem",
          borderRadius: 8,
          width: "100%",
        }}
      >
        {sdkSnippet}
      </pre>
      <ul
        style={{
          paddingLeft: 16,
          margin: 0,
          fontSize: 12,
          color: "rgba(0, 0, 0, 0.55)",
        }}
      >
        <li>
          The SDK renders neutral HTML — you control layout and appearance via
          CSS.
        </li>
        <li>
          You can style the form by targeting CSS classes like these:
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
          For detailed explanation, see the{" "}
          <a
            href="https://github.com/abh3po/nostr-forms/blob/master/packages/formstr-sdk/README.md"
            target="_blank"
            rel="noreferrer"
          >
            Formstr SDK documentation
          </a>
          .
        </li>
      </ul>
    </div>
  );
};
