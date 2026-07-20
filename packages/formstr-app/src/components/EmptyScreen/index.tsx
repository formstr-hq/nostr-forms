import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import { ReactComponent as NoData } from "../../Images/no-forms.svg";
import { ROUTES } from "../../constants/routes";
import { FormTemplate } from "../../templates";
import TemplateCard from "../TemplateCard";

interface EmptyScreenProps {
  message?: string;
  action?: () => void;
  actionLabel?: string;
  templates?: FormTemplate[];
  onTemplateClick?: (template: FormTemplate) => void;
}

function EmptyScreen({
  message,
  action,
  actionLabel,
  templates,
  onTemplateClick,
}: EmptyScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const showTemplates = templates && templates.length > 0 && onTemplateClick;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 208px)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {showTemplates ? (
        <>
          <Typography variant="h4" sx={{ mb: 2.5, textAlign: "center" }}>
            {t("builder.templateEmptyTitle")}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              maxHeight: "calc(100vh - 300px)",
              overflowY: "auto",
            }}
          >
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={onTemplateClick}
              />
            ))}
          </Box>
        </>
      ) : (
        <>
          <Box
            component={NoData}
            sx={{ height: "40%", minHeight: 160, maxWidth: "100%" }}
          />
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ textAlign: "center", my: 2 }}
          >
            {message || t("builder.emptyState.createFirstForm")}
          </Typography>
          <Button
            variant="contained"
            startIcon={action ? undefined : <AddIcon />}
            onClick={() => {
              if (action) action();
              else {
                navigate(ROUTES.CREATE_FORMS_NEW);
              }
            }}
            sx={{ alignSelf: "center", minWidth: 160, my: 1 }}
          >
            {actionLabel || t("builder.emptyState.createForm")}
          </Button>
        </>
      )}
    </Box>
  );
}

export default EmptyScreen;
