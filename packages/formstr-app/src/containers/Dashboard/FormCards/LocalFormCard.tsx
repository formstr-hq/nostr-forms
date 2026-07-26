import {
  Box,
  Button,
  Card,
  CardActions,
  CardHeader,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useState } from "react";
import { ILocalForm } from "../../CreateFormNew/providers/FormBuilder/typeDefs";
import { useNavigate } from "react-router-dom";
import DeleteFormTrigger from "./DeleteForm";
import { makeFormNAddr, naddrUrl } from "../../../utils/utility";
import { editPath, responsePath } from "../../../utils/formUtils";
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
  let responseUrl = form.formId
    ? responsePath(
        form.privateKey,
        makeFormNAddr(
          form.publicKey,
          form.formId,
          form.relays && form.relays.length !== 0 ? form.relays : [form.relay],
        ),
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
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
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
                  );
                }}
              >
                <ListItemIcon>
                  <EditOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t("common.actions.edit")}</ListItemText>
              </MenuItem>
            </Menu>
            <DeleteFormTrigger
              formKey={form.key}
              onDeleted={onDeleted}
              formPubkey={form.publicKey}
              formId={form.formId}
              signingKey={form.privateKey}
              relays={
                form.relays && form.relays.length !== 0
                  ? form.relays
                  : form.relay
                    ? [form.relay]
                    : []
              }
            />
          </Box>
        }
        sx={{ "& .MuiCardHeader-content": { minWidth: 0 } }}
      />
      <CardActions sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
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
      </CardActions>
    </Card>
  );
};
