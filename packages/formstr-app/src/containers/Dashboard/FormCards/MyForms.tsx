import { useState } from "react";
import { useProfileContext } from "../../../hooks/useProfileContext";
import { Event } from "nostr-tools";
import { Tag } from "../../../nostr/types";
import { FormEventCard } from "./FormEventCard";
import { Spin, Button, Typography, message } from "antd";
import {
  LoadingOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useMyForms } from "../../../provider/MyFormsProvider";
import { useLocalForms } from "../../../provider/LocalFormsProvider";
import { ILocalForm } from "../../CreateFormNew/providers/FormBuilder/typeDefs";

const { Text } = Typography;

type FormEventMetadata = {
  event: Event;
  secrets: { secretKey: string; viewKey?: string };
  relay: string;
};

const buildLocalForm = (
  formMetadata: FormEventMetadata,
  formId: string,
): ILocalForm => {
  const name =
    formMetadata.event.tags.find((t: Tag) => t[0] === "name")?.[1] || "Untitled";
  const relays = formMetadata.event.tags
    .filter((t: Tag) => t[0] === "relay")
    .map((t) => t[1]);

  return {
    key: `${formMetadata.event.pubkey}:${formId}`,
    name,
    createdAt: new Date(formMetadata.event.created_at * 1000).toString(),
    publicKey: formMetadata.event.pubkey,
    privateKey: formMetadata.secrets.secretKey,
    viewKey: formMetadata.secrets.viewKey,
    formId,
    relay: formMetadata.relay || (relays.length ? relays[0] : ""),
    relays: relays.length ? relays : formMetadata.relay ? [formMetadata.relay] : [],
  };
};

export const MyForms = () => {
  const { pubkey: userPub } = useProfileContext();
  const { formEvents, refreshing, deleteForm } = useMyForms();
  const { localForms, saveLocalForm } = useLocalForms();
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const localFormKeys = new Set(localForms.map((f) => f.key));

  const isOnDevice = (pubkey: string, formId: string) =>
    localFormKeys.has(`${pubkey}:${formId}`);

  const handleFormDeleted = async (
    formId: string,
    extractedFormPubkey: string,
  ) => {
    deleteForm(formId, extractedFormPubkey);
  };

  const handleSaveToDevice = async (
    formMetadata: FormEventMetadata,
    formId: string,
  ) => {
    const localForm = buildLocalForm(formMetadata, formId);
    await saveLocalForm(localForm);
    message.success(`"${localForm.name}" saved to device`);
  };

  const allEntries = [...formEvents.entries()];
  const missingLocally = allEntries.filter(
    ([id, meta]) => !isOnDevice(meta.event.pubkey, id),
  );
  const savedCount = allEntries.length - missingLocally.length;

  const handleBulkSave = async () => {
    if (missingLocally.length === 0) return;
    setBulkSaving(true);
    setBulkProgress({ current: 0, total: missingLocally.length });

    let successCount = 0;
    for (const [formId, meta] of missingLocally) {
      try {
        const localForm = buildLocalForm(meta, formId);
        await saveLocalForm(localForm);
        successCount++;
        setBulkProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      } catch (err) {
        console.error(`Failed to save form ${formId} to device:`, err);
      }
    }

    setBulkSaving(false);
    if (successCount > 0) {
      message.success(`Saved ${successCount} form(s) to device`);
    }
  };

  return (
    <>
      {refreshing ? (
        <Spin
          indicator={
            <LoadingOutlined style={{ fontSize: 48, color: "#F7931A" }} spin />
          }
        />
      ) : null}
      {allEntries.length > 0 && (
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
            {savedCount} of {allEntries.length} saved to this device
          </Text>
          {missingLocally.length > 0 && (
            <Button
              icon={<DownloadOutlined />}
              loading={bulkSaving}
              onClick={handleBulkSave}
              size="small"
            >
              {bulkSaving
                ? `Saving ${bulkProgress.current}/${bulkProgress.total}...`
                : `Save All to Device (${missingLocally.length})`}
            </Button>
          )}
        </div>
      )}
      {[...formEvents.entries()]
        .sort(([, a], [, b]) => b.event.created_at - a.event.created_at)
        .map(([id, formMetadata]) => {
          const formId = formMetadata.event.tags.find(
            (tag: Tag) => tag[0] === "d",
          )?.[1];
          if (!formId) return null;

          const onDevice = isOnDevice(formMetadata.event.pubkey, formId);

          return (
            <FormEventCard
              event={formMetadata.event}
              key={formId}
              onDeleted={() =>
                formId && handleFormDeleted(formId, formMetadata.event.pubkey)
              }
              secretKey={formMetadata.secrets.secretKey}
              viewKey={formMetadata.secrets.viewKey}
              relay={formMetadata.relay}
              syncStatus={onDevice ? "synced" : "unsynced"}
              onSync={
                !onDevice
                  ? () => handleSaveToDevice(formMetadata, formId)
                  : undefined
              }
              syncTooltip="Save to this device"
              syncIcon={<DownloadOutlined />}
            />
          );
        })}
    </>
  );
};
