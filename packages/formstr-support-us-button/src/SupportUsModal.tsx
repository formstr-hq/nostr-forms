import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BoltIcon from '@mui/icons-material/Bolt';
import { QRCodeSVG } from 'qrcode.react';
import { nip19, SimplePool } from 'nostr-tools';

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
  const [toast, setToast] = useState<string | null>(null);

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
          setToast('Payment successful! Thank you for your support. ⚡');
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
      setToast('Invoice copied to clipboard');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <BoltIcon sx={{ color: '#fadb14', mr: 1 }} />
          Support Formstr
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          {loading && !invoice && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography>Loading...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && !invoice && (
            <>
              <Typography variant="h6">Send some sats to show your support! ⚡</Typography>
              <Typography color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Recipient: {lud16 || 'Resolving...'}
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    justifyContent: 'center',
                  }}
                >
                  {[21, 100, 500, 1000, 5000].map((amt) => (
                    <Button
                      key={amt}
                      variant={amountSats === amt ? 'contained' : 'outlined'}
                      onClick={() => setAmountSats(amt)}
                      sx={{
                        borderRadius: '8px',
                        px: 2,
                        py: 0.5,
                        fontSize: '16px',
                        fontWeight: amountSats === amt ? 'bold' : 'normal',
                      }}
                    >
                      {amt.toLocaleString()}
                    </Button>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                <TextField
                  type="number"
                  value={amountSats ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAmountSats(val === '' ? null : Number(val));
                  }}
                  placeholder="Custom amount"
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">sats</InputAdornment>,
                    },
                    htmlInput: { min: 1 },
                  }}
                  sx={{ width: '100%', maxWidth: '300px' }}
                />
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={handleGenerateInvoice}
                disabled={loading || !zapEndpoint || !amountSats || amountSats <= 0}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                Generate Invoice
              </Button>
            </>
          )}

          {invoice && (
            <Box>
              <Typography variant="h6">Scan to Pay {amountSats} sats</Typography>
              <Box sx={{ my: 3 }}>
                <QRCodeSVG value={invoice} size={220} />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                  mb: 2,
                }}
              >
                <Box
                  component="pre"
                  sx={{
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    p: 1,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1,
                    fontSize: 12,
                    maxWidth: '100%',
                    m: 0,
                  }}
                >
                  {invoice}
                </Box>
                <Tooltip title="Copy invoice">
                  <IconButton size="small" onClick={handleCopy} sx={{ flexShrink: 0 }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Button onClick={() => attemptWebLN(invoice)} sx={{ mr: 1 }}>
                Open Wallet
              </Button>
              <Button variant="outlined" onClick={() => setInvoice(null)}>
                Back
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast(null)} severity="success" variant="filled" sx={{ width: '100%' }}>
          {toast}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};
