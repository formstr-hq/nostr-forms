import { useEffect, useMemo, useRef, useState } from "react";
import type { Event, Filter } from "@formstr/local-relay";
import { getDataLayer } from "./index";

interface UseEventsOptions {
  /** Pure local-store read — the worker won't sync upstream. Default false. */
  localOnly?: boolean;
  /** Skip observing entirely (e.g. missing inputs). Yields an empty, non-loading result. */
  enabled?: boolean;
}

interface UseEventsResult {
  events: Event[];
  /** True until the first local EOSE for the current filters. */
  loading: boolean;
}

/**
 * Reactive standing interest over the DataLayer: replays cache, EOSEs, then
 * live-tails. Returns the deduped, newest-first event set and a `loading` flag
 * that clears on the first EOSE. Re-subscribes when the filters change.
 *
 * Filters are compared by value (JSON), so callers don't need to memoise them.
 */
export function useEvents(
  filters: Filter[],
  options: UseEventsOptions = {},
): UseEventsResult {
  const { localOnly = false, enabled = true } = options;
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setEvents([]);
    const byId = new Map<string, Event>();
    const flush = () =>
      setEvents(
        Array.from(byId.values()).sort((a, b) => b.created_at - a.created_at),
      );
    const handle = getDataLayer().observe(
      JSON.parse(filterKey) as Filter[],
      {
        onEvent: (event) => {
          byId.set(event.id, event);
          flush();
        },
        onEose: () => setLoading(false),
      },
      { localOnly },
    );
    return () => handle.unobserve();
    // filterKey encodes filters by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, localOnly, enabled]);

  return { events, loading };
}

/**
 * Reactive single-event read from the local store. Resolves from cache and
 * updates if the worker enriches the store later (referenced events, profiles).
 * Never triggers a fetch on its own.
 */
export function useEvent(id: string | undefined): Event | null {
  const [event, setEvent] = useState<Event | null>(null);
  const idRef = useRef(id);
  idRef.current = id;

  useEffect(() => {
    if (!id) {
      setEvent(null);
      return;
    }
    let active = true;
    getDataLayer()
      .fetchById(id)
      .then((e) => {
        if (active && idRef.current === id) setEvent(e);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return event;
}
