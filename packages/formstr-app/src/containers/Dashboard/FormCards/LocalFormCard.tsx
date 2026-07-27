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
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useState } from "react";
import { ILocalForm } from "../../CreateFormNew/providers/FormBuilder/typeDefs";
import { useNavigate } from "react-router-dom";
import DeleteFormTrigger from "./DeleteForm";
import { makeFormNAddr, naddrUrl } from "../../../utils/utility";
import { editPath, responsePath } from "../../../utils/formUtils";
import { FormDetails } from "../../CreateFormNew/components/FormDetails";
import SafeMarkdown from "../../../components/SafeMarkdown";
import { useTranslation } from "react-i18next";

interface LocalFormCardProps {
  form: ILocalForm;
  onDeleted: () => void;
}

export const LocalFormCard: React.FC<LocalFormCardProps> = ({
  form,
  onDeleted,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showFormDetails, setShowFormDetails] = useState(false);

  // The relays stored with the form, normalized to a non-empty list where
  // possible. Falls back to the single `relay` field for older records.
  const relays =
    form.relays && form.relays.length !== 0
      ? form.relays
      : form.relay
        ? [form.relay]
        : [];

  let responseUrl = form.formId
    ? responsePath(
        form.privateKey,
        makeFormNAddr(form.publicKey, form.formId, relays),
        form.viewKey,
      )
    : `/response/${form.privateKey}`;
  let formUrl =
    form.publicKey && form.formId
      ? naddrUrl(form.publicKey, form.formId, [form.relay], form.viewKey, true)
      : `/fill/${form.publicKey}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${formUrl}`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1200);
    } catch (e) {
      console.error("Failed to copy form link", e);
    }
  };

  type CardMenuItem = {
    key: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };

  const menuItems: CardMenuItem[] = [
    {
      key: "edit",
      label: t("common.actions.edit"),
      icon: <EditOutlinedIcon fontSize="small" />,
      onClick: () =>
        navigate(
          editPath(
            form.privateKey,
            makeFormNAddr(
              form.publicKey,
              form.formId,
              form.relays?.length ? form.relays : undefined,
            ),
            form.viewKey,
          ),
        ),
    },
    {
      key: "details",
      label: t("dashboardCards.details"),
      icon: <InfoOutlinedIcon fontSize="small" />,
      onClick: () => setShowFormDetails(true),
    },
  ];

  return (
    <Card variant="outlined" className="form-card">
      <CardHeader
        title={
          <SafeMarkdown components={{ p: "span" }}>{form.name}</SafeMarkdown>
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
            <DeleteFormTrigger
              formKey={form.key}
              onDeleted={onDeleted}
              formPubkey={form.publicKey}
              formId={form.formId}
              signingKey={form.privateKey}
              relays={relays}
            />
          </Box>
        }
        sx={{ "& .MuiCardHeader-content": { minWidth: 0 } }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            color: "text.secondary",
            fontSize: 13,
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography variant="body2" color="text.secondary">
            {t("dashboardCards.storedLocally")}
          </Typography>
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
          <Button size="small" onClick={() => navigate(responseUrl)}>
            {t("dashboardCards.viewResponses")}
          </Button>
          {/* Keep Open Form + copy glued together so the icon never orphans
              onto its own line when the row wraps on narrow screens. */}
          <Box sx={{ display: "inline-flex", alignItems: "center" }}>
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(formUrl);
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "text.disabled",
            whiteSpace: "nowrap",
          }}
        >
          <Box
            component="span"
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "text.disabled",
            }}
          />
          <Typography variant="body2" color="text.disabled">
            {t("dashboardCards.onDevice")}
          </Typography>
        </Box>
      </CardActions>
      {showFormDetails && (
        <FormDetails
          isOpen={showFormDetails}
          onClose={() => setShowFormDetails(false)}
          pubKey={form.publicKey}
          formId={form.formId}
          secretKey={form.privateKey}
          viewKey={form.viewKey}
          name={form.name}
          relays={relays}
        />
      )}
    </Card>
  );
};
