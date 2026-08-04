import React, { useEffect, useRef, useState } from "react";
import { StoredForm } from "./types";
import axios from "../../../utils/axiosInstance";
import { FormEventCard } from "../FormCards/FormEventCard";
import { Box, Skeleton, Typography } from "@mui/material";
import { subscribe, type Subscription } from "../../../dataLayer";
import { Event } from "nostr-tools";
import { useProfileContext } from "../../../hooks/useProfileContext";
import { getDefaultRelays } from "../../../nostr/common";
import { useTranslation } from "react-i18next";

interface FormWithEvent {
  form: StoredForm;
  event: Event | null;
}

export const Purchases: React.FC = () => {
  const { t } = useTranslation();
  const [formsWithEvents, setFormsWithEvents] = useState<FormWithEvent[]>([]);
  const [nostrEvents, setNostrEvents] = useState<Event[]>([]);
  const { pubkey, userRelays } = useProfileContext();
  const subCloserRef = useRef<Subscription | null>(null);

  // Step 1: Fetch stored forms
  useEffect(() => {
    if (pubkey) {
      axios
        .get<StoredForm[]>("/api/forms", { params: { owner: pubkey } })
        .then((res) => {
          setFormsWithEvents(res.data.map((form) => ({ form, event: null })));
        })
        .catch((err) => console.error("Error fetching forms:", err));
    }
  }, [pubkey]);

  // Step 2: Fetch events from nostr for these slugs
  useEffect(() => {
    if (!formsWithEvents.length) return;
    const useRelays = userRelays.length !== 0 ? userRelays : getDefaultRelays();
    const filter = {
      kinds: [30168],
      authors: formsWithEvents.map(({ form }) => form.pubkey),
    };

    subCloserRef.current = subscribe(
      [filter],
      (event: Event) => {
        setNostrEvents((prev) => {
          const exists = prev.find((e) => e.id === event.id);
          return exists ? prev : [...prev, event];
        });
      },
      useRelays,
    );

    return () => {
      subCloserRef.current?.close();
    };
  }, [formsWithEvents]);

  // Step 3: Match events to their forms
  const formsReady = formsWithEvents.map(({ form }) => {
    const matchedEvent = nostrEvents.find((e) => e.pubkey === form.pubkey);
    return { form, event: matchedEvent || null };
  });
  if (formsReady.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ gridColumn: "1 / -1" }}>
        {t("dashboardCards.noPurchases")}
      </Typography>
    );
  }

  return (
    <>
      {formsReady.map(({ form, event }) => {
        return event ? (
          <FormEventCard
            key={form.id}
            event={event}
            viewKey={form.viewKey}
            shortLink={`/i/${form.slug}`}
            expirationDate={form.expirationDate || null}
          />
        ) : (
          <Box key={form.id} sx={{ p: 2 }}>
            <Skeleton variant="rounded" height={220} />
          </Box>
        );
      })}
    </>
  );
};
