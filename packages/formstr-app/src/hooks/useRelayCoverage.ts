import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Event } from "nostr-tools";
import { normalizeURL } from "nostr-tools/utils";
import { customPublish, getDefaultRelays } from "../nostr/common";
import {
  checkRelayCoverage,
  RelayCoverageResult,
} from "../nostr/relayCoverage";

const dedupeNormalize = (urls: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  urls.forEach((raw) => {
    if (!raw) return;
    let normalized: string;
    try {
      normalized = normalizeURL(raw);
    } catch {
      return;
    }
    if (!seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  });
  return out;
};

export interface UseRelayCoverage {
  relays: string[];
  results: RelayCoverageResult[];
  foundCount: number;
  total: number;
  loading: boolean;
  broadcasting: boolean;
  recheck: () => void;
  addRelay: (url: string) => boolean;
  broadcast: (event: Event, targets?: string[]) => Promise<void>;
}

/**
 * Tracks which relays serve a given form and exposes actions to re-check
 * coverage, add ad-hoc relays, and broadcast the (already signed) form event to
 * relays. Candidate relays default to the form's own relay tags plus the app
 * defaults; callers may add custom relays at runtime.
 */
export const useRelayCoverage = (
  pubKey: string,
  formId: string,
  formRelays: string[],
): UseRelayCoverage => {
  const baseRelays = useMemo(
    () => dedupeNormalize([...formRelays, ...getDefaultRelays()]),
    // formRelays is a fresh array each render; key on its contents instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formRelays.join(",")],
  );

  const [relays, setRelays] = useState<string[]>(baseRelays);
  const [results, setResults] = useState<Record<string, RelayCoverageResult>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const startedRef = useRef(false);

  const check = useCallback(
    async (targets: string[]) => {
      if (!pubKey || !formId || targets.length === 0) return;
      setLoading(true);
      setResults((prev) => {
        const next = { ...prev };
        targets.forEach((url) => {
          next[url] = { url, status: "checking" };
        });
        return next;
      });
      await checkRelayCoverage(pubKey, formId, targets, (result) => {
        setResults((prev) => ({ ...prev, [result.url]: result }));
      });
      setLoading(false);
    },
    [pubKey, formId],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    check(baseRelays);
  }, [baseRelays, check]);

  const recheck = useCallback(() => {
    check(relays);
  }, [check, relays]);

  const addRelay = useCallback(
    (url: string): boolean => {
      let normalized: string;
      try {
        normalized = normalizeURL(url);
      } catch {
        return false;
      }
      if (!/^wss?:\/\//.test(normalized)) return false;
      if (relays.includes(normalized)) return false;
      setRelays((prev) => [...prev, normalized]);
      check([normalized]);
      return true;
    },
    [relays, check],
  );

  const broadcast = useCallback(
    async (event: Event, targets?: string[]) => {
      const urls = targets && targets.length ? targets : relays;
      if (urls.length === 0) return;
      setBroadcasting(true);
      setResults((prev) => {
        const next = { ...prev };
        urls.forEach((url) => {
          if (next[url]?.status !== "found") {
            next[url] = { url, status: "checking" };
          }
        });
        return next;
      });
      await Promise.allSettled(
        customPublish(urls, event, (acceptedUrl) => {
          const normalized = normalizeURL(acceptedUrl);
          setResults((prev) => ({
            ...prev,
            [normalized]: {
              url: normalized,
              status: "found",
              createdAt: event.created_at,
            },
          }));
        }),
      );
      // Anything still "checking" was rejected by its relay.
      setResults((prev) => {
        const next = { ...prev };
        urls.forEach((url) => {
          if (next[url]?.status === "checking") {
            next[url] = { url, status: "not-found" };
          }
        });
        return next;
      });
      setBroadcasting(false);
    },
    [relays],
  );

  const resultList = useMemo(
    () =>
      relays.map(
        (url) =>
          results[url] || { url, status: "checking" as RelayCoverageResult["status"] },
      ),
    [relays, results],
  );
  const foundCount = resultList.filter((r) => r.status === "found").length;

  return {
    relays,
    results: resultList,
    foundCount,
    total: relays.length,
    loading,
    broadcasting,
    recheck,
    addRelay,
    broadcast,
  };
};
