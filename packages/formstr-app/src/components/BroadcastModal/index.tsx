import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ErrorIcon from "@mui/icons-material/Error";
import AddIcon from "@mui/icons-material/Add";
import SyncIcon from "@mui/icons-material/Sync";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Event } from "nostr-tools";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UseRelayCoverage } from "../../hooks/useRelayCoverage";
import { RelayCoverageResult } from "../../nostr/relayCoverage";

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
    return <CheckCircleIcon sx={{ color: "#52c41a", fontSize: 16 }} />;
  if (status === "not-found")
    return <CancelIcon sx={{ color: "#bfbfbf", fontSize: 16 }} />;
  if (status === "error")
    return <ErrorIcon sx={{ color: "#faad14", fontSize: 16 }} />;
  return <CircularProgress size={16} />;
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
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("broadcast.title")}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 600 }}>
            {t("broadcast.foundOnRelays", { found: foundCount, total })}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={total === 0 ? 0 : Math.round((foundCount / total) * 100)}
            sx={{
              mt: 0.5,
              "& .MuiLinearProgress-bar": { backgroundColor: "#52c41a" },
            }}
          />
        </Box>

        <Box sx={{ maxHeight: 320, overflowY: "auto", mb: 2 }}>
          {results.map((result) => (
            <Box
              key={result.url}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.25,
                gap: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <StatusIcon status={result.status} />
                <Tooltip title={result.url}>
                  <Typography noWrap sx={{ maxWidth: 320 }}>
                    {result.url}
                  </Typography>
                </Tooltip>
              </Box>
              <Typography
                color="text.secondary"
                sx={{ fontSize: 12, whiteSpace: "nowrap" }}
              >
                {statusLabel(result.status)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, display: "block", mb: 1 }}>
            {t("broadcast.addRelayTitle")}
          </Typography>
          <Box sx={{ display: "flex", width: "100%" }}>
            <TextField
              size="small"
              fullWidth
              placeholder="wss://relay.example.com"
              value={newRelay}
              error={addError}
              onChange={(e) => {
                setNewRelay(e.target.value);
                if (addError) setAddError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, ml: "-1px" }}
            >
              {t("broadcast.addRelay")}
            </Button>
          </Box>
          {addError && (
            <Typography
              color="error"
              sx={{ display: "block", mt: 0.5, fontSize: 12 }}
            >
              {t("broadcast.addRelayError")}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          startIcon={<SyncIcon />}
          onClick={recheck}
          disabled={loading || broadcasting}
        >
          {t("broadcast.recheck")}
        </Button>
        <Button
          variant="contained"
          disabled={loading || total === 0 || broadcasting}
          startIcon={
            broadcasting ? <CircularProgress size={16} color="inherit" /> : undefined
          }
          onClick={() => coverage.broadcast(event)}
        >
          {missingCount > 0
            ? t("broadcast.broadcastMissing", { count: missingCount })
            : t("broadcast.rebroadcast")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
