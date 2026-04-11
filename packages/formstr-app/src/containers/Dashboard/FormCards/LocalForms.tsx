import { useEffect, useState } from "react";
import { ILocalForm } from "../../CreateFormNew/providers/FormBuilder/typeDefs";
import { LocalFormCard } from "./LocalFormCard";
import { pool } from "../../../pool";
import { getDefaultRelays } from "../../../nostr/common";
import { Event } from "nostr-tools";
import { FormEventCard } from "./FormEventCard";
import { SubCloser } from "nostr-tools/abstract-pool";
import { useMyForms } from "../../../provider/MyFormsProvider";
import { useProfileContext } from "../../../hooks/useProfileContext";
import { Button, Typography, message } from "antd";
import {
  CloudUploadOutlined,
  CloudSyncOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface LocaLFormsProps {
  localForms: ILocalForm[];
  onDeleted: (localForm: ILocalForm) => void;
}

export const LocalForms: React.FC<LocaLFormsProps> = ({
  localForms,
  onDeleted,
}) => {
  const [eventMap, setEventMap] = useState<Map<string, Event>>(new Map());
  const { pubkey } = useProfileContext();
  const { inMyForms, saveToMyForms } = useMyForms();
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const onFormEvent = (event: Event) => {
    const dTag = event.tags.filter((t) => t[0] === "d")[0]?.[1];
    let key = `${event.pubkey}:${dTag}`;
    setEventMap((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(key, event);
      return newMap;
    });
  };

  useEffect(() => {
    let closer: SubCloser;
    const initialize = () => {
      let pubkeys = localForms.map((l) => l.publicKey);
      let dTags = localForms.map((f) => f.formId);
      let filter = {
        kinds: [30168],
        "#d": dTags,
        authors: pubkeys,
      };
      closer = pool.subscribeMany(getDefaultRelays(), [filter], {
        onevent: onFormEvent,
      });
    };
    initialize();
    return () => {
      if (closer) closer.close();
    };
  }, []);

  const unsyncedForms = pubkey
    ? localForms.filter((f) => !inMyForms(f.publicKey, f.formId))
    : [];
  const syncedCount = pubkey
    ? localForms.filter((f) => inMyForms(f.publicKey, f.formId)).length
    : 0;

  const handleBulkSync = async () => {
    if (!pubkey || unsyncedForms.length === 0) return;
    setBulkSyncing(true);
    setBulkProgress({ current: 0, total: unsyncedForms.length });

    let successCount = 0;
    for (const form of unsyncedForms) {
      try {
        await saveToMyForms(
          form.publicKey,
          form.privateKey,
          form.formId,
          form.relays?.length ? form.relays : [form.relay],
          form.viewKey,
        );
        successCount++;
        setBulkProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      } catch (err) {
        console.error(`Failed to sync form ${form.name}:`, err);
        message.error(`Failed to sync "${form.name}"`);
      }
    }

    setBulkSyncing(false);
    if (successCount > 0) {
      message.success(`Synced ${successCount} form(s) to Nostr`);
    }
  };

  return (
    <>
      {pubkey && localForms.length > 0 && (
        <div
          style={{
            width: "80%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text type="secondary">
            <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 4 }} />
            {syncedCount} of {localForms.length} synced to Nostr
          </Text>
          {unsyncedForms.length > 0 && (
            <Button
              icon={<CloudSyncOutlined />}
              loading={bulkSyncing}
              onClick={handleBulkSync}
              size="small"
            >
              {bulkSyncing
                ? `Syncing ${bulkProgress.current}/${bulkProgress.total}...`
                : `Sync All (${unsyncedForms.length})`}
            </Button>
          )}
        </div>
      )}
      {Array.from(localForms)
        .sort(
          (a, b) =>
            Number(new Date(b.createdAt).getTime()) -
            Number(new Date(a.createdAt).getTime())
        )
        .map((localForm: ILocalForm) => {
          let formEvent = eventMap.get(
            `${localForm.publicKey}:${localForm.formId}`
          );
          const isSynced = pubkey
            ? inMyForms(localForm.publicKey, localForm.formId)
            : false;
          if (formEvent)
            return (
              <FormEventCard
                event={formEvent}
                key={localForm.key}
                relay={localForm.relay}
                secretKey={localForm.privateKey}
                viewKey={localForm.viewKey}
                onDeleted={() => {
                  onDeleted(localForm);
                }}
                syncStatus={pubkey ? (isSynced ? "synced" : "unsynced") : undefined}
                onSync={
                  !isSynced && pubkey
                    ? () =>
                        saveToMyForms(
                          localForm.publicKey,
                          localForm.privateKey,
                          localForm.formId,
                          localForm.relays?.length
                            ? localForm.relays
                            : [localForm.relay],
                          localForm.viewKey,
                        )
                    : undefined
                }
              />
            );
          else
            return (
              <LocalFormCard
                key={localForm.key}
                form={localForm}
                onDeleted={() => {
                  onDeleted(localForm);
                }}
                isSynced={isSynced}
                onSync={
                  !isSynced && pubkey
                    ? () =>
                        saveToMyForms(
                          localForm.publicKey,
                          localForm.privateKey,
                          localForm.formId,
                          localForm.relays?.length
                            ? localForm.relays
                            : [localForm.relay],
                          localForm.viewKey,
                        )
                    : undefined
                }
              />
            );
        })}
    </>
  );
};
