import { useEffect, useRef, useState } from "react";
import { Event, getPublicKey, nip19 } from "nostr-tools";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchFormResponses } from "../../nostr/responses";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Link,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { FormAnalytics } from "./components/FormAnalytics";
import { isMobile } from "../../utils/utility";
import { useProfileContext } from "../../hooks/useProfileContext";
import { subscribeFormTemplate } from "../../nostr/fetchFormTemplate";
import { hexToBytes } from "@noble/hashes/utils.js";
import {
  fetchKeys,
  getAllowedUsers,
  getFormSpec as getFormSpecFromEventUtil,
  getformstrBranding,
} from "../../utils/formUtils";
import { Field, Tag, FileUploadMetadata } from "../../nostr/types";
import { ResponseDetailModal } from "./components/ResponseDetailModal";
import { ResponseNavigator } from "./components/ResponseNavigator";
import {
  getResponseRelays,
  getInputsFromResponseEvent,
  getResponseLabels,
} from "../../utils/ResponseUtils";
import AIAnalysisChat from "./components/AIAnalysisChat";
import { ResponseHeader } from "./components/ResponseHeader";
import { AddressPointer } from "nostr-tools/nip19";
import SafeMarkdown from "../../components/SafeMarkdown";
import { decodeNKeys } from "../../utils/nkeys";
import { downloadEncryptedFile } from "../../utils/fileDownload";
import { formatLocalizedDateTime } from "../../i18n/format";
import { useSnackbar } from "../../providers/SnackbarProvider";

interface ResponseColumn {
  key: string;
  title: React.ReactNode;
  width?: number;
  render?: (data: string, record: any) => React.ReactNode;
}

/**
 * MUI responses surface (ui-rewrite-mui Phase 4). Summary card + tabs
 * (responses table / analytics); chart internals are unchanged recharts.
 */
