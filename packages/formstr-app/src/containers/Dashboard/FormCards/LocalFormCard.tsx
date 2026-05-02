import { useState } from "react";
import { Button, Card, Typography, Dropdown, MenuProps, Tooltip, message } from "antd";
import { ILocalForm } from "../../CreateFormNew/providers/FormBuilder/typeDefs";
import { useNavigate } from "react-router-dom";
import DeleteFormTrigger from "./DeleteForm";
import { makeFormNAddr, naddrUrl } from "../../../utils/utility";
import { editPath, responsePath } from "../../../utils/formUtils";
import {
  EditOutlined,
  MoreOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import SafeMarkdown from "../../../components/SafeMarkdown";

interface LocalFormCardProps {
  form: ILocalForm;
  onDeleted: () => void;
  isSynced?: boolean;
  onSync?: () => Promise<void>;
}

const { Text } = Typography;
export const LocalFormCard: React.FC<LocalFormCardProps> = ({
  form,
  onDeleted,
  isSynced,
  onSync,
}) => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!onSync) return;
    setSyncing(true);
    try {
      await onSync();
      message.success(`"${form.name}" synced to Nostr`);
    } catch (err) {
      message.error(`Failed to sync "${form.name}"`);
    } finally {
      setSyncing(false);
    }
  };
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
      label: "Edit",
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
        <div style={{ display: "flex", alignItems: "center" }}>
          {isSynced === true && (
            <Tooltip title="Synced to Nostr">
              <CheckCircleOutlined
                style={{ color: "#52c41a", marginRight: 10, fontSize: 16 }}
              />
            </Tooltip>
          )}
          {isSynced === false && onSync && (
            <Tooltip title="Sync to Nostr profile">
              <Button
                type="text"
                size="small"
                icon={<CloudUploadOutlined />}
                loading={syncing}
                onClick={handleSync}
                style={{ color: "#1890ff", marginRight: 6 }}
              />
            </Tooltip>
          )}
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              style={{ color: "purple", marginRight: 14, cursor: "pointer" }}
              aria-label="Quick actions"
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
        View Responses
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
        Open Form
      </Button>
    </Card>
  );
};
