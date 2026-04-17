import React, { useState } from "react";
import { Modal, Button, InputNumber, Input, Space, Typography } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";

const { Text } = Typography;

const PRESETS = [21, 420, 1000, 5000, 10000, 15000];

interface ZapAmountModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (amountSats: number, comment: string) => void;
  loading?: boolean;
  recipientName?: string;
}

export const ZapAmountModal: React.FC<ZapAmountModalProps> = ({
  open,
  onCancel,
  onConfirm,
  loading = false,
  recipientName,
}) => {
  const [amount, setAmount] = useState<number>(21);
  const [comment, setComment] = useState<string>("");

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: "#F7931A" }} />
          <span>Zap {recipientName || "Responder"}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="zap"
          type="primary"
          onClick={() => onConfirm(amount, comment)}
          loading={loading}
          icon={<ThunderboltOutlined />}
          style={{ background: "#F7931A", borderColor: "#F7931A" }}
        >
          Zap {amount} sats
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          Choose an amount (sats)
        </Text>
        <Space wrap style={{ marginBottom: 16, justifyContent: "center" }}>
          {PRESETS.map((preset) => (
            <Button
              key={preset}
              type={amount === preset ? "primary" : "default"}
              onClick={() => setAmount(preset)}
              style={
                amount === preset
                  ? { background: "#F7931A", borderColor: "#F7931A" }
                  : {}
              }
            >
              {preset}
            </Button>
          ))}
        </Space>
        <div style={{ marginBottom: 16 }}>
          <InputNumber
            min={1}
            max={10_000_000}
            value={amount}
            onChange={(val) => val && setAmount(val)}
            addonAfter="sats"
            style={{ width: 200 }}
          />
        </div>
        <div style={{ textAlign: "left" }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
            Message (optional)
          </Text>
          <Input.TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="thank you 👍"
            rows={2}
          />
        </div>
      </div>
    </Modal>
  );
};
