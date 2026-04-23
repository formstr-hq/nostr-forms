import {
  Divider,
  Input,
  Select,
  Switch,
  Typography,
  message,
  Alert,
  Collapse,
} from "antd";
import { useState, useEffect } from "react";
import useFormBuilderContext from "../../../hooks/useFormBuilderContext";
import {
  fetchNRPCMethods,
  fetchKind0Events,
} from "../../../../../nostr/common";
import { nip19 } from "nostr-tools";
import { useTranslation } from "react-i18next";

const { Text, Paragraph, Link } = Typography;

const { Panel } = Collapse;

export default function Automations() {
  const { t } = useTranslation();
  const { formSettings, relayList, updateFormSetting } =
    useFormBuilderContext();

  const [methods, setMethods] = useState<string[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [availableServers, setAvailableServers] = useState<
    { pubkey: string; name: string }[]
  >([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const [introspectionError, setIntrospectionError] = useState<string | null>(
    null
  );

  // 🔹 Fetch list of NRPC servers (Kind 0 tagged as "nrpc_server")
  useEffect(() => {
    const loadServers = async () => {
      setLoadingServers(true);
      try {
        const events = await fetchKind0Events(
          relayList.map((r) => r.url),
          "nrpc_server",
          100
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
        message.error(t("builder.automations.fetchServersFailed"));
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
        setTimeout(() => reject(new Error("Introspection timed out")), 10000)
      );

      try {
        const result = await Promise.race([
          fetchNRPCMethods(
            relayList.map((url) => url.url),
            formSettings.nrpcPubkey
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
        message.warning(msg);
      } finally {
        setLoadingMethods(false);
      }
    };

    loadMethods();
  }, [formSettings.nrpcPubkey, relayList]);

  return (
    <div style={{ alignItems: "flex-start", alignContent: "flex-start" }}>
      {/* Select Existing Server */}
      <div
        className="property-setting"
        style={{
          flexDirection: "column",
          gap: 8,
          alignContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        <Text className="property-text">
          {t("builder.automations.selectExistingServer")}
        </Text>
        <Select
          showSearch
          placeholder={t("builder.automations.searchServer")}
          optionFilterProp="label"
          loading={loadingServers}
          value={formSettings.nrpcPubkey || undefined}
          style={{ width: "100%" }}
          options={availableServers.map((s) => ({
            value: s.pubkey,
            label: s.name,
          }))}
          onChange={(val) => updateFormSetting({ nrpcPubkey: val })}
        />
      </div>
      <div
        className="property-setting"
        style={{
          flexDirection: "column",
          gap: 8,
          alignContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        <Text className="property-text">
          {t("builder.automations.enterServerPubkey")}
        </Text>
        <Input
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
              message.warning(t("builder.automations.validNpub"));
              return;
            }

            try {
              const { type, data } = nip19.decode(val);
              if (type === "npub") {
                updateFormSetting({ nrpcPubkey: data as string });
              } else {
                message.warning(t("builder.automations.invalidNpubFormat"));
              }
            } catch {
              message.error(t("builder.automations.decodeFailed"));
            }
          }}
          style={{ width: "100%" }}
        />
      </div>
      {/* Methods */}
      <div
        className="property-setting"
        style={{
          flexDirection: "column",
          gap: 8,
          marginTop: 16,
          alignItems: "flex-start",
        }}
      >
        <Text className="property-text">
          {t("builder.automations.methodToCall")}
        </Text>
        <Select
          placeholder={t("builder.automations.selectMethod")}
          value={formSettings.nrpcMethod}
          style={{ width: "100%" }}
          loading={loadingMethods}
          disabled={loadingMethods || methods.length === 0}
          options={methods.map((m) => ({ value: m, label: m }))}
          onChange={(val) => updateFormSetting({ nrpcMethod: val })}
        />
      </div>
      {/* Introspection Warning */}
      {introspectionError && (
        <Alert
          message={introspectionError}
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
        />
      )}
      {/* Require Webhook */}
      <div
        className="property-setting"
        style={{ flexDirection: "row", gap: 8, marginTop: 16 }}
      >
        <Text className="property-text">
          {t("builder.automations.requireWebhookPass")}
        </Text>
        <Switch
          checked={formSettings.requireWebhookPass}
          onChange={(checked) =>
            updateFormSetting({ requireWebhookPass: checked })
          }
        />
      </div>
      <Text
        type="secondary"
        style={{ fontSize: 12, marginTop: 12, display: "block" }}
      >
        {t("builder.automations.afterSubmission")}
        {formSettings.requireWebhookPass &&
          t("builder.automations.requireWebhookSuffix")}
      </Text>
      <Collapse ghost style={{ textAlign: "left", marginTop: 8 }}>
        <Panel header={`💡 ${t("builder.automations.learnMore")}`} key="1">
          <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
            {t("builder.automations.description")}
          </Paragraph>
          <ul style={{ fontSize: 12, paddingLeft: 20, marginTop: 8 }}>
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
          </ul>
        </Panel>
      </Collapse>
    </div>
  );
}
