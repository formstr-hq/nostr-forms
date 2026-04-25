import React, { useState, useEffect, useRef } from 'react';
import { Modal, InputNumber, Button, Typography, message, Spin, Alert, Tooltip, Divider } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { nip19, SimplePool } from 'nostr-tools';
import { CopyOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

// Define relays to fetch kind 0
const RELAYS = ['wss://purplepag.es', 'wss://relay.damus.io', 'wss://relay.nostr.band'];

// Module-level cache — shared across all instances, persists for the session
interface LNCache {
  lud16: string;
  zapEndpoint: string;
}
const lnCache: Record<string, LNCache> = {};

// Eagerly fetches and caches the LN endpoint for a given npub
export const prefetchSupportInfo = async (npub: string): Promise<void> => {
  if (lnCache[npub]) return; // already cached

  try {
    const { type, data } = nip19.decode(npub);
    if (type !== 'npub') return;
    const decodedPubkey = data as string;

    const pool = new SimplePool();
    const profileEvent = await pool.get(RELAYS, {
      kinds: [0],
      authors: [decodedPubkey],
    });
    pool.close(RELAYS);

    if (!profileEvent) return;

    const content = JSON.parse(profileEvent.content);
    const lud16Address = content.lud16 || content.lud06;
    if (!lud16Address) return;

    const [name, domain] = lud16Address.split('@');
    if (!domain) return;

    const endpointUrl = `https://${domain}/.well-known/lnurlp/${name}`;
    const res = await fetch(endpointUrl);
    const lnData = await res.json();

    if (lnData.callback) {
      lnCache[npub] = { lud16: lud16Address, zapEndpoint: lnData.callback };
    }
  } catch {
    // Silently fail — modal will fetch on demand if cache is empty
  }
};

interface SupportUsModalProps {
  open: boolean;
  npub: string;
  onClose: () => void;
}

export const SupportUsModal: React.FC<SupportUsModalProps> = ({ open, npub, onClose }) => {
  const [amountSats, setAmountSats] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zapEndpoint, setZapEndpoint] = useState<string | null>(null);
  const [lud16, setLud16] = useState<string | null>(null);

  // Load from cache or fetch on first open
  useEffect(() => {
    if (!open) {
      setInvoice(null);
      setError(null);
      return;
    }

    // If already cached, apply instantly — no spinner
    if (lnCache[npub]) {
      setLud16(lnCache[npub].lud16);
      setZapEndpoint(lnCache[npub].zapEndpoint);
      return;
    }

    // Fallback: fetch now (in case prefetch hasn't completed yet)
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { type, data } = nip19.decode(npub);
        if (type !== 'npub') throw new Error('Invalid npub provided');
        const decodedPubkey = data as string;

        const pool = new SimplePool();
        const profileEvent = await pool.get(RELAYS, {
          kinds: [0],
          authors: [decodedPubkey],
        });
        pool.close(RELAYS);

        if (!profileEvent) throw new Error('Could not find Nostr profile for this npub');

        const content = JSON.parse(profileEvent.content);
        const lud16Address = content.lud16 || content.lud06;
        if (!lud16Address) throw new Error('Profile has no Lightning Address configured');

        const [name, domain] = lud16Address.split('@');
        if (!domain) throw new Error('Only lud16 (Lightning Address) is supported');

        const endpointUrl = `https://${domain}/.well-known/lnurlp/${name}`;
        const res = await fetch(endpointUrl);
        const lnData = await res.json();

        if (!lnData.callback) throw new Error('Invalid LNURL response from provider');

        // Populate cache for future opens
        lnCache[npub] = { lud16: lud16Address, zapEndpoint: lnData.callback };
        setLud16(lud16Address);
        setZapEndpoint(lnData.callback);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [open, npub]);

  const handleGenerateInvoice = async () => {
    if (!zapEndpoint) return;
    setLoading(true);
    setError(null);

    try {
      const millisats = (amountSats || 0) * 1000;
      const url = `${zapEndpoint}${zapEndpoint.includes('?') ? '&' : '?'}amount=${millisats}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.pr) {
        setInvoice(data.pr);
        attemptWebLN(data.pr);
      } else {
        throw new Error(data.reason || 'Failed to generate invoice');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const attemptWebLN = async (pr: string) => {
    try {
      if (typeof window !== 'undefined' && (window as any).webln) {
        await (window as any).webln.enable();
        const response = await (window as any).webln.sendPayment(pr);
        if (response?.preimage) {
          message.success('Payment successful! Thank you for your support. ⚡');
          onClose();
        }
      }
    } catch (err) {
      // Fallback: QR is already showing
    }
  };

  const handleCopy = () => {
    if (invoice) {
      navigator.clipboard.writeText(invoice);
      message.success('Invoice copied to clipboard');
    }
  };

  return (
    <Modal
      title={
        <span>
          <ThunderboltOutlined style={{ color: '#fadb14', marginRight: 8 }} />
          Support Formstr
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose={false}
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        {loading && !invoice && <Spin tip="Loading..." />}

        {error && (
          <Alert type="error" message={error} style={{ marginBottom: 16 }} />
        )}

        {!loading && !error && !invoice && (
          <>
            <Title level={5}>Send some sats to show your support! ⚡</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Recipient: {lud16 || 'Resolving...'}
            </Text>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center',
                }}
              >
                {[21, 100, 500, 1000, 5000].map((amt) => (
                  <Button
                    key={amt}
                    type={amountSats === amt ? 'primary' : 'default'}
                    onClick={() => setAmountSats(amt)}
                    style={{
                      borderRadius: '8px',
                      padding: '4px 16px',
                      height: 'auto',
                      fontSize: '16px',
                      fontWeight: amountSats === amt ? 'bold' : 'normal',
                    }}
                  >
                    {amt.toLocaleString()}
                  </Button>
                ))}
              </div>

              <Divider style={{ margin: '16px 0', borderBlockColor: '#f0f0f0' }} />

              <InputNumber
                min={1}
                value={amountSats}
                onChange={(val) => setAmountSats(val)}
                placeholder="Custom amount"
                addonAfter="sats"
                style={{ width: '100%', maxWidth: '300px' }}
                size="large"
              />
            </div>
            <Button
              type="primary"
              size="large"
              onClick={handleGenerateInvoice}
              loading={loading}
              disabled={!zapEndpoint || !amountSats || amountSats <= 0}
            >
              Generate Invoice
            </Button>
          </>
        )}

        {invoice && (
          <div>
            <Title level={5}>Scan to Pay {amountSats} sats</Title>
            <div style={{ margin: '24px 0' }}>
              <QRCodeSVG value={invoice} size={220} />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              <pre
                style={{
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  padding: 8,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 4,
                  fontSize: 12,
                  maxWidth: '100%',
                  margin: 0,
                }}
              >
                {invoice}
              </pre>
              <Tooltip title="Copy invoice">
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={handleCopy}
                  style={{ flexShrink: 0 }}
                />
              </Tooltip>
            </div>

            <Button onClick={() => attemptWebLN(invoice)} style={{ marginRight: 8 }}>
              Open Wallet
            </Button>
            <Button type="default" onClick={() => setInvoice(null)}>
              Back
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
