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

const pastelColors = [
  "#ffd6e8", // pastel pink
  "#d6f5d6", // pastel green
  "#d6e0f5", // pastel blue
  "#fff0b3", // pastel yellow
  "#f5d6d6", // pastel red-ish
];

// Flair box component
const Flair: React.FC<{
  color: string;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}> = ({ color, children, onClick, style }) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: color,
        borderRadius: 16,
        padding: "6px 12px",
        marginRight: 12,
        marginTop: 8,
        display: "inline-block",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        fontWeight: 500,
        paddingTop: 6,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

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
    console.log("User relays", useRelays);
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
      {formsReady.map(({ form, event }, index) => {
        const shortUrlColor = pastelColors[index % pastelColors.length];
        const expiresColor = pastelColors[(index + 1) % pastelColors.length];
        return (
          <Box key={form.id}>
            {event ? (
              <FormEventCard
                event={event}
                viewKey={form.viewKey}
                shortLink={`/i/${form.slug}`}
              />
            ) : (
              <Box sx={{ p: 2 }}>
                <Skeleton variant="rounded" height={140} />
              </Box>
            )}
            <Box
              sx={{
                mt: -1.5,
                display: "flex",
                gap: 1,
                pl: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Flair
                color={shortUrlColor}
                onClick={() =>
                  window.open(
                    `${window.location.origin}/i/${form.slug}`,
                    "_blank",
                  )
                }
                style={{ fontSize: 12, padding: "2px 8px" }}
              >
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                  sx={{ mr: 0.5, fontSize: 12 }}
                >
                  {t("dashboardCards.url")}:
                </Typography>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    fontSize: 12,
                    fontFamily: "monospace",
                    backgroundColor: "rgba(0,0,0,0.06)",
                    px: 0.5,
                    borderRadius: 0.5,
                  }}
                >
                  {`${window.location.origin}/i/${form.slug}`}
                </Typography>
              </Flair>
              <Flair
                color={expiresColor}
                style={{ fontSize: 12, padding: "2px 8px" }}
              >
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                  sx={{ mr: 0.5, fontSize: 12 }}
                >
                  {t("dashboardCards.urlExpiresOn")}:
                </Typography>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontSize: 12 }}
                >
                  {form.expirationDate
                    ? new Date(form.expirationDate).toLocaleDateString()
                    : t("dashboardCards.never")}
                </Typography>
              </Flair>
            </Box>
          </Box>
        );
      })}
    </>
  );
};
