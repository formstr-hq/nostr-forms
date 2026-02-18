import React, { useEffect, useRef, useState } from "react";
import { StoredForm } from "./types";
import axios from "../../../utils/axiosInstance";
import { FormEventCard } from "../FormCards/FormEventCard";
import { Typography, Skeleton } from "antd";
import { pool } from "../../../pool";
import { SubCloser } from "nostr-tools/abstract-pool";
import { Event } from "nostr-tools";
import { useProfileContext } from "../../../hooks/useProfileContext";
import { getDefaultRelays } from "../../../nostr/common";

const { Text } = Typography;

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
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)", // subtle shadow
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Purchases: React.FC = () => {
  const [formsWithEvents, setFormsWithEvents] = useState<FormWithEvent[]>([]);
  const [nostrEvents, setNostrEvents] = useState<Event[]>([]);
  const { pubkey, userRelays } = useProfileContext();
  const subCloserRef = useRef<SubCloser | null>(null);

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
    const filters = formsWithEvents.map(({ form }) => ({
      kinds: [30168],
      authors: [form.pubkey],
    }));

    console.log("Final filters are", filters, pool);
    subCloserRef.current = pool.subscribeMany(useRelays, filters, {
      onevent: (event: Event) => {
        console.log("GOT EVENT", event);
        setNostrEvents((prev) => {
          const exists = prev.find((e) => e.id === event.id);
          return exists ? prev : [...prev, event];
        });
      },
      onclose() {
        subCloserRef.current?.close();
      },
    });

    return () => {
      subCloserRef.current?.close();
    };
  }, [formsWithEvents]);

  // Step 3: Match events to their forms
  const formsReady = formsWithEvents.map(({ form }) => {
    const matchedEvent = nostrEvents.find((e) => e.pubkey === form.pubkey);
    return { form, event: matchedEvent || null };
  });
  if (formsReady.length === 0) return <Text>No purchases found.</Text>;

  return (
    <div
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginLeft: 10,
      }}
    >
      {formsReady.map(({ form, event }, index) => {
        const shortUrlColor = pastelColors[index % pastelColors.length];
        const expiresColor = pastelColors[(index + 1) % pastelColors.length];
        return (
          <div key={form.id} style={{ marginLeft: 10, marginRight: 10 }}>
            <div style={{ position: "relative" }}>
              {event ? (
                <FormEventCard
                  event={event}
                  viewKey={form.viewKey}
                  shortLink={`/i/${form.slug}`}
                />
              ) : (
                <div style={{ width: "80%", padding: 16 }}>
                  <Skeleton active />
                </div>
              )}

              <div
                style={{
                  marginTop: -12, // pulls the flairs up, overlapping card bottom a bit
                  display: "flex",
                  gap: 8,
                  paddingLeft: 12, // align with card content
                  flexWrap: "wrap",
                }}
              >
                <Flair
                  color={shortUrlColor}
                  onClick={() =>
                    window.open(
                      `${window.location.origin}/i/${form.slug}`,
                      "_blank"
                    )
                  }
                  style={{ fontSize: 12, padding: "2px 8px" }}
                >
                  <Text
                    type="secondary"
                    style={{ marginRight: 4, fontSize: 12 }}
                  >
                    URL:
                  </Text>
                  <Text code style={{ fontSize: 12 }}>
                    {`${window.location.origin}/i/${form.slug}`}
                  </Text>
                </Flair>
                <Flair
                  color={expiresColor}
                  style={{ fontSize: 12, padding: "2px 8px" }}
                >
                  <Text
                    type="secondary"
                    style={{ marginRight: 4, fontSize: 12 }}
                  >
                    URL expires on:
                  </Text>
                  <Text style={{ fontSize: 12 }}>
                    {form.expirationDate
                      ? new Date(form.expirationDate).toLocaleDateString()
                      : "Never"}
                  </Text>
                </Flair>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
