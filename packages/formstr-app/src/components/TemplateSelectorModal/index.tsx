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
      slotProps={{
        paper: {
          // Mobile only: tighten margins and bound to the dynamic viewport
          // so content scrolls inside DialogContent, not the whole page.
          // Desktop (sm+) falls back to MUI defaults, unchanged.
          sx: {
            m: { xs: 2 },
            maxHeight: { xs: "calc(100dvh - 32px)" },
          },
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center" }}>
        {t("templates.chooseTemplate")}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            // Desktop keeps the original centered flex-wrap of fixed cards.
            // Mobile switches to a compact 2-column grid so all templates fit.
            display: { xs: "grid", sm: "flex" },
            gridTemplateColumns: { xs: "repeat(2, 1fr)" },
            gap: { xs: 1.5 },
            flexWrap: { sm: "wrap" },
            justifyContent: { sm: "center" },
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
