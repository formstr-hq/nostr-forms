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
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
            <DeleteFormTrigger formKey={form.key} onDeleted={onDeleted} />
          </Box>
        }
        sx={{ "& .MuiCardHeader-content": { minWidth: 0 } }}
      />
      <CardActions>
        <Button size="small" onClick={() => navigate(responseUrl)}>
          {t("dashboardCards.viewResponses")}
        </Button>
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            navigate(formUrl);
          }}
        >
          {t("dashboardCards.openForm")}
        </Button>
      </CardActions>
    </Card>
  );
};
