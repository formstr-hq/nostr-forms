import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, Spin, Typography } from "antd";
import { Event, nip19 } from "nostr-tools";
import { fetchFormTemplate } from "../../nostr/fetchFormTemplate";
import { useProfileContext } from "../../hooks/useProfileContext";
import { AddressPointer } from "nostr-tools/nip19";
import { LoadingOutlined } from "@ant-design/icons";
import { sendNotification } from "../../nostr/common";
import { FormRendererContainer } from "./FormRendererContainer";
import { ThankYouScreen } from "./ThankYouScreen";
import { ROUTES } from "../../constants/routes";

import { decodeNKeys } from "../../utils/nkeys";
import { Response, Tag } from "../../nostr/types";

function getViewKeyFromUrl(explicitProp?: string | null): string | null {
  let viewKey: string | undefined;

  //
  // 1️⃣ Highest priority – #nkeys... in hash
  //
  const rawHash = window.location.hash.replace(/^#/, "");
  if (rawHash.startsWith("nkeys")) {
    try {
      const decoded = decodeNKeys(rawHash);
      if (decoded.viewKey) return decoded.viewKey;
    } catch (e) {
      console.warn("Invalid nkeys payload in hash:", e);
    }
  }

  //
  // 2️⃣ Next – standard `?viewKey=xyz`
  //
  const search = new URLSearchParams(window.location.search);
  const paramViewKey = search.get("viewKey");
  if (paramViewKey) return paramViewKey;

  //
  // 3️⃣ Finally – explicit prop passed into component
  //
  return explicitProp ?? null;
}

const { Text } = Typography;

interface FormFillerProps {
  formSpec?: Tag[];
  embedded?: boolean;
  naddr?: string;
  viewKey?: string;
  preFetchedFormContent?: Event;
}

export const FormFiller: React.FC<FormFillerProps> = ({
  formSpec,
  preFetchedFormContent,
  naddr: _naddr,
  viewKey: _viewKey,
}) => {
  let { naddr } = useParams();
  naddr = naddr || _naddr;
  const isPreview = !!formSpec;
  if (!isPreview && !naddr)
    return <Text> Not enough data to render this url </Text>;
  let decodedData;
  if (!isPreview) decodedData = nip19.decode(naddr!).data as AddressPointer;
  const pubKey = decodedData?.pubkey;
  const formId = decodedData?.identifier;
  const relays = decodedData?.relays;
  const { pubkey: userPubKey, requestPubkey } = useProfileContext();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formEvent, setFormEvent] = useState<Event | undefined>(
    preFetchedFormContent,
  );
  const [searchParams] = useSearchParams();
  const hideTitleImage = searchParams.get("hideTitleImage") === "true";
  const viewKeyParams = getViewKeyFromUrl(_viewKey);
  const hideDescription = searchParams.get("hideDescription") === "true";
  const navigate = useNavigate();


  if (!formId && !formSpec) {
    return null;
  }

  const initialize = async (
    formAuthor: string,
    formId: string,
    relays?: string[],
  ) => {
    const form = await fetchFormTemplate(
      formAuthor,
      formId,
      (event: Event) => {
        setFormEvent(event);
      },
      relays,
    );
  };

  useEffect(() => {
    if (!(pubKey && formId)) {
      return;
    }
    if (!formEvent) initialize(pubKey, formId, relays);
  }, []);

  const onSubmit = async (responses: Response[], formTemplate: Tag[]) => {
    sendNotification(formTemplate, responses);
    setFormSubmitted(true);
  };

  if ((!pubKey || !formId) && !isPreview) {
    return <Text>INVALID FORM URL</Text>;
  }
  if (!formEvent && !isPreview) {
    return (
      <div
        style={{
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
        <Text
          style={{
            textAlign: "center",
            display: "block",
          }}
        >
          <Spin
            indicator={
              <LoadingOutlined
                style={{ fontSize: 48, color: "#F7931A" }}
                spin
              />
            }
          />
        </Text>
      </div>
    );
  } else if (
    !isPreview &&
    formEvent?.content !== "" &&
    !userPubKey &&
    !viewKeyParams
  ) {
    return (
      <>
        <Text>
          This form is access controlled and requires login to continue
        </Text>
        <Button
          onClick={() => {
            requestPubkey();
          }}
        >
          Login
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
          viewKey={viewKeyParams}
          hideTitleImage={hideTitleImage}
          hideDescription={hideDescription}
        />
        <ThankYouScreen
          viewKey={viewKeyParams}
          formEvent={formEvent}
          isOpen={formSubmitted}
          onClose={() => navigate(ROUTES.DASHBOARD)}
        />
      </>
    );
  }
};
