import React from "react";
import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormTemplate, getAvailableTemplates } from "../../templates";
import TemplateCard from "../TemplateCard";

interface TemplateSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onTemplateSelect: (template: FormTemplate) => void;
}

const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  visible,
  onClose,
  onTemplateSelect,
}) => {
  const { t } = useTranslation();
  const availableTemplates = getAvailableTemplates(t);

  const handleCardClick = (template: FormTemplate) => {
    onTemplateSelect(template);
    onClose();
  };

  return (
    <Dialog open={visible} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}>
        {t("templates.chooseTemplate")}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            py: 2.5,
          }}
        >
          {availableTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={handleCardClick}
            />
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectorModal;
