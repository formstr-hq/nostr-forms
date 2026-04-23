import { Button, Card, Typography, Dropdown, MenuProps } from "antd";
import { ILocalForm } from "../../CreateFormNew/providers/FormBuilder/typeDefs";
import { useNavigate } from "react-router-dom";
import DeleteFormTrigger from "./DeleteForm";
import { makeFormNAddr, naddrUrl } from "../../../utils/utility";
import { editPath, responsePath } from "../../../utils/formUtils";
import { EditOutlined, MoreOutlined } from "@ant-design/icons";
import SafeMarkdown from "../../../components/SafeMarkdown";
import { useTranslation } from "react-i18next";

interface LocalFormCardProps {
  form: ILocalForm;
  onDeleted: () => void;
}

const { Text } = Typography;
export const LocalFormCard: React.FC<LocalFormCardProps> = ({
  form,
  onDeleted,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  let responseUrl = form.formId
    ? responsePath(
        form.privateKey,
        makeFormNAddr(
          form.publicKey,
          form.formId,
          form.relays && form.relays.length !== 0 ? form.relays : [form.relay]
        ),
        form.viewKey
      )
    : `/response/${form.privateKey}`;
  let formUrl =
    form.publicKey && form.formId
      ? naddrUrl(form.publicKey, form.formId, [form.relay], form.viewKey, true)
      : `/fill/${form.publicKey}`;
  const menuItems: MenuProps["items"] = [
    {
      key: "edit",
      label: t("common.actions.edit"),
      icon: <EditOutlined />,
      onClick: () =>
        navigate(
          editPath(
            form.privateKey,
            makeFormNAddr(
              form.publicKey,
              form.formId,
              form.relays?.length ? form.relays : undefined
            ),
            form.viewKey
          )
        ),
    },
  ];

  return (
    <Card
      title={
        <SafeMarkdown components={{ p: "span" }}>{form.name}</SafeMarkdown>
      }
      className="form-card"
      extra={
        <div>
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              style={{ color: "purple", marginRight: 14, cursor: "pointer" }}
              aria-label={t("dashboardCards.quickActions")}
            >
              <MoreOutlined />
            </Button>
          </Dropdown>
          <DeleteFormTrigger formKey={form.key} onDeleted={onDeleted} />
        </div>
      }
    >
      <Button
        onClick={(e) => {
          navigate(responseUrl);
        }}
      >
        {t("dashboardCards.viewResponses")}
      </Button>
      <Button
        onClick={(e: any) => {
          e.stopPropagation();
          navigate(formUrl);
        }}
        style={{
          marginLeft: "10px",
        }}
      >
        {t("dashboardCards.openForm")}
      </Button>
    </Card>
  );
};
