import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, Spin, Typography } from "antd";
import { Event } from "nostr-tools";
import { fetchFormTemplate } from "../../nostr/fetchFormTemplate";
import { useProfileContext } from "../../hooks/useProfileContext";
import { LoadingOutlined } from "@ant-design/icons";
import { sendNotification } from "../../nostr/common";
import { FormRendererContainer } from "./FormRendererContainer";
import { ThankYouScreen } from "./ThankYouScreen";
import { ROUTES } from "../../constants/routes";
import { appConfig } from "../../config";
import { Response, Tag } from "../../nostr/types";

const { Text } = Typography;

interface CustomUrlFormProps {
  formSpec?: Tag[];
  embedded?: boolean;
}

interface FormMetadata {
  pubkey: string;
  identifier: string;
  relays: string[];
  viewKey?: string;
}

export const CustomUrlForm: React.FC<CustomUrlFormProps> = ({ formSpec }) => {
  const { formSlug } = useParams();
  const [searchParams] = useSearchParams();

  const isPreview = !!formSpec;
  const hideTitleImage = searchParams.get("hideTitleImage") === "true";
  const hideDescription = searchParams.get("hideDescription") === "true";

  const navigate = useNavigate();
  const { pubkey: userPubKey, requestPubkey } = useProfileContext();

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formEvent, setFormEvent] = useState<Event | undefined>();
  const [metadata, setMetadata] = useState<FormMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPreview && formSlug) {
      setLoading(true);
      fetch(`${appConfig.apiBaseUrl}/api/forms/${formSlug}`)
        .then((res) => res.json())
        .then((data) => setMetadata(data))
        .catch((err) => {
          console.error("Failed to fetch form metadata", err);
        })
        .finally(() => setLoading(false));
    }
  }, [formSlug]);

  useEffect(() => {
    if (metadata && !formEvent) {
      fetchFormTemplate(
        metadata.pubkey,
        metadata.identifier,
        (event: Event) => {
          setFormEvent(event);
        },
        metadata.relays,
      );
    }
  }, [metadata]);

  const onSubmit = async (responses: Response[], formTemplate: Tag[]) => {
    sendNotification(formTemplate, responses);
    setFormSubmitted(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: "30vh" }}>
        <Spin
          indicator={
            <LoadingOutlined style={{ fontSize: 48, color: "#F7931A" }} spin />
          }
        />
      </div>
    );
  }

  if (!formSpec && !formSlug) {
    return <Text> Not enough data to render this form. </Text>;
  }

  if (!metadata && !isPreview) {
    return <Text>Could not load form metadata.</Text>;
  }

  if (
    !isPreview &&
    formEvent?.content !== "" &&
    !userPubKey &&
    !metadata?.viewKey
  ) {
    return (
      <>
        <Text>This form is access-controlled and requires login.</Text>
        <Button onClick={requestPubkey}>Login</Button>
      </>
    );
  }

  if (formEvent) {
    return (
      <>
        <FormRendererContainer
          formEvent={formEvent}
          onSubmitClick={onSubmit}
          viewKey={metadata?.viewKey || null}
          hideTitleImage={hideTitleImage}
          hideDescription={hideDescription}
        />
        <ThankYouScreen
          viewKey={metadata?.viewKey || null}
          formEvent={formEvent}
          isOpen={formSubmitted}
          onClose={() => navigate(ROUTES.DASHBOARD)}
        />
      </>
    );
  }

  return null;
};
