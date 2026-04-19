import { Link, useNavigate } from "react-router-dom";
import { Typography, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { ReactComponent as NoData } from "../../Images/no-forms.svg";
import StyleWrapper from "./style";
import { ROUTES } from "../../constants/routes";
import { FormTemplate } from "../../templates";
import TemplateCard from "../TemplateCard";

const { Text } = Typography;

interface EmptyScreenProps {
  message?: string;
  action?: () => void;
  actionLabel?: string;
  templates?: FormTemplate[];
  onTemplateClick?: (template: FormTemplate) => void;
}

function EmptyScreen({ message, action, actionLabel, templates, onTemplateClick }: EmptyScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const showTemplates = templates && templates.length > 0 && onTemplateClick;

  return (
    <StyleWrapper>
      {showTemplates ? (
        <>
          <Typography.Title level={4} style={{ marginBottom: "20px", textAlign: "center" }}>
            {t("builder.templateEmptyTitle")}
          </Typography.Title>
          <div
            style={{
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
          </div>
        </>
      ) : (
        <>
          <NoData className="empty-screen" />
          <Text className="no-data">
            {message || t("builder.emptyState.createFirstForm")}
          </Text>
          <Button
            className="add-form"
            type="primary"
            icon={action ? null : <PlusOutlined style={{ paddingTop: "2px" }} />}
            onClick={() => {
              if (action) action();
              else {
                navigate(ROUTES.CREATE_FORMS_NEW);
              }
            }}
          >
            {actionLabel || t("builder.emptyState.createForm")}
          </Button>
        </>
      )}
    </StyleWrapper>
  );
}

export default EmptyScreen;
