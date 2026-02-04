import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Button, Modal, Row, Spin, Typography } from "antd";
import { normalizeURL } from "nostr-tools/utils";

interface RelayPublishModalProps {
  relays: string[];
  acceptedRelays: string[];
  isOpen: boolean;
  publishFailed?: boolean;
  onClose?: () => void;
}

export const RelayPublishModal: React.FC<RelayPublishModalProps> = ({
  isOpen,
  relays,
  acceptedRelays,
  publishFailed,
  onClose,
}) => {
  const allRelaysAccepted =
    relays && relays.every((url) => acceptedRelays.includes(normalizeURL(url)));

  const canClose = allRelaysAccepted || publishFailed;

  const { Text } = Typography;

  const renderRelays = () => {
    if (!relays) return null;

    return relays.map((url) => {
      const normalizedUrl = normalizeURL(url);
      const isAccepted = acceptedRelays.includes(normalizedUrl);
      const showFailed = publishFailed && !isAccepted;

      return (
        <Row key={url} align="middle" style={{ marginBottom: 8 }}>
          {isAccepted ? (
            <CheckCircleOutlined
              style={{
                color: "#52c41a",
                marginRight: 8,
                fontSize: "16px",
              }}
            />
          ) : showFailed ? (
            <CloseCircleOutlined
              style={{
                color: "#ff4d4f",
                marginRight: 8,
                fontSize: "16px",
              }}
            />
          ) : (
            <Spin size="small" style={{ marginRight: 8 }} />
          )}
          <Text>{url}</Text>
        </Row>
      );
    });
  };

  return (
    <Modal
      title="Publishing Form"
      open={isOpen}
      footer={
        canClose ? (
          <Button
            type="primary"
            danger={publishFailed && acceptedRelays.length === 0}
            onClick={onClose}
          >
            {publishFailed && acceptedRelays.length === 0 ? "Close" : "Done"}
          </Button>
        ) : null
      }
      closable={canClose}
      maskClosable={canClose}
      onCancel={onClose}
    >
      <div>
        <Text strong style={{ display: "block", marginBottom: 16 }}>
          Relays {allRelaysAccepted && "(Complete)"}
        </Text>
        {renderRelays()}
        {publishFailed && acceptedRelays.length === 0 && (
          <Text
            type="danger"
            style={{ display: "block", marginTop: 16 }}
          >
            No relays accepted the form. Please check your relay
            configuration and try again.
          </Text>
        )}
      </div>
    </Modal>
  );
};
