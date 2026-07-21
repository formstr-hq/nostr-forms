// ZapQRCodeModal.tsx
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import * as QRCode from "qrcode.react";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { appConfig } from "../../../../../config";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "../../../../../providers/SnackbarProvider";

const MAX_TIME = 300;

export const ZapQRCodeModal = ({
  open,
  invoice,
  hash,
  amount,
  onSuccess,
  onClose,
}: {
  open: boolean;
  invoice: string;
  hash: string;
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "paid" | "error"
  >("pending");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open || !hash) return;

    setPaymentStatus("pending");
    setTimeLeft(MAX_TIME);

    const ws = new WebSocket(`${appConfig.wsBaseUrl}/ws?hash=${hash}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "paid") {
          setPaymentStatus("paid");
          onSuccess();
          ws.close();
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      setPaymentStatus("error");
    };

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          ws.close();
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      ws.close();
      wsRef.current = null;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open, hash, onSuccess, onClose]);

  const copyInvoice = () => {
    navigator.clipboard.writeText(invoice).then(() => {
      setCopied(true);
      showMessage(t("builder.formDetails.zapQr.invoiceCopied"), "success");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}>
        {t("builder.formDetails.zapQr.title")}
      </DialogTitle>
      <DialogContent sx={{ textAlign: "center", p: 3 }}>
        <Typography>{t("builder.formDetails.zapQr.scanHelp")}</Typography>

        <Box sx={{ mt: 2 }}>
          <QRCode.QRCodeSVG value={invoice} size={220} />

          <Box
            sx={{
              mt: 1.5,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Box
              component="pre"
              sx={{
                overflowX: "auto",
                whiteSpace: "nowrap",
                p: 1,
                bgcolor: "grey.100",
                borderRadius: 1,
                fontSize: 12,
                maxWidth: "100%",
                m: 0,
              }}
            >
              {invoice}
            </Box>
            <Box>{t("builder.formDetails.zapQr.amount", { amount })}</Box>
            <Tooltip
              title={
                copied
                  ? t("builder.formDetails.zapQr.copied")
                  : t("builder.formDetails.zapQr.copyInvoice")
              }
            >
              <IconButton
                aria-label={t("builder.formDetails.zapQr.copyInvoice")}
                size="small"
                onClick={copyInvoice}
                sx={{ flexShrink: 0 }}
              >
                <ContentCopyOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {paymentStatus === "pending" && (
            <Box
              sx={{
                mt: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <CircularProgress size={28} />
              <Typography>{t("builder.formDetails.zapQr.waiting")}</Typography>
              <Typography color="text.secondary">
                {t("builder.formDetails.zapQr.expiresIn", {
                  time: formatTime(timeLeft),
                })}
              </Typography>
            </Box>
          )}

          {paymentStatus === "error" && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {t("builder.formDetails.zapQr.serverError")}
            </Alert>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
