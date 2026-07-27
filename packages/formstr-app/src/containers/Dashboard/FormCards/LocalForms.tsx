import { useEffect, useState } from "react";
import { ILocalForm } from "../../CreateFormNew/providers/FormBuilder/typeDefs";
import { LocalFormCard } from "./LocalFormCard";
import { subscribe, type Subscription } from "../../../dataLayer";
import { getDefaultRelays } from "../../../nostr/common";
import { Event } from "nostr-tools";
import { FormEventCard } from "./FormEventCard";

interface LocaLFormsProps {
  localForms: ILocalForm[];
  onDeleted: (localForm: ILocalForm) => void;
}

export const LocalForms: React.FC<LocaLFormsProps> = ({
  localForms,
  onDeleted,
}) => {
  const [eventMap, setEventMap] = useState<Map<string, Event>>(new Map());
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
    let closer: Subscription;
    const initialize = () => {
      let pubkeys = localForms.map((l) => l.publicKey);
      let dTags = localForms.map((f) => f.formId);
      let filter = {
        kinds: [30168],
        "#d": dTags,
        authors: pubkeys,
      };
      closer = subscribe([filter], onFormEvent, getDefaultRelays());
    };
    initialize();
    return () => {
      if (closer) closer.close();
    };
  }, []);

  return (
    <>
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
          if (formEvent)
            return (
              <FormEventCard
                key={localForm.key}
                event={formEvent}
                relay={localForm.relay}
                secretKey={localForm.privateKey}
                viewKey={localForm.viewKey}
                onDeleted={() => {
                  onDeleted(localForm);
                }}
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
              />
            );
        })}
    </>
  );
};
