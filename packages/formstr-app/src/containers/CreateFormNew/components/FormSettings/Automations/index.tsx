import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState, useEffect } from "react";
import useFormBuilderContext from "../../../hooks/useFormBuilderContext";
import {
  fetchNRPCMethods,
  fetchKind0Events,
} from "../../../../../nostr/common";
import { nip19 } from "nostr-tools";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "../../../../../providers/SnackbarProvider";

export default function Automations() {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const { formSettings, relayList, updateFormSetting } =
    useFormBuilderContext();

  const [methods, setMethods] = useState<string[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [availableServers, setAvailableServers] = useState<
    { pubkey: string; name: string }[]
  >([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const [introspectionError, setIntrospectionError] = useState<string | null>(
    null,
  );

  // 🔹 Fetch list of NRPC servers (Kind 0 tagged as "nrpc_server")
  useEffect(() => {
    const loadServers = async () => {
      setLoadingServers(true);
      try {
        const events = await fetchKind0Events(
          relayList.map((r) => r.url),
          "nrpc_server",
          100,
        );

        const parsed = events.map((ev: any) => {
          let meta;
          try {
            meta = JSON.parse(ev.content);
          } catch {
            meta = {};
          }
          return {
            pubkey: ev.pubkey,
            name: meta.name || meta.display_name || "Unnamed Server",
          };
        });

        setAvailableServers(parsed);
      } catch (err) {
        console.error("Failed to fetch NRPC servers", err);
        showMessage(t("builder.automations.fetchServersFailed"), "error");
      } finally {
        setLoadingServers(false);
      }
    };

    loadServers();
  }, [relayList]);

  // 🔹 Auto-fetch NRPC methods when pubkey changes
  useEffect(() => {
    const loadMethods = async () => {
      if (!formSettings.nrpcPubkey) return;

      setLoadingMethods(true);
      setIntrospectionError(null);

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Introspection timed out")), 10000),
      );

      try {
        const result = await Promise.race([
          fetchNRPCMethods(
            relayList.map((url) => url.url),
            formSettings.nrpcPubkey,
          ),
          timeout,
        ]);

        if (!(result instanceof Array)) setMethods([]);
        setMethods(result as string[]);
      } catch (err: any) {
        console.error("Failed to fetch NRPC methods", err);
        const msg =
          err.message === "Introspection timed out"
            ? t("builder.automations.timedOut")
            : t("builder.automations.methodsFailed");
        setIntrospectionError(msg);
        showMessage(msg, "warning");
      } finally {
        setLoadingMethods(false);
      }
    };

    loadMethods();
  }, [formSettings.nrpcPubkey, relayList]);

  return (
    <Box sx={{ alignItems: "flex-start", alignContent: "flex-start" }}>
      {/* Select Existing Server */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          alignItems: "flex-start",
          my: 1.5,
          width: "100%",
        }}
      >
        <Typography sx={{ fontSize: 14 }}>
          {t("builder.automations.selectExistingServer")}
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>{t("builder.automations.searchServer")}</InputLabel>
          <Select
            label={t("builder.automations.searchServer")}
            value={formSettings.nrpcPubkey ?? ""}
            disabled={loadingServers}
            onChange={(e) => updateFormSetting({ nrpcPubkey: e.target.value })}
          >
            {availableServers.map((s) => (
              <MenuItem key={s.pubkey} value={s.pubkey}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          alignItems: "flex-start",
          my: 1.5,
          width: "100%",
        }}
      >
        <Typography sx={{ fontSize: 14 }}>
          {t("builder.automations.enterServerPubkey")}
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder={t("builder.automations.npubPlaceholder")}
          value={
            formSettings.nrpcPubkey
              ? (() => {
                  try {
                    return nip19.npubEncode(formSettings.nrpcPubkey);
                  } catch {
                    return "";
                  }
                })()
              : ""
          }
          onChange={(e) => {
            const val = e.target.value.trim();
            if (!val) {
              updateFormSetting({ nrpcPubkey: "" });
              return;
            }

            if (!val.startsWith("npub1")) {
              showMessage(t("builder.automations.validNpub"), "warning");
              return;
            }

            try {
              const { type, data } = nip19.decode(val);
              if (type === "npub") {
                updateFormSetting({ nrpcPubkey: data as string });
              } else {
                showMessage(
                  t("builder.automations.invalidNpubFormat"),
                  "warning",
                );
              }
            } catch {
              showMessage(t("builder.automations.decodeFailed"), "error");
            }
          }}
        />
      </Box>
      {/* Methods */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          mt: 2,
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <Typography sx={{ fontSize: 14 }}>
          {t("builder.automations.methodToCall")}
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>{t("builder.automations.selectMethod")}</InputLabel>
          <Select
            label={t("builder.automations.selectMethod")}
            value={formSettings.nrpcMethod ?? ""}
            disabled={loadingMethods || methods.length === 0}
            onChange={(e) => updateFormSetting({ nrpcMethod: e.target.value })}
          >
            {methods.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {/* Introspection Warning */}
      {introspectionError && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          {introspectionError}
        </Alert>
      )}
      {/* Require Webhook */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          mt: 2,
        }}
      >
        <Typography sx={{ fontSize: 14 }}>
          {t("builder.automations.requireWebhookPass")}
        </Typography>
        <Switch
          checked={formSettings.requireWebhookPass}
          onChange={(_e, checked) =>
            updateFormSetting({ requireWebhookPass: checked })
          }
        />
      </Box>
      <Typography
        color="text.secondary"
        sx={{ fontSize: 12, mt: 1.5, display: "block" }}
      >
        {t("builder.automations.afterSubmission")}
        {formSettings.requireWebhookPass &&
          t("builder.automations.requireWebhookSuffix")}
      </Typography>
      <Accordion
        disableGutters
        elevation={0}
        sx={{
          mt: 1,
          textAlign: "left",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ px: 0, minHeight: 36 }}
        >
          <Typography>{`💡 ${t("builder.automations.learnMore")}`}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0 }}>
          <Typography color="text.secondary" sx={{ fontSize: 12, mb: 0 }}>
            {t("builder.automations.description")}
          </Typography>
          <Box component="ul" sx={{ fontSize: 12, pl: 2.5, mt: 1 }}>
            <li>
              {t("builder.automations.readSpec")}{" "}
              <Link
                href="https://github.com/nostr-protocol/nips/blob/9deb067debca268a79c60bff50b42dcf090f2745/N1.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("builder.automations.specification")}
              </Link>{" "}
              {t("builder.automations.understandProtocol")}
            </li>
            <li>
              {t("builder.automations.tryRunning")}{" "}
              <Link
                href="https://github.com/abh3po/nrpc_server"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("builder.automations.demoServer")}
              </Link>{" "}
              {t("builder.automations.tinkerLocally")}
            </li>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
