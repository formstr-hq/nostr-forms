import { useParams, useSearchParams } from "react-router-dom";
import FormBuilder from "../CreateFormNew/FormBuilder";
import useFormBuilderContext from "../CreateFormNew/hooks/useFormBuilderContext";
import { useEffect, useState } from "react";
import { HEADER_MENU_KEYS } from "../CreateFormNew/components/Header/config";
import { getPublicKey, nip19 } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils.js";
import { Box, CircularProgress, Typography } from "@mui/material";
import { getFormSpec as formSpecFromEvent } from "../../utils/formUtils";
import { useProfileContext } from "../../hooks/useProfileContext";
import { AddressPointer } from "nostr-tools/nip19";
import { FormRenderer } from "../FormFillerNew/FormRenderer";
import { decodeNKeys } from "../../utils/nkeys";
import { getDefaultRelays } from "../../nostr/common";
import { fetchOne } from "../../dataLayer";

function EditForm() {
  const { naddr } = useParams();
  let formId: string | undefined;
  let relays: string[] | undefined;
  if (naddr) {
    const { identifier, relays: relaysArray } = nip19.decode(naddr!)
      .data as AddressPointer;
    formId = identifier;
    relays = relaysArray;
  }
  const [searchParams] = useSearchParams();
  let formSecret = window.location.hash.replace(/^#/, "");
  let viewKeyParams = searchParams.get("viewKey");

  // Decode nkeys if applicable
  if (formSecret.startsWith("nkeys")) {
    const decoded = decodeNKeys(formSecret);
    formSecret = decoded?.secretKey || formSecret; // fallback to original if decoding fails
    if (!viewKeyParams) viewKeyParams = decoded?.viewKey || null;
  }

  const { initializeForm, saveDraft, selectedTab, getFormSpec, formSettings } =
    useFormBuilderContext();
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { pubkey: userPub } = useProfileContext();

  const fetchFormDataWithFormSecret = async (secret: string, dTag: string) => {
    let formPubkey = getPublicKey(hexToBytes(secret));
    let filter = {
      authors: [formPubkey],
      "#d": [dTag],
      kinds: [30168],
    };
    let formEvent = await fetchOne(
      [filter],
      Array.from(new Set([...(relays || []), ...getDefaultRelays()]) || []),
    );
    if (!formEvent) {
      setError("Form Not Found :(");
      return;
    }
    let formSpec =
      (await formSpecFromEvent(formEvent, userPub, null, viewKeyParams)) || [];
    initializeForm({
      spec: formSpec,
      id: dTag,
      secret: secret,
      viewKey: viewKeyParams,
      eventTags: formEvent.tags,
    });
    setInitialized(true);
  };

  const fetchFormData = async () => {
    if (formSecret && formId) fetchFormDataWithFormSecret(formSecret, formId);
    else {
      setError("Required Params Not Available");
    }
  };

  useEffect(() => {
    if (!initialized) {
      fetchFormData();
    }
    return () => {
      if (initialized) {
        saveDraft();
      }
    };
  }, [initialized, initializeForm, saveDraft]);

  if (error) return <Typography>{error}</Typography>;

  if (!initialized)
    return (
      <Box
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );

  if (selectedTab === HEADER_MENU_KEYS.BUILDER) {
    return <FormBuilder />;
  }
  if (selectedTab === HEADER_MENU_KEYS.PREVIEW) {
    return (
      <FormRenderer
        formTemplate={getFormSpec()}
        form={null}
        footer={null}
        onInput={() => {}}
        isPreview={true}
        formstrBranding={formSettings.formstrBranding}
      />
    );
  }

  return <></>;
}

export default EditForm;
