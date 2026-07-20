import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Event } from "nostr-tools";
import { fetchFormTemplate } from "../../nostr/fetchFormTemplate";
import { useProfileContext } from "../../hooks/useProfileContext";
import { sendNotification } from "../../nostr/common";
import { FormRendererContainer } from "./FormRendererContainer";
import { ThankYouScreen } from "./ThankYouScreen";
import { ROUTES } from "../../constants/routes";
import { appConfig } from "../../config";
import { Response, Tag } from "../../nostr/types";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      <Box sx={{ textAlign: "center", paddingTop: "30vh" }}>
        <CircularProgress size={48} sx={{ color: "#F7931A" }} />
      </Box>
    );
  }

  if (!formSpec && !formSlug) {
    return <Typography>{t("filler.customUrl.notEnoughData")}</Typography>;
  }

  if (!metadata && !isPreview) {
    return <Typography>{t("filler.customUrl.metadataLoadFailed")}</Typography>;
  }

  if (
    !isPreview &&
    formEvent?.content !== "" &&
    !userPubKey &&
    !metadata?.viewKey
  ) {
    return (
      <>
        <Typography>{t("filler.customUrl.accessControlled")}</Typography>
        <Button variant="contained" onClick={requestPubkey}>
          {t("common.actions.login")}
        </Button>
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
