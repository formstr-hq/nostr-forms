import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Event } from "nostr-tools";
import { useNavigate } from "react-router-dom";
import DeleteFormTrigger from "./DeleteForm";
import {
  downloadHTMLToDevice,
  makeFormNAddr,
  naddrUrl,
  makeTag,
} from "../../../utils/utility";
import {
  editPath,
  getDecryptedForm,
  getFormData,
  responsePath,
} from "../../../utils/formUtils";
import { useEffect, useState } from "react";
import { constructDraftUrl } from "./Drafts";
import { FormDetails } from "../../CreateFormNew/components/FormDetails";
import SafeMarkdown from "../../../components/SafeMarkdown";
import { IFormSettings } from "../../CreateFormNew/components/FormSettings/types";
import { Tag } from "../../../nostr/types";
import { useTranslation } from "react-i18next";
import { useRelayCoverage } from "../../../hooks/useRelayCoverage";
import { BroadcastModal } from "../../../components/BroadcastModal";

interface FormEventCardProps {
  event: Event;
  onDeleted?: () => void;
  relay?: string;
  secretKey?: string;
  viewKey?: string | null;
  shortLink?: string;
}
export const FormEventCard: React.FC<FormEventCardProps> = ({
  event,
  onDeleted,
  relay,
  secretKey,
  viewKey,
  shortLink,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const publicForm = event.content === "";
  const [tags, setTags] = useState<Tag[]>([]);
  const [showFormDetails, setShowFormDetails] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  useEffect(() => {
    const initialize = async () => {
      if (event.content === "") {
        setTags(event.tags);
        return;
      } else if (viewKey) {
        setTags(getDecryptedForm(event, viewKey));
      }
    };
    initialize();
  }, []);
  const name =
    tags.find((tag: Tag) => tag[0] === "name") ||
    event.tags.find((tag: Tag) => tag[0] === "name") ||
    [];
  const pubKey = event.pubkey;
  const formId = event.tags.find((tag: Tag) => tag[0] === "d")?.[1];
  const relays = event.tags
    .filter((tag: Tag) => tag[0] === "relay")
    .map((t) => t[1]);
  const coverage = useRelayCoverage(pubKey, formId || "", relays);
  if (!formId) {
    return (
      <Card variant="outlined">
        <CardHeader title={t("dashboardCards.invalidFormEvent")} />
        <CardContent>{JSON.stringify(event)}</CardContent>
      </Card>
    );
  }
  const formKey = `${pubKey}:${formId}`;
  let settings: IFormSettings = {};
  if (publicForm || viewKey) {
    settings = JSON.parse(
      tags.filter((t) => t[0] === "settings")?.[0]?.[1] || "{}",
    );
  }

  const downloadForm = async () => {
    const naddr = makeFormNAddr(
      pubKey,
      formId,
      relays.length ? relays : ["wss://relay.damus.io"],
    );
    const formData = JSON.stringify(await getFormData(naddr));
    const formFillerUI = (await (await fetch("/api/form-filler-ui")).text())
      ?.replace("@naddr", naddr)
      .replace("@viewKey", viewKey || "")
      .replace("@formContent", btoa(formData));
    downloadHTMLToDevice(formFillerUI, name[1]);
  };

  const saveAndOpen = (duplicatedTags: Tag[], newFormId: string) => {
    const duplicatedForm = {
      formSpec: duplicatedTags,
      tempId: newFormId,
    };

    const existingDrafts = localStorage.getItem("formstr:draftForms");
    let updatedDrafts = existingDrafts ? JSON.parse(existingDrafts) : [];
    updatedDrafts = [duplicatedForm, ...updatedDrafts];
    localStorage.setItem("formstr:draftForms", JSON.stringify(updatedDrafts));
    window.open(
      constructDraftUrl(duplicatedForm, window.location.origin),
      "_blank",
    );
  };

  // The live form link — shared by the "Open Form" button (navigates) and the
  // "Copy form link" button (copies the absolute URL to the clipboard).
  const formLinkPath =
    shortLink ||
    naddrUrl(
      pubKey,
      formId,
      relays.length ? relays : ["wss://relay.damus.io"],
      viewKey,
    );
  const fullFormUrl = `${window.location.origin}${formLinkPath}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullFormUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1200);
    } catch (e) {
      console.error("Failed to copy form link", e);
    }
  };

  const handleDuplicate = () => {
    const newFormId = makeTag(6);
    const duplicatedTags = tags.map((tag) => {
      if (tag[0] === "d") return ["d", newFormId];
      if (tag[0] === "settings") {
        try {
          const settings = JSON.parse(tag[1]);
          return [
            "settings",
            JSON.stringify({ ...settings, formId: newFormId }),
          ];
        } catch {
          return tag;
        }
      }
      return [...tag];
    });
    saveAndOpen(duplicatedTags, newFormId);
  };

  type CardMenuItem = {
    key: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };

  const broadcastMenuItem: CardMenuItem = {
    key: "broadcast",
    label:
      coverage.loading && coverage.foundCount === 0
        ? t("broadcast.checking")
        : t("broadcast.foundOnRelays", {
            found: coverage.foundCount,
            total: coverage.total,
          }),
    icon: <CloudOutlinedIcon fontSize="small" />,
    onClick: () => setShowBroadcast(true),
  };
  const menuItems: CardMenuItem[] = secretKey
    ? [
        {
          key: "download",
          label: t("common.actions.download"),
          icon: <DownloadOutlinedIcon fontSize="small" />,
          onClick: downloadForm,
        },
        {
          key: "edit",
          label: t("common.actions.edit"),
          icon: <EditOutlinedIcon fontSize="small" />,
          onClick: () =>
            navigate(
              editPath(
                secretKey,
                makeFormNAddr(
                  pubKey,
                  formId,
                  relays.length !== 0 ? relays : undefined,
                ),
                viewKey,
                settings.disablePreview,
              ),
            ),
        },
        {
          key: "duplicate",
          label: t("common.actions.duplicate"),
          icon: <ContentCopyOutlinedIcon fontSize="small" />,
          onClick: handleDuplicate,
        },
        {
          key: "details",
          label: t("dashboardCards.details"),
          icon: <InfoOutlinedIcon fontSize="small" />,
          onClick: () => setShowFormDetails(true),
        },
        broadcastMenuItem,
      ]
    : [
        {
          key: "download",
          label: t("common.actions.download"),
          icon: <DownloadOutlinedIcon fontSize="small" />,
          onClick: downloadForm,
        },
        {
          key: "details",
          label: t("dashboardCards.details"),
          icon: <InfoOutlinedIcon fontSize="small" />,
          onClick: () => setShowFormDetails(true),
        },
        broadcastMenuItem,
      ];

  return (
    <Card variant="outlined" className="form-card">
      <CardHeader
        title={
          <SafeMarkdown forceColor="#0000">
            {name[1] || t("dashboardCards.hiddenForm")}
          </SafeMarkdown>
        }
        action={
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              aria-label={t("dashboardCards.quickActions")}
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              size="small"
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              {menuItems.map((item) => (
                <MenuItem
                  key={item.key}
                  onClick={() => {
                    setMenuAnchor(null);
                    item.onClick();
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText>{item.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
            {onDeleted ? (
              <DeleteFormTrigger
                formKey={formKey}
                onDeleted={onDeleted}
                formPubkey={pubKey}
                formId={formId}
                signingKey={secretKey}
                relays={relays}
              />
            ) : null}
          </Box>
        }
        sx={{ "& .MuiCardHeader-content": { minWidth: 0 } }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Box
          sx={{
            maxHeight: 100,
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "text.secondary",
            fontSize: 13,
          }}
        >
          <SafeMarkdown forceColor="#0000">
            {settings.description
              ? settings.description?.trim().substring(0, 200) + "..."
              : t("dashboardCards.encryptedContent")}
          </SafeMarkdown>
        </Box>
      </CardContent>
      <Divider />
      <CardActions
        sx={{
          justifyContent: "space-between",
          flexWrap: "wrap",
          rowGap: 0.5,
          px: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            rowGap: 0.5,
          }}
        >
          <Button
            size="small"
            onClick={() => {
              secretKey
                ? navigate(
                    responsePath(
                      secretKey,
                      makeFormNAddr(pubKey, formId, relays),
                      viewKey,
                    ),
                  )
                : navigate(`/r/${pubKey}/${formId}`);
            }}
          >
            {t("dashboardCards.viewResponses")}
          </Button>
          {/* Keep Open Form + copy glued together so the icon never orphans
              onto its own line when the row wraps on narrow screens. */}
          <Box sx={{ display: "inline-flex", alignItems: "center" }}>
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(formLinkPath);
              }}
            >
              {t("dashboardCards.openForm")}
            </Button>
            <Tooltip
              title={
                linkCopied
                  ? t("dashboardCards.linkCopied")
                  : t("dashboardCards.copyLink")
              }
            >
              <IconButton
                aria-label={t("dashboardCards.copyLink")}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink();
                }}
              >
                {linkCopied ? (
                  <CheckOutlinedIcon fontSize="small" color="success" />
                ) : (
                  <LinkOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Typography
          variant="body2"
          color="text.disabled"
          sx={{ whiteSpace: "nowrap" }}
        >
          {new Date(event.created_at * 1000).toDateString()}
        </Typography>
      </CardActions>
      {showFormDetails && (
        <FormDetails
          isOpen={showFormDetails}
          onClose={() => setShowFormDetails(false)}
          pubKey={pubKey}
          formId={formId}
          secretKey={secretKey || ""}
          viewKey={event.content !== "" ? viewKey || "" : undefined}
          name={name[1] || ""}
          relays={relays}
          disablePreview={settings.disablePreview}
        />
      )}
      {showBroadcast && (
        <BroadcastModal
          isOpen={showBroadcast}
          onClose={() => setShowBroadcast(false)}
          event={event}
          coverage={coverage}
        />
      )}
    </Card>
  );
};
