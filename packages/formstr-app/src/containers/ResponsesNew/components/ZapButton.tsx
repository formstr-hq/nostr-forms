import React, { useState } from "react";
import { Button, Tooltip, Typography, message } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import { Event } from "nostr-tools";
import {
  ResponderProfile,
  requestZapInvoice,
  openLightningWallet,
  ZapTotal,
} from "../../../nostr/zaps";
import { ZapAmountModal } from "./ZapAmountModal";

const { Text } = Typography;

interface ZapButtonProps {
  /** The Kind-0 raw event of the responder */
  recipientProfileEvent: Event | undefined;
  /** Parsed profile data */
  profile: ResponderProfile | undefined;
  /** The response event to zap */
  responseEvent: Event;
  /** The parent form event (for "a" tag) */
  formEvent: Event;
  /** Accumulated zap total for this response */
  zapTotal?: ZapTotal;
  /** Relays to use */
  relays?: string[];
  /** Callback after zap initiated (to refresh totals) */
  onZapInitiated?: () => void;
  /** Compact mode for table cells */
  compact?: boolean;
}

export const ZapButton: React.FC<ZapButtonProps> = ({
  recipientProfileEvent,
  profile,
  responseEvent,
  formEvent,
  zapTotal,
  relays,
  onZapInitiated,
  compact = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleZap = async (amountSats: number) => {
    if (!recipientProfileEvent) return;
    setLoading(true);
    try {
      const invoice = await requestZapInvoice({
        recipientProfileEvent,
        responseEvent,
        formEvent,
        amountMsats: amountSats * 1000,
        relays,
      });
      openLightningWallet(invoice);
      message.success("Lightning invoice opened in wallet");
      setModalOpen(false);
      onZapInitiated?.();
    } catch (err: any) {
      message.error(err?.message || "Failed to create zap");
    } finally {
      setLoading(false);
    }
  };

  const totalSats = zapTotal?.totalSats ?? 0;

  return (
    <>
      <Tooltip title="Zap this responder">
        <Button
          type="text"
          size={compact ? "small" : "middle"}
          icon={<ThunderboltOutlined style={{ color: "#F7931A" }} />}
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
          }}
        >
          {totalSats > 0 && (
            <Text
              style={{ fontSize: compact ? 11 : 13, color: "#F7931A" }}
            >
              {formatSats(totalSats)}
            </Text>
          )}
        </Button>
      </Tooltip>
      <ZapAmountModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleZap}
        loading={loading}
        recipientName={profile?.name}
      />
    </>
  );
};

function formatSats(sats: number): string {
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(1)}M`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(1)}k`;
  return `${sats}`;
}
