import React, { useEffect, useMemo, useRef, useState } from "react";
import { Event, getPublicKey, nip19 } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";
import { Button, Empty, Form, Typography } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Tag } from "../../../nostr/types";
import { FormRenderer } from "../../FormFillerNew/FormRenderer";
import {
  getInputsFromResponseEvent,
  buildResponseFormValues,
} from "../../../utils/ResponseUtils";
import { formatLocalizedDateTime } from "../../../i18n/format";
import { isMobile } from "../../../utils/utility";

const { Text } = Typography;

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
  const [form] = Form.useForm();
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
          (a, b) => b.created_at - a.created_at
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

  // Push the selected response into the (read-only) form.
  useEffect(() => {
    if (!selected) return;
    form.resetFields();
    form.setFieldsValue(buildResponseFormValues(selected.processedInputs));
  }, [selectedIndex, selected, form]);

  const go = (delta: number) =>
    setSelectedIndex((i) =>
      Math.max(0, Math.min(respondents.length - 1, i + delta))
    );

  // Arrow-key navigation (desktop): ↑/← previous, ↓/→ next; j/k as aliases.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable
      ) {
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
      <Empty
        description={t("responses.noResponsesYet", "No responses yet")}
        style={{ marginTop: 48 }}
      />
    );
  }

  const formAuthorPubkey = editKey
    ? getPublicKey(hexToBytes(editKey))
    : undefined;

  const positionLabel = `${selectedIndex + 1} / ${respondents.length}`;

  const navControls = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <Button
        icon={<LeftOutlined />}
        disabled={selectedIndex === 0}
        onClick={() => go(-1)}
      >
        {t("common.actions.back", "Prev")}
      </Button>
      <Text type="secondary" style={{ fontSize: 13 }}>
        {positionLabel}
      </Text>
      <Button
        disabled={selectedIndex >= respondents.length - 1}
        onClick={() => go(1)}
      >
        {t("common.actions.next", "Next")} <RightOutlined />
      </Button>
    </div>
  );

  const detail = selected && (
    <>
      <div style={{ marginBottom: 8 }}>
        <a
          href={`https://njump.me/${selected.npub}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {shortNpub(selected.npub)}
        </a>
        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
          {formatLocalizedDateTime(selected.createdAt * 1000)}
          {selected.submissionsCount > 1
            ? ` · ${t("responses.submissions", "Submissions")}: ${selected.submissionsCount}`
            : ""}
        </Text>
      </div>
      <FormRenderer
        key={selected.pubkey}
        formTemplate={formSpec}
        form={form}
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

    const floatingButtonStyle: React.CSSProperties = {
      position: "fixed",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 1000,
      opacity: 0.92,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.18)",
    };

    return (
      <div
        // Leave room for the sticky bottom bar so the form's last field isn't covered.
        style={{ paddingBottom: 88 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {positionLabel}
          </Text>
        </div>
        <div>{detail}</div>

        {/* Floating side buttons — reachable by either thumb without scrolling. */}
        <Button
          shape="circle"
          size="large"
          aria-label={t("common.actions.back", "Prev")}
          icon={<LeftOutlined />}
          disabled={atStart}
          onClick={() => go(-1)}
          style={{ ...floatingButtonStyle, left: 8 }}
        />
        <Button
          shape="circle"
          size="large"
          aria-label={t("common.actions.next", "Next")}
          icon={<RightOutlined />}
          disabled={atEnd}
          onClick={() => go(1)}
          style={{ ...floatingButtonStyle, right: 8 }}
        />

        {/* Sticky bottom bar with full-width Prev/Next. */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "#fff",
            borderTop: "1px solid #f0f0f0",
            boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.06)",
            zIndex: 1000,
          }}
        >
          <Button
            icon={<LeftOutlined />}
            disabled={atStart}
            onClick={() => go(-1)}
            style={{ flex: 1 }}
          >
            {t("common.actions.back", "Prev")}
          </Button>
          <Text
            type="secondary"
            style={{ fontSize: 13, minWidth: 56, textAlign: "center" }}
          >
            {positionLabel}
          </Text>
          <Button
            disabled={atEnd}
            onClick={() => go(1)}
            style={{ flex: 1 }}
          >
            {t("common.actions.next", "Next")} <RightOutlined />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 60 }}>
      <div
        style={{
          width: 280,
          flexShrink: 0,
          maxHeight: "70vh",
          overflowY: "auto",
          borderRight: "1px solid #f0f0f0",
          paddingRight: 8,
        }}
      >
        {respondents.map((r, i) => {
          const isActive = i === selectedIndex;
          return (
            <div
              key={r.pubkey}
              onClick={() => setSelectedIndex(i)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 4,
                background: isActive ? "#fff1ec" : "transparent",
                borderLeft: isActive
                  ? "3px solid #ff5733"
                  : "3px solid transparent",
              }}
            >
              <div style={{ fontWeight: isActive ? 600 : 400 }}>
                {shortNpub(r.npub)}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatLocalizedDateTime(r.createdAt * 1000)}
              </Text>
              {r.submissionsCount > 1 && (
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                  {t("responses.submissions", "Submissions")}: {r.submissionsCount}
                </Text>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, minWidth: 0, maxHeight: "70vh", overflowY: "auto" }}>
        {navControls}
        {detail}
      </div>
    </div>
  );
};
