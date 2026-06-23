import { useEffect, useRef, useState } from "react";
import { Event, getPublicKey, nip19 } from "nostr-tools";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchFormResponses } from "../../nostr/responses";
import SummaryStyle from "./summary.style";
import { Button, Card, Divider, Tabs, Typography, Spin } from "antd";
import { FormAnalytics } from "./components/FormAnalytics";
import ResponseWrapper from "./Responses.style";
import { useProfileContext } from "../../hooks/useProfileContext";
import { fetchFormTemplate } from "../../nostr/fetchFormTemplate";
import { hexToBytes } from "@noble/hashes/utils";
import {
  fetchKeys,
  getAllowedUsers,
  getFormSpec as getFormSpecFromEventUtil,
  getformstrBranding,
} from "../../utils/formUtils";
import { Field, Tag } from "../../nostr/types";
import { ResponseNavigator } from "./components/ResponseNavigator";
import {
  getResponseRelays,
  getInputsFromResponseEvent,
  getResponseLabels,
} from "../../utils/ResponseUtils";
import AIAnalysisChat from "./components/AIAnalysisChat";
import { ResponseHeader } from "./components/ResponseHeader";
import { AddressPointer } from "nostr-tools/nip19";
import { SubCloser } from "nostr-tools/abstract-pool";
import SafeMarkdown from "../../components/SafeMarkdown";
import { decodeNKeys } from "../../utils/nkeys";
import { formatLocalizedDateTime } from "../../i18n/format";

const { Text } = Typography;

