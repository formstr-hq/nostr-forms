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
    <Dialog
      open={visible}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            // Bound the dialog to the viewport so overflow scrolls inside
            // DialogContent, not the whole dialog/page. dvh keeps it honest
            // against mobile browser chrome.
            m: { xs: 2, sm: 4 },
            maxHeight: "calc(100dvh - 32px)",
          },
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", flexShrink: 0 }}>
        {t("templates.chooseTemplate")}
      </DialogTitle>
      <DialogContent sx={{ overflowY: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
            gap: 1.5,
            py: { xs: 1, sm: 2.5 },
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
