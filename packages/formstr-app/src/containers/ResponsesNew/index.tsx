import { useEffect, useState } from "react";
import { Event, getPublicKey, nip19 } from "nostr-tools";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchFormResponses } from "../../nostr/responses";
import SummaryStyle from "./summary.style";
import { Button, Card, Divider, Table, Tabs, Typography, Spin, message } from "antd";
import { FormAnalytics } from "./components/FormAnalytics";
import ResponseWrapper from "./Responses.style";
import { isMobile } from "../../utils/utility";
import { useProfileContext } from "../../hooks/useProfileContext";
import { fetchFormTemplate } from "../../nostr/fetchFormTemplate";
import { hexToBytes } from "@noble/hashes/utils";
import {
  fetchKeys,
  getAllowedUsers,
  getFormSpec as getFormSpecFromEventUtil,
  getformstrBranding,
} from "../../utils/formUtils";
import { Field, Tag, FileUploadMetadata } from "../../nostr/types";
import { ResponseDetailModal } from "./components/ResponseDetailModal";
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
import { ExportOutlined, DownloadOutlined } from "@ant-design/icons";
import { decodeNKeys } from "../../utils/nkeys";
import { downloadEncryptedFile } from "../../utils/fileDownload";
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
  const [selectedEventForModal, setSelectedEventForModal] =
    useState<Event | null>(null);
  const [selectedResponseInputsForModal, setSelectedResponseInputsForModal] =
    useState<Tag[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isFormSpecLoading, setIsFormSpecLoading] = useState(true);

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

  const handleRowClick = (record: any) => {
    const authorPubKey = record.key;
    if (!responses || !formSpec || formSpec.length === 0) {
      console.warn("Form spec not ready or no responses, cannot open modal.");
      return;
    }
    const authorEvents = responses.filter(
      (event) => event.pubkey === authorPubKey
    );
    if (authorEvents.length === 0) return;
    const latestEvent = authorEvents.sort(
      (a, b) => b.created_at - a.created_at
    )[0];

    const inputsForModal = getInputsFromResponseEvent(latestEvent, editKey);
    setSelectedResponseInputsForModal(inputsForModal);
    setSelectedEventForModal(latestEvent);
    setIsModalOpen(true);
  };

  const handleFileDownload = async (metadataJson: string) => {
    console.log("handleFileDownload called with:", { metadataJson, editKey });

    if (!editKey) {
      message.error(t("responses.fileDownloadUnavailable"));
      return;
    }

    try {
      const metadata: FileUploadMetadata = JSON.parse(metadataJson);
      console.log("Parsed metadata:", metadata);
      console.log("metadata.uploaderPubkey:", metadata.uploaderPubkey);

      if (!metadata.uploaderPubkey) {
        message.error(t("responses.fileUploadedOldVersion"));
        return;
      }

      console.log("Attempting download with uploaderPubkey:", metadata.uploaderPubkey);

      await downloadEncryptedFile({
        metadata,
        formEditKey: editKey,
        uploaderPubkey: metadata.uploaderPubkey, // Use pubkey from metadata, not response event
      });
    } catch (error: any) {
      console.error("handleFileDownload error:", error);
      message.error(
        t("responses.downloadFailed", {
          message: error.message || "Unknown error",
        }),
      );
    }
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

  const getColumns = () => {
    const columns: Array<{
      key: string;
      title: string | JSX.Element;
      dataIndex: string;
      fixed?: "left" | "right";
      width?: number;
      render?: (data: string, record: any) => JSX.Element;
    }> = [
      {
        key: "author",
        title: t("common.labels.author"),
        fixed: "left",
        dataIndex: "authorPubkey",
        width: isMobile() ? 120 : 150,
        render: (data: string) => (
          <a
            href={`https://njump.me/${data}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isMobile()
              ? `${data.substring(0, 10)}...${data.substring(data.length - 5)}`
              : data}
          </a>
        ),
      },
      {
        key: "responsesCount",
        title: t("responses.submissions"),
        dataIndex: "responsesCount",
        width: isMobile() ? 90 : 120,
      },
    ];
    const rightColumns: Array<{
      key: string;
      title: string | JSX.Element;
      dataIndex: string;
      fixed?: "left" | "right";
      width?: number;
      render?: (data: string, record: any) => JSX.Element;
    }> = [
      {
        key: "createdAt",
        title: t("common.labels.submittedAt"),
        dataIndex: "createdAt",
        width: isMobile() ? 100 : 130,
      },
      {
        key: "action",
        title: t("common.labels.action"),
        dataIndex: "action",
        fixed: "right",
        width: 40,
        render: (_: string, record: any) => (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(record);
            }}
          >
            <ExportOutlined />
          </div>
        ),
      },
    ];
    let uniqueQuestionIdsInResponses: Set<string> = new Set();
    responses?.forEach((response: Event) => {
      let responseTags = getInputsFromResponseEvent(response, editKey);
      responseTags.forEach((t: Tag) => {
        if (Array.isArray(t) && t.length > 1)
          uniqueQuestionIdsInResponses.add(t[1]);
      });
    });
    let fieldsFromSpec =
      formSpec?.filter((field) => field[0] === "field") || ([] as Field[]);

    fieldsFromSpec.forEach((field) => {
      let [_, fieldId, fieldType, label] = field;
      const column: {
        key: string;
        title: string | JSX.Element;
        dataIndex: string;
        width?: number;
        render?: (data: string, record: any) => JSX.Element;
      } = {
        key: fieldId,
        title: label ? (
          <SafeMarkdown components={{ p: "span" }}>{label as any}</SafeMarkdown>
        ) : (
          t("responses.questionFallback", {
            id: fieldId.substring(0, 5),
          })
        ),
        dataIndex: fieldId,
        width: 150,
      };

      // Add custom render for file upload fields
      if (fieldType === "file") {
        column.render = (data: string, record: any) => {
          if (!data) return <span>-</span>;
          try {
            const metadata: FileUploadMetadata = JSON.parse(data);
            const sizeInMB = (metadata.size / (1024 * 1024)).toFixed(2);
            return (
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <span>📎 {metadata.filename} ({sizeInMB} MB)</span>
                <Button
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => handleFileDownload(data)}
                />
              </div>
            );
          } catch (e) {
            return <span>{data}</span>;
          }
        };
      }

      columns.push(column);
      uniqueQuestionIdsInResponses.delete(fieldId);
    });
    const extraFieldIdsFromResponses = Array.from(uniqueQuestionIdsInResponses);
    extraFieldIdsFromResponses.forEach((fieldId) => {
      columns.push({
        key: fieldId,
        title: t("responses.questionIdFallback", {
          id: fieldId.substring(0, 8),
        }),
        dataIndex: fieldId,
        width: 150,
      });
    });
    if (
      formSpec === null &&
      responses &&
      extraFieldIdsFromResponses.length > 0 &&
      fieldsFromSpec.length === 0
    ) {
      extraFieldIdsFromResponses.forEach((id) => {
        if (!columns.find((col) => col.key === id)) {
          columns.push({
            key: id,
            title: t("responses.questionIdFallback", {
              id: id.substring(0, 8),
            }),
            dataIndex: id,
            width: 150,
          });
        }
      });
    }
    return [...columns, ...rightColumns];
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
      <ResponseWrapper>
        <div className={`responses-layout ${isChatVisible ? "chat-open" : ""}`}>
          <div className="responses-main-panel">
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
                      {responses === undefined
                        ? t("common.status.searching")
                        : getResponderCount()}{" "}
                    </Text>
                    <Text className="response-count-label">
                      {t("responses.responderLabel")}
                    </Text>
                  </div>
                </Card>
              </div>
            </SummaryStyle>
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
                  children: (
                    <div style={{ overflow: "scroll", marginBottom: 60 }}>
                      <Table
                        columns={getColumns()}
                        dataSource={getData()}
                        pagination={{ pageSize: 10 }}
                        loading={{
                          spinning: responses === undefined,
                          tip: t("responses.lookingForResponses"),
                        }}
                        scroll={{ x: isMobile() ? 900 : 1500, y: "calc(65% - 400px)" }}
                      />
                    </div>
                  ),
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
          </div>
          {isChatVisible && formSpec && (
            <div className="responses-chat-panel">
            <AIAnalysisChat
              isVisible={isChatVisible}
              onClose={() => setIsChatVisible(false)}
              responsesData={getData(true)}
              formSpec={formSpec}
            />
            </div>
          )}
        </div>
      </ResponseWrapper>
      {isModalOpen &&
        formSpec &&
        formSpec.length > 0 &&
        selectedResponseInputsForModal && (
          <ResponseDetailModal
            isVisible={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedEventForModal(null);
              setSelectedResponseInputsForModal(null);
            }}
            formSpec={formSpec}
            processedInputs={selectedResponseInputsForModal}
            responseMetadataEvent={selectedEventForModal}
            formstrBranding={getformstrBranding(formSpec)}
            editKey={editKey}
          />
        )}
    </div>
  );
};
