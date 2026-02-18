import { useEffect, useState } from "react";
import { useProfileContext } from "../../../hooks/useProfileContext";
import { Event } from "nostr-tools";
import { getDefaultRelays } from "../../../nostr/common";
import { Tag } from "../../../nostr/types";
import { FormEventCard } from "./FormEventCard";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { signerManager } from "../../../signer";
import { useMyForms } from "../../../provider/MyFormsProvider";

export const MyForms = () => {
  type FormEventMetadata = {
    event: Event;
    secrets: { secretKey: string; viewKey?: string };
    relay: string;
  };

  const { pubkey: userPub } = useProfileContext();
  const { formEvents, refreshing, deleteForm } = useMyForms();

  const handleFormDeleted = async (
    formId: string,
    extractedFormPubkey: string,
  ) => {
    deleteForm(formId, extractedFormPubkey);
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
      {[...formEvents.values()]
        .sort((a, b) => b.event.created_at - a.event.created_at)
        .map((formMetadata) => {
          const formId = formMetadata.event.tags.find(
            (tag: Tag) => tag[0] === "d",
          )?.[1];

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
            />
          );
        })}
    </>
  );
};
