import React from "react";
import { Modal, Typography } from "antd";
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
    <Modal
      title={
        <Typography.Title level={4} style={{ textAlign: "center", margin: 0 }}>
          {t("templates.chooseTemplate")}
        </Typography.Title>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "20px 0",
        }}
      >
        {availableTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onClick={handleCardClick}
          />
        ))}
      </div>
    </Modal>
  );
};

export default TemplateSelectorModal;