export const Response = () => {
  const { t } = useTranslation();
  const [responses, setResponses] = useState<Event[] | undefined>(undefined);
  const [formEvent, setFormEvent] = useState<Event | undefined>(undefined);
  const [formSpec, setFormSpec] = useState<Tag[] | null | undefined>(undefined);
  const [editKey, setEditKey] = useState<string | undefined | null>();
  let { naddr, formSecret, identifier, pubKey } = useParams();
  let formId: string | undefined = identifier;
  let pubkey: string | undefined = pubKey;
  let relays: string[] | undefined;
  if (!formSecret && !identifier && naddr) {
    let {
      identifier: dTag,
      pubkey: decodedPubkey,
      relays: decodedRelays,
    } = nip19.decode(naddr!).data as AddressPointer;
    formId = dTag;
    pubkey = decodedPubkey;
    relays = decodedRelays;
  }
  // Try decoding secretKey and viewKey from nkeys first
  let secretKey = formSecret || window.location.hash.replace(/^#/, "");
  let decodedNKeys;
  if (secretKey.startsWith("nkeys")) {
    decodedNKeys = decodeNKeys(secretKey);
    secretKey = decodedNKeys?.secretKey || "";
  }

  if (!pubkey && secretKey) pubkey = getPublicKey(hexToBytes(secretKey));

  let [searchParams] = useSearchParams();
  const { pubkey: userPubkey, requestPubkey } = useProfileContext();
  let viewKeyParams = searchParams.get("viewKey");
  if (!viewKeyParams) viewKeyParams = decodedNKeys?.viewKey || "";
  const [responseCloser, setResponsesCloser] = useState<SubCloser | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [isFormSpecLoading, setIsFormSpecLoading] = useState(true);

  useEffect(() => {
    if (isChatVisible && chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isChatVisible]);

  const handleResponseEvent = (event: Event) => {
    setResponses((prev: Event[] | undefined) => {
      if (prev?.some((e) => e.id === event.id)) {
        return prev;
      }
      return [...(prev || []), event];
    });
  };

  const initialize = async () => {
    if (!formId) return;
    if (!(pubkey || secretKey)) return;
    setIsFormSpecLoading(true);

    if (secretKey) {
      setEditKey(secretKey);
      pubkey = getPublicKey(hexToBytes(secretKey));
    }
    let relay: string | null = null;
    if (!relays?.length) relay = searchParams.get("relay");
    fetchFormTemplate(
      pubkey!,
      formId,
      async (event: Event) => {
        setFormEvent(event);
        if (!secretKey) {
          if (userPubkey) {
            let keys = await fetchKeys(event.pubkey, formId!, userPubkey);
            let fetchedEditKey =
              keys?.find((k) => k[0] === "EditAccess")?.[1] || null;
            setEditKey(fetchedEditKey);
          }
        }
        const spec = await getFormSpecFromEventUtil(
          event,
          userPubkey,
          null,
          viewKeyParams
        );
        setFormSpec(spec);
        setIsFormSpecLoading(false);
      },
      relays?.length ? relays : relay ? [relay] : undefined
    );
  };

  useEffect(() => {
    if (!(pubkey || secretKey) || !formId) {
      if (responseCloser) {
        responseCloser.close();
        setResponsesCloser(null);
      }
      setResponses(undefined);
      setFormEvent(undefined);
      setIsFormSpecLoading(true);
      return;
    }
    initialize();
    return () => {
      if (responseCloser) {
        responseCloser.close();
        setResponsesCloser(null);
      }
    };
  }, [pubkey, formId, secretKey, userPubkey, viewKeyParams]);
  useEffect(() => {
    if (!formEvent || !formId) {
      return;
    }
    let allowedPubkeys;
    let pubkeys = getAllowedUsers(formEvent);
    if (pubkeys.length !== 0) allowedPubkeys = pubkeys;
    let formRelays = getResponseRelays(formEvent);
    const newCloser = fetchFormResponses(
      formEvent.pubkey,
      formId,
      handleResponseEvent,
      allowedPubkeys,
      formRelays
    );
    setResponsesCloser(newCloser);

    return () => {
      newCloser.close();
    };
  }, [formEvent, formId]);

  const getResponderCount = () => {
    if (!responses) return 0;
    return new Set(responses.map((r) => r.pubkey)).size;
  };

  const getData = (useLabels: boolean = false) => {
    let answers: Array<{
      [key: string]: string;
    }> = [];
    if (!formSpec || !responses) return answers;
    let responsePerPubkey = new Map<string, Event[]>();
    responses.forEach((r: Event) => {
      let existingResponse = responsePerPubkey.get(r.pubkey);
      if (!existingResponse) responsePerPubkey.set(r.pubkey, [r]);
      else responsePerPubkey.set(r.pubkey, [...existingResponse, r]);
    });

    Array.from(responsePerPubkey.keys()).forEach((pub) => {
      let pubkeyResponses = responsePerPubkey.get(pub);
      if (!pubkeyResponses || pubkeyResponses.length === 0) return;
      let responseEvent = pubkeyResponses.sort(
        (a, b) => b.created_at - a.created_at
      )[0];
      let inputs = getInputsFromResponseEvent(responseEvent, editKey) as Tag[];
      if (inputs.length === 0 && responseEvent.content !== "" && !editKey) {
      }

      let answerObject: {
        [key: string]: string;
      } = {
        key: responseEvent.pubkey,
        createdAt: formatLocalizedDateTime(responseEvent.created_at * 1000),
        authorPubkey: nip19.npubEncode(responseEvent.pubkey),
        responsesCount: pubkeyResponses.length.toString(),
      };
      inputs.forEach((input) => {
        if (!Array.isArray(input) || input.length < 2) return;
        const { questionLabel, responseLabel, fieldId } = getResponseLabels(
          input,
          formSpec
        );
        const displayKey = useLabels ? questionLabel : fieldId;

        // For file fields, store raw value (JSON metadata) instead of formatted label
        // The table's custom render will format it and add download button
        const questionField = formSpec.find(
          (tag): tag is Field => tag[0] === "field" && tag[1] === fieldId
        );
        const isFileField = questionField && questionField[2] === "file";

        answerObject[displayKey] = isFileField ? input[2] : responseLabel;
      });
      answers.push(answerObject);
    });
    return answers;
  };

  const getFormName = () => {
    if (!formSpec) return t("responses.formNameLoading");
    let nameTag = formSpec.find((tag) => tag[0] === "name");
    if (nameTag) return nameTag[1] || t("common.status.untitledForm");
    return t("common.status.untitledForm");
  };

  if (!(pubkey || secretKey) || !formId)
    return <Text>{t("responses.invalidUrl")}</Text>;

  if (
    formEvent &&
    formEvent.content !== "" &&
    !userPubkey &&
    !viewKeyParams &&
    !editKey
  ) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <Text>
          {t("responses.privateNotice")}
        </Text>
        <Button
          onClick={() => {
            requestPubkey();
          }}
          style={{ marginTop: "10px" }}
        >
          {t("common.actions.login")}
        </Button>
      </div>
    );
  }
  if (isFormSpecLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <Spin size="large" tip="Loading form details..." />
        <Spin size="large" tip={t("responses.loadingDetails")} />
      </div>
    );
  }
  if (formSpec === null && formEvent && formEvent.content !== "") {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <Text>
          {t("responses.decryptFailed")}
        </Text>
      </div>
    );
  }

  const hasResponses = responses && responses.length > 0;

  return (
    <div>
      <SummaryStyle>
        <div className="summary-container">
          <Card>
            <Text className="heading">
              <SafeMarkdown components={{ p: "span" }}>
                {getFormName()}
              </SafeMarkdown>
            </Text>
            <Divider />
            <div className="response-count-container">
              <Text className="response-count">
                {responses === undefined ? t("common.status.searching") : getResponderCount()}{" "}
              </Text>
              <Text className="response-count-label">
                {t("responses.responderLabel")}
              </Text>
            </div>
          </Card>
        </div>
      </SummaryStyle>
      <ResponseWrapper>
        <ResponseHeader
          hasResponses={!!hasResponses}
          onAiAnalysisClick={() => setIsChatVisible(true)}
          responsesData={getData(true) || []}
          formName={getFormName()}
        />
        <Tabs
          defaultActiveKey="responses"
          style={{ padding: "0 16px" }}
          items={[
            {
              key: "responses",
              label: t("responses.responsesTab"),
              children:
                responses === undefined ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "48px 0",
                    }}
                  >
                    <Spin tip={t("responses.lookingForResponses")} />
                  </div>
                ) : formSpec ? (
                  <ResponseNavigator
                    formSpec={formSpec}
                    responses={responses}
                    editKey={editKey}
                    formstrBranding={getformstrBranding(formSpec)}
                  />
                ) : null,
            },
            {
              key: "analytics",
              label: t("responses.analyticsTab"),
              children: formSpec ? (
                <FormAnalytics
                  responsesData={getData(true)}
                  formSpec={formSpec}
                />
              ) : null,
            },
          ]}
        />
        <div ref={chatRef}>
          {isChatVisible && formSpec && (
            <AIAnalysisChat
              isVisible={isChatVisible}
              onClose={() => setIsChatVisible(false)}
              responsesData={getData(true)}
              formSpec={formSpec}
            />
          )}
        </div>
      </ResponseWrapper>
    </div>
  );
};
