import React, { useEffect, useMemo, useRef, useState } from "react";
import { Event, getPublicKey, nip19 } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils.js";
import { Box, Button, IconButton, Link, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTranslation } from "react-i18next";
import { Tag } from "../../../nostr/types";
import { FormRenderer } from "../../FormFillerNew/FormRenderer";
import {
  getInputsFromResponseEvent,
  buildResponseFormValues,
} from "../../../utils/ResponseUtils";
import { formatLocalizedDateTime } from "../../../i18n/format";
import { isMobile } from "../../../utils/utility";
import { FORMSTR_COLORS } from "../../../theme/muiTheme";

interface Respondent {
  pubkey: string;
  npub: string;
  createdAt: number;
  submissionsCount: number;
  processedInputs: Tag[];
}

interface ResponseNavigatorProps {
  formSpec: Tag[];
  responses: Event[];
  editKey?: string | null;
  formstrBranding?: boolean;
}

const shortNpub = (npub: string) =>
  `${npub.substring(0, 10)}…${npub.substring(npub.length - 5)}`;

export const ResponseNavigator: React.FC<ResponseNavigatorProps> = ({
  formSpec,
  responses,
  editKey,
  formstrBranding,
}) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Group responses per author, keeping the latest event per author.
  const respondents: Respondent[] = useMemo(() => {
    const byPubkey = new Map<string, Event[]>();
    responses.forEach((r) => {
      const existing = byPubkey.get(r.pubkey);
      if (existing) existing.push(r);
      else byPubkey.set(r.pubkey, [r]);
    });
    return Array.from(byPubkey.entries())
      .map(([pubkey, events]) => {
        const latest = [...events].sort(
          (a, b) => b.created_at - a.created_at,
        )[0];
        return {
          pubkey,
          npub: nip19.npubEncode(pubkey),
          createdAt: latest.created_at,
          submissionsCount: events.length,
          processedInputs: getInputsFromResponseEvent(latest, editKey),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [responses, editKey]);

  // Keep the selection in range as the list grows/shrinks.
  useEffect(() => {
    if (selectedIndex > respondents.length - 1) {
      setSelectedIndex(Math.max(0, respondents.length - 1));
    }
  }, [respondents.length, selectedIndex]);

  const selected = respondents[selectedIndex];

  const go = (delta: number) =>
    setSelectedIndex((i) =>
      Math.max(0, Math.min(respondents.length - 1, i + delta)),
    );

  // Arrow-key navigation (desktop): ↑/← previous, ↓/→ next; j/k as aliases.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "j") {
        e.preventDefault();
        go(1);
      } else if (
        e.key === "ArrowUp" ||
        e.key === "ArrowLeft" ||
        e.key === "k"
      ) {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [respondents.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) > 50) {
      go(delta < 0 ? 1 : -1);
    }
    touchStartX.current = null;
  };

  if (respondents.length === 0) {
    return (
      <Box sx={{ mt: 6, textAlign: "center" }}>
        <Typography color="text.secondary">
          {t("responses.noResponsesYet", "No responses yet")}
        </Typography>
      </Box>
    );
  }

  const formAuthorPubkey = editKey
    ? getPublicKey(hexToBytes(editKey))
    : undefined;

  const positionLabel = `${selectedIndex + 1} / ${respondents.length}`;

  const navControls = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        mb: 1.5,
      }}
    >
      <Button
        variant="outlined"
        startIcon={<ChevronLeftIcon />}
        disabled={selectedIndex === 0}
        onClick={() => go(-1)}
      >
        {t("common.actions.back", "Prev")}
      </Button>
      <Typography variant="body2" color="text.secondary">
        {positionLabel}
      </Typography>
      <Button
        variant="outlined"
        endIcon={<ChevronRightIcon />}
        disabled={selectedIndex >= respondents.length - 1}
        onClick={() => go(1)}
      >
        {t("common.actions.next", "Next")}
      </Button>
    </Box>
  );

  const detail = selected && (
    <>
      <Box sx={{ mb: 1 }}>
        <Link
          href={`https://njump.me/${selected.npub}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {shortNpub(selected.npub)}
        </Link>
        <Typography
          component="span"
          variant="body2"
          color="text.secondary"
          sx={{ ml: 1 }}
        >
          {formatLocalizedDateTime(selected.createdAt * 1000)}
          {selected.submissionsCount > 1
            ? ` · ${t("responses.submissions", "Submissions")}: ${
                selected.submissionsCount
              }`
            : ""}
        </Typography>
      </Box>
      {/* key remounts per respondent so the renderer re-seeds initialValues */}
      <FormRenderer
        key={selected.pubkey}
        formTemplate={formSpec}
        onInput={() => {}}
        disabled={true}
        readOnly={true}
        hideTitleImage={true}
        initialValues={buildResponseFormValues(selected.processedInputs)}
        formstrBranding={formstrBranding}
        formAuthorPubkey={formAuthorPubkey}
        formEditKey={editKey || undefined}
        uploaderPubkey={selected.pubkey}
      />
    </>
  );

  if (isMobile()) {
    const atStart = selectedIndex === 0;
    const atEnd = selectedIndex >= respondents.length - 1;

    const floatingButtonSx = {
      position: "fixed",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 1000,
      opacity: 0.92,
      boxShadow: 3,
      bgcolor: "background.paper",
    } as const;

    return (
      <Box
        // Leave room for the sticky bottom bar so the form's last field isn't covered.
        sx={{ pb: 11 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Box sx={{ textAlign: "center", mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {positionLabel}
          </Typography>
        </Box>
        <Box>{detail}</Box>

        {/* Floating side buttons — reachable by either thumb without scrolling. */}
        <IconButton
          aria-label={t("common.actions.back", "Prev")}
          disabled={atStart}
          onClick={() => go(-1)}
          sx={{ ...floatingButtonSx, left: 8 }}
        >
          <ChevronLeftIcon />
        </IconButton>
        <IconButton
          aria-label={t("common.actions.next", "Next")}
          disabled={atEnd}
          onClick={() => go(1)}
          sx={{ ...floatingButtonSx, right: 8 }}
        >
          <ChevronRightIcon />
        </IconButton>

        {/* Sticky bottom bar with full-width Prev/Next. */}
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.25,
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
            boxShadow: 3,
            zIndex: 1000,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ChevronLeftIcon />}
            disabled={atStart}
            onClick={() => go(-1)}
            sx={{ flex: 1 }}
          >
            {t("common.actions.back", "Prev")}
          </Button>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ minWidth: 56, textAlign: "center" }}
          >
            {positionLabel}
          </Typography>
          <Button
            variant="outlined"
            endIcon={<ChevronRightIcon />}
            disabled={atEnd}
            onClick={() => go(1)}
            sx={{ flex: 1 }}
          >
            {t("common.actions.next", "Next")}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 7 }}>
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          maxHeight: "70vh",
          overflowY: "auto",
          borderRight: 1,
          borderColor: "divider",
          pr: 1,
        }}
      >
        {respondents.map((r, i) => {
          const isActive = i === selectedIndex;
          return (
            <Box
              key={r.pubkey}
              onClick={() => setSelectedIndex(i)}
              sx={{
                p: "10px 12px",
                borderRadius: 2,
                cursor: "pointer",
                mb: 0.5,
                bgcolor: isActive ? FORMSTR_COLORS.primaryTint : "transparent",
                borderLeft: "3px solid",
                borderColor: isActive ? "primary.main" : "transparent",
              }}
            >
              <Box sx={{ fontWeight: isActive ? 600 : 400 }}>
                {shortNpub(r.npub)}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {formatLocalizedDateTime(r.createdAt * 1000)}
              </Typography>
              {r.submissionsCount > 1 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {t("responses.submissions", "Submissions")}:{" "}
                  {r.submissionsCount}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, maxHeight: "70vh", overflowY: "auto" }}>
        {navControls}
        {detail}
      </Box>
    </Box>
  );
};
