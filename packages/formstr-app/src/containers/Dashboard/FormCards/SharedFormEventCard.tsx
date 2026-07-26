import { useEffect, useState } from "react";
import { Event } from "nostr-tools";
import { FormEventCard } from "./FormEventCard";
import { fetchKeys } from "../../../utils/formUtils";
import { Tag } from "../../../nostr/types";

interface SharedFormEventCardProps {
  event: Event;
  userPubkey: string;
}

/**
 * Wraps FormEventCard for the "Shared with me" tab. Forms are shared via
 * gift-wrapped access grants (see nostr/accessControl.ts) that may carry an
 * `EditAccess` (signing key) and/or `ViewAccess` (view key). We resolve those
 * keys here and hand them to FormEventCard: passing `secretKey` is what unlocks
 * the Edit option, so a form shared with edit access becomes editable from the
 * shared tab.
 */
export const SharedFormEventCard: React.FC<SharedFormEventCardProps> = ({
  event,
  userPubkey,
}) => {
  const [secretKey, setSecretKey] = useState<string | undefined>(undefined);
  const [viewKey, setViewKey] = useState<string | null>(null);

  const formId = event.tags.find((tag: Tag) => tag[0] === "d")?.[1];

  useEffect(() => {
    // Resolve the gift-wrapped access grant for this form regardless of whether
    // the form body is encrypted. The EditAccess (signing) key is what unlocks
    // editing, and it can be granted for PUBLIC forms too (content === "") — so
    // we must not skip the lookup just because there's no view key to fetch.
    if (!formId || !userPubkey) return;
    let cancelled = false;
    (async () => {
      const keys = await fetchKeys(event.pubkey, formId, userPubkey);
      if (cancelled || !keys) return;
      const editKey = keys.find((k) => k[0] === "EditAccess")?.[1];
      const view = keys.find((k) => k[0] === "ViewAccess")?.[1];
      if (editKey) setSecretKey(editKey);
      if (view) setViewKey(view);
    })();
    return () => {
      cancelled = true;
    };
  }, [event.pubkey, formId, userPubkey]);

  return (
    <FormEventCard event={event} secretKey={secretKey} viewKey={viewKey} />
  );
};
