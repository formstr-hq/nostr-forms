import { UrlBox } from "./UrlBox";
import { ReactComponent as Success } from "../../../../Images/success.svg";
import { Typography } from "antd";
import { SupportUsButton } from "@formstr/support-us-button";

const { Text } = Typography;

export const ShareTab = ({
  formUrl,
  responsesUrl,
}: {
  formUrl: string;
  responsesUrl?: string;
}) => {
  return (
    <div className="share-links" style={{ textAlign: "center" }}>
      <Success />

      <div style={{ marginTop: 12 }}>
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
      </div>

      <Text
        type="secondary"
        style={{ display: "block", marginTop: 20, fontSize: 12 }}
      >
        Enjoying Formstr?{" "}
        <SupportUsButton
          buttonText="Support Us"
          type="link"
          style={{ fontSize: 12, padding: 0, height: "auto" }}
        />
      </Text>
    </div>
  );
};