export const Response = () => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const [responses, setResponses] = useState<Event[] | undefined>(undefined);
  const [formEvent, setFormEvent] = useState<Event | undefined>(undefined);
  const [formSpec, setFormSpec] = useState<Tag[] | null | undefined>(undefined);
  const [editKey, setEditKey] = useState<string | undefined | null>();
  const [activeTab, setActiveTab] = useState<"responses" | "analytics">(
    "responses",
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
  const [selectedEventForModal, setSelectedEventForModal] =
    useState<Event | null>(null);
  const [selectedResponseInputsForModal, setSelectedResponseInputsForModal] =
    useState<Tag[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // STABLE template subscription — the key reliability fix. A one-shot
  // observe-then-unobserve races the local-relay worker's async fanout and can
  // miss the template (the old SimplePool delivered synchronously and hid it);
  // keeping the subscription alive for the component's lifetime does not. Keyed
  // on the form's stable identity (pubkey/id/secret + relay hint) ONLY — NOT on
  // `userPubkey`, whose async resolution would otherwise churn this down and
  // rebuild it, reintroducing the very race. The userPubkey-dependent formSpec
  // decode lives in its own effect below, driven off the delivered formEvent.
  const relayParam = searchParams.get("relay");
  const templateRelays = relays?.length
    ? relays
    : relayParam
      ? [relayParam]
      : undefined;
  useEffect(() => {
    if (!formId || !pubkey) {
      setResponses(undefined);
      setFormEvent(undefined);
      setIsFormSpecLoading(true);
      return;
    }
    setIsFormSpecLoading(true);
    if (secretKey) setEditKey(secretKey);
    const sub = subscribeFormTemplate(
      pubkey,
      formId,
      (event: Event) => setFormEvent(event),
      templateRelays,
    );
    return () => sub.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubkey, formId, secretKey, templateRelays?.join(",")]);

  // Decode the delivered template into a form spec. Separated from the template
  // subscription because it depends on `userPubkey` (edit-key lookup + private
  // form decryption): re-running it as the user resolves must not disturb the
  // live template/response subscriptions.
  useEffect(() => {
    if (!formEvent || !formId) return;
    let cancelled = false;
    (async () => {
      if (!secretKey && userPubkey) {
        const keys = await fetchKeys(formEvent.pubkey, formId, userPubkey);
        const fetchedEditKey =
          keys?.find((k) => k[0] === "EditAccess")?.[1] || null;
        if (!cancelled) setEditKey(fetchedEditKey);
      }
      const spec = await getFormSpecFromEventUtil(
        formEvent,
        userPubkey,
        null,
        viewKeyParams,
      );
      if (cancelled) return;
      setFormSpec(spec);
      setIsFormSpecLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formEvent, userPubkey, viewKeyParams, secretKey, formId]);

  // Keyed on the form's STABLE identity (author pubkey + id), NOT the formEvent
  // object: the template is re-fetched whenever the effect above re-runs (e.g.
  // `userPubkey` resolving), producing a fresh formEvent object each time. Keying
  // on the object would tear down and rebuild the responses subscription on every
  // such re-fetch of the SAME form — and the DataLayer worker's async delivery
  // can drop an in-flight response during that churn. The form's pubkey/id don't
  // change, so the subscription stays alive across template re-fetches.
  const formPubkey = formEvent?.pubkey;
  useEffect(() => {
    if (!formEvent || !formPubkey || !formId) {
      return;
    }
    let allowedPubkeys;
    let pubkeys = getAllowedUsers(formEvent);
    if (pubkeys.length !== 0) allowedPubkeys = pubkeys;
    let formRelays = getResponseRelays(formEvent);
    const newCloser = fetchFormResponses(
      formPubkey,
      formId,
      handleResponseEvent,
      allowedPubkeys,
      formRelays,
    );

    return () => {
      newCloser.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formPubkey, formId]);

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
      (event) => event.pubkey === authorPubKey,
    );
    if (authorEvents.length === 0) return;
    const latestEvent = authorEvents.sort(
      (a, b) => b.created_at - a.created_at,
    )[0];

    const inputsForModal = getInputsFromResponseEvent(latestEvent, editKey);
    setSelectedResponseInputsForModal(inputsForModal);
    setSelectedEventForModal(latestEvent);
    setIsModalOpen(true);
  };

  const handleFileDownload = async (metadataJson: string) => {
    if (!editKey) {
      showMessage(t("responses.fileDownloadUnavailable"), "error");
      return;
    }

    try {
      const metadata: FileUploadMetadata = JSON.parse(metadataJson);

      if (!metadata.uploaderPubkey) {
        showMessage(t("responses.fileUploadedOldVersion"), "error");
        return;
      }

      await downloadEncryptedFile({
        metadata,
        formEditKey: editKey,
        uploaderPubkey: metadata.uploaderPubkey, // Use pubkey from metadata, not response event
      });
    } catch (error: any) {
      console.error("handleFileDownload error:", error);
      showMessage(
        t("responses.downloadFailed", {
          message: error.message || "Unknown error",
        }),
        "error",
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
        (a, b) => b.created_at - a.created_at,
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
          formSpec,
        );
        const displayKey = useLabels ? questionLabel : fieldId;

        // For file fields, store raw value (JSON metadata) instead of formatted label
        // The table's custom render will format it and add download button
        const questionField = formSpec.find(
          (tag): tag is Field => tag[0] === "field" && tag[1] === fieldId,
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

  const getColumns = (): ResponseColumn[] => {
    const columns: ResponseColumn[] = [
      {
        key: "author",
        title: t("common.labels.author"),
        width: isMobile() ? 120 : 150,
        render: (data: string) => (
          <Link
            href={`https://njump.me/${data}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {isMobile()
              ? `${data.substring(0, 10)}...${data.substring(data.length - 5)}`
              : data}
          </Link>
        ),
      },
      {
        key: "responsesCount",
        title: t("responses.submissions"),
        width: isMobile() ? 90 : 120,
      },
    ];
    const rightColumns: ResponseColumn[] = [
      {
        key: "createdAt",
        title: t("common.labels.submittedAt"),
        width: isMobile() ? 100 : 130,
      },
      {
        key: "action",
        title: t("common.labels.action"),
        width: 40,
        render: (_: string, record: any) => (
          <IconButton
            size="small"
            aria-label={t("common.labels.action")}
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(record);
            }}
          >
            <OpenInNewOutlinedIcon fontSize="small" />
          </IconButton>
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
      const column: ResponseColumn = {
        key: fieldId,
        title: label ? (
          <SafeMarkdown components={{ p: "span" }}>{label as any}</SafeMarkdown>
        ) : (
          t("responses.questionFallback", {
            id: fieldId.substring(0, 5),
          })
        ),
        width: 150,
      };

      // Add custom render for rating fields
      if (fieldType === "rating") {
        const answerSettings = JSON.parse(field[5] || '{"maxStars": 5}');
        const currentMaxStars = Math.min(answerSettings.maxStars || 5, 10);

        const normalizeStoredRating = (value: string): number => {
          if (!value) return 0;

          const parseStars = (storedValue: number): number => {
            if (!Number.isFinite(storedValue)) return 0;
            if (storedValue >= 0 && storedValue <= 1) {
              return storedValue * currentMaxStars;
            }
            return storedValue;
          };

          try {
            const parsed = JSON.parse(value);
            if (typeof parsed === "object" && parsed !== null) {
              if (typeof parsed.normalizedValue === "number") {
                return parseStars(
                  Math.max(0, Math.min(parsed.normalizedValue, 1)),
                );
              }
              if (typeof parsed.value === "number") {
                if (
                  typeof parsed.maxStars === "number" &&
                  parsed.maxStars > 0
                ) {
                  return parseStars(
                    (parsed.value / parsed.maxStars) * currentMaxStars,
                  );
                }
                return parseStars(parsed.value);
              }
            }
          } catch (e) {
            // Fall through to numeric fallback.
          }

          const numeric = parseFloat(value);
          return parseStars(numeric);
        };

        column.render = (data: string) => {
          if (!data) return <span>-</span>;

          const displayValue = normalizeStoredRating(data);

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {Array.from({ length: currentMaxStars }, (_, i) => {
                  const n = i + 1;
                  const fillPercent =
                    Math.max(0, Math.min(1, displayValue - (n - 1))) * 100;
                  const gradientId = `response-star-${fieldId}-${n}`;

                  return (
                    <svg key={n} width={20} height={20} viewBox="0 0 28 28">
                      <defs>
                        <linearGradient
                          id={gradientId}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop
                            offset={`${fillPercent}%`}
                            stopColor="#EF9F27"
                          />
                          <stop
                            offset={`${fillPercent}%`}
                            stopColor="transparent"
                          />
                        </linearGradient>
                      </defs>
                      <polygon
                        points="14,3 17.5,10.5 26,11.5 20,17.5 21.5,26 14,22 6.5,26 8,17.5 2,11.5 10.5,10.5"
                        fill={fillPercent > 0 ? `url(#${gradientId})` : "none"}
                        stroke={n <= displayValue ? "#EF9F27" : "#B4B2A9"}
                        strokeWidth={1.5}
                        strokeLinejoin="round"
                      />
                    </svg>
                  );
                })}
              </div>
              <span style={{ fontSize: 12, color: "#666" }}>
                {displayValue.toFixed(2)} / {currentMaxStars}
              </span>
            </div>
          );
        };
      }

      // Add custom render for file upload fields
      if (fieldType === "file") {
        column.render = (data: string, record: any) => {
          if (!data) return <span>-</span>;
          try {
            const metadata: FileUploadMetadata = JSON.parse(data);
            const sizeInMB = (metadata.size / (1024 * 1024)).toFixed(2);
            return (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
                onClick={(e) => e.stopPropagation()}
              >
                <span>
                  📎 {metadata.filename} ({sizeInMB} MB)
                </span>
                <IconButton
                  size="small"
                  aria-label={t("common.actions.download")}
                  onClick={() => handleFileDownload(data)}
                >
                  <DownloadOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
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
            width: 150,
          });
        }
      });
    }
    return [...columns, ...rightColumns];
  };
  if (!(pubkey || secretKey) || !formId)
    return <Typography>{t("responses.invalidUrl")}</Typography>;

  if (
    formEvent &&
    formEvent.content !== "" &&
    !userPubkey &&
    !viewKeyParams &&
    !editKey
  ) {
    return (
      <Box sx={{ textAlign: "center", mt: 2.5 }}>
        <Typography>{t("responses.privateNotice")}</Typography>
        <Button
          variant="contained"
          onClick={() => {
            requestPubkey();
          }}
          sx={{ mt: 1.5 }}
        >
          {t("common.actions.login")}
        </Button>
      </Box>
    );
  }
  if (isFormSpecLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">
          {t("responses.loadingDetails")}
        </Typography>
      </Box>
    );
  }
  if (formSpec === null && formEvent && formEvent.content !== "") {
    return (
      <Box sx={{ textAlign: "center", mt: 2.5 }}>
        <Typography>{t("responses.decryptFailed")}</Typography>
      </Box>
    );
  }

  const hasResponses = responses && responses.length > 0;

  const renderResponsesTab = () => {
    // Mobile: swipeable, filled-form navigator. Desktop: data table.
    if (isMobile()) {
      if (responses === undefined) {
        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              py: 6,
            }}
          >
            <CircularProgress size={28} />
            <Typography color="text.secondary">
              {t("responses.lookingForResponses")}
            </Typography>
          </Box>
        );
      }
      return formSpec ? (
        <ResponseNavigator
          formSpec={formSpec}
          responses={responses}
          editKey={editKey}
          formstrBranding={getformstrBranding(formSpec)}
        />
      ) : null;
    }

    const columns = getColumns();
    const rows = getData();
    const pagedRows = rows.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );

    return (
      <Box sx={{ mb: 7 }}>
        <TableContainer
          sx={{
            maxHeight: "calc(65vh)",
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
          }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={col.width ? { minWidth: col.width } : undefined}
                  >
                    {col.title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {responses === undefined ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                        py: 6,
                      }}
                    >
                      <CircularProgress size={28} />
                      <Typography color="text.secondary">
                        {t("responses.lookingForResponses")}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((record) => (
                  <TableRow
                    key={record.key}
                    hover
                    onClick={() => handleRowClick(record)}
                    sx={{ cursor: "pointer" }}
                  >
                    {columns.map((col) => {
                      const cellData =
                        record[col.key === "action" ? "key" : col.key];
                      return (
                        <TableCell
                          key={col.key}
                          sx={{
                            maxWidth: col.width ? col.width * 2 : undefined,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            // Limit media sizes in table cells to prevent overflow
                            "& img, & audio, & video": {
                              maxWidth: "100%",
                              maxHeight: 200,
                              objectFit: "contain",
                            },
                          }}
                        >
                          {col.render
                            ? col.render(cellData, record)
                            : cellData ?? ""}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
        <Card variant="outlined" sx={{ width: { xs: "100%", sm: "60%" } }}>
          <CardContent>
            <Typography variant="h5" component="div">
              <SafeMarkdown components={{ p: "span" }}>
                {getFormName()}
              </SafeMarkdown>
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="h5" component="div">
                {responses === undefined
                  ? t("common.status.searching")
                  : getResponderCount()}{" "}
              </Typography>
              <Typography variant="body2">
                {t("responses.responderLabel")}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Box>
        <ResponseHeader
          hasResponses={!!hasResponses}
          onAiAnalysisClick={() => setIsChatVisible(true)}
          responsesData={getData(true) || []}
          formName={getFormName()}
        />
        <Tabs
          value={activeTab}
          onChange={(_e, value: "responses" | "analytics") =>
            setActiveTab(value)
          }
          sx={{ px: 2 }}
        >
          <Tab value="responses" label={t("responses.responsesTab")} />
          <Tab value="analytics" label={t("responses.analyticsTab")} />
        </Tabs>
        <Box role="tabpanel" hidden={activeTab !== "responses"}>
          {activeTab === "responses" && renderResponsesTab()}
        </Box>
        <Box role="tabpanel" hidden={activeTab !== "analytics"}>
          {activeTab === "analytics" && formSpec ? (
            <FormAnalytics responsesData={getData(true)} formSpec={formSpec} />
          ) : null}
        </Box>
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
      </Box>
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
    </Box>
  );
};
