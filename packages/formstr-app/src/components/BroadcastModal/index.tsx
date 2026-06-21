import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Progress, Row, Space, Spin, Typography } from "antd";
import { Event } from "nostr-tools";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UseRelayCoverage } from "../../hooks/useRelayCoverage";
import { RelayCoverageResult } from "../../nostr/relayCoverage";

const { Text } = Typography;

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  coverage: UseRelayCoverage;
}

const StatusIcon: React.FC<{ status: RelayCoverageResult["status"] }> = ({
  status,
}) => {
  if (status === "found")
    return <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />;
  if (status === "not-found")
    return <CloseCircleOutlined style={{ color: "#bfbfbf", fontSize: 16 }} />;
  if (status === "error")
    return (
      <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: 16 }} />
    );
  return <Spin size="small" />;
};

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  event,
  coverage,
}) => {
  const { t } = useTranslation();
  const [newRelay, setNewRelay] = useState("");
  const [addError, setAddError] = useState(false);

  const { results, foundCount, total, loading, broadcasting, recheck, addRelay } =
    coverage;
  const missingCount = total - foundCount;

  const handleAdd = () => {
    const value = newRelay.trim();
    if (!value) return;
    const ok = addRelay(value);
    if (ok) {
      setNewRelay("");
      setAddError(false);
    } else {
      setAddError(true);
    }
  };

  const statusLabel = (status: RelayCoverageResult["status"]) => {
    switch (status) {
      case "found":
        return t("broadcast.statusFound");
      case "not-found":
        return t("broadcast.statusNotFound");
      case "error":
        return t("broadcast.statusError");
      default:
        return t("broadcast.statusChecking");
    }
  };

  return (
    <Modal
      title={t("broadcast.title")}
      open={isOpen}
      onCancel={onClose}
      width={560}
      footer={[
        <Button
          key="recheck"
          icon={<SyncOutlined />}
          onClick={recheck}
          disabled={loading || broadcasting}
        >
          {t("broadcast.recheck")}
        </Button>,
        <Button
          key="broadcast"
          type="primary"
          loading={broadcasting}
          disabled={loading || total === 0}
          onClick={() => coverage.broadcast(event)}
        >
          {missingCount > 0
            ? t("broadcast.broadcastMissing", { count: missingCount })
            : t("broadcast.rebroadcast")}
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>
          {t("broadcast.foundOnRelays", { found: foundCount, total })}
        </Text>
        <Progress
          percent={total === 0 ? 0 : Math.round((foundCount / total) * 100)}
          showInfo={false}
          strokeColor="#52c41a"
          style={{ marginTop: 4 }}
        />
      </div>

      <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: 16 }}>
        {results.map((result) => (
          <Row
            key={result.url}
            align="middle"
            justify="space-between"
            style={{ marginBottom: 10 }}
          >
            <Space size={8} style={{ minWidth: 0 }}>
              <StatusIcon status={result.status} />
              <Text
                ellipsis={{ tooltip: result.url }}
                style={{ maxWidth: 320 }}
              >
                {result.url}
              </Text>
            </Space>
            <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              {statusLabel(result.status)}
            </Text>
          </Row>
        ))}
      </div>

      <div>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          {t("broadcast.addRelayTitle")}
        </Text>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="wss://relay.example.com"
            value={newRelay}
            status={addError ? "error" : undefined}
            onChange={(e) => {
              setNewRelay(e.target.value);
              if (addError) setAddError(false);
            }}
            onPressEnter={handleAdd}
          />
          <Button icon={<PlusOutlined />} onClick={handleAdd}>
            {t("broadcast.addRelay")}
          </Button>
        </Space.Compact>
        {addError && (
          <Text type="danger" style={{ display: "block", marginTop: 4, fontSize: 12 }}>
            {t("broadcast.addRelayError")}
          </Text>
        )}
      </div>
    </Modal>
  );
};
