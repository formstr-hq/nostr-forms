import React, { useEffect, useRef, useState } from "react";

interface RatingFillerProps {
  defaultValue?: string;
  onChange: (value: string, message?: string) => void;
  disabled?: boolean;
  maxStars?: number;
}

export const RatingFiller: React.FC<RatingFillerProps> = ({
  defaultValue,
  onChange,
  disabled = false,
  maxStars = 5,
}) => {
  const [isPointerDown, setIsPointerDown] = useState(false);
  const touchTimer = useRef<number | null>(null);
  const touchUnlocked = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // When interacting we keep a sensible minimum of 3 stars, but when simply
  // displaying a submitted rating we honour the form's actual maxStars.
  const clampedMax = Math.max(disabled ? 1 : 3, Math.min(maxStars, 10));
  const minValue = 0.5;

  const normalizeStoredRating = (value: string): number => {
    if (!value) return 0;

    const parseStars = (storedValue: number) => {
      if (!Number.isFinite(storedValue)) return 0;
      if (storedValue >= 0 && storedValue <= 1) {
        return Math.round(storedValue * clampedMax * 10) / 10;
      }
      return Math.round(storedValue * 10) / 10;
    };

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        if (typeof parsed.normalizedValue === "number") {
          return parseStars(Math.max(0, Math.min(parsed.normalizedValue, 1)));
        }
        if (typeof parsed.value === "number") {
          if (typeof parsed.maxStars === "number" && parsed.maxStars > 0) {
            return Math.round((parsed.value / parsed.maxStars) * clampedMax * 10) / 10;
          }
          return parseStars(parsed.value);
        }
      }
    } catch (e) {
      // Fall through to numeric fallback.
    }

    const numeric = parseFloat(value);
    return parseStars(numeric);
  };

  const initialValue = normalizeStoredRating(defaultValue || "");
  const [value, setValue] = useState<number>(initialValue);
  const active = value || 0;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const roundToStep = (v: number) => Math.round(v * 10) / 10;

  const setFromPosition = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    let nextValue = (x / rect.width) * clampedMax;
    nextValue = roundToStep(nextValue);
    if (nextValue < minValue) nextValue = minValue;
    if (nextValue > clampedMax) nextValue = clampedMax;
    setValue(nextValue);
    onChange(JSON.stringify({ normalizedValue: Math.max(0, Math.min(nextValue / clampedMax, 1)) }));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsPointerDown(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setFromPosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown || disabled) return;
    setFromPosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsPointerDown(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    touchUnlocked.current = false;
    touchTimer.current = window.setTimeout(() => {
      touchUnlocked.current = true;
      navigator.vibrate?.(50);
      const touch = e.touches[0];
      if (touch) setFromPosition(touch.clientX);
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchUnlocked.current || disabled) return;
    const touch = e.touches[0];
    if (touch) setFromPosition(touch.clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
    if (!touchUnlocked.current && !disabled) {
      const touch = e.changedTouches?.[0];
      if (touch) setFromPosition(touch.clientX);
    }
    touchUnlocked.current = false;
  };

  const getFillPercent = (starIndex: number) => {
    const fill = active - (starIndex - 1);
    return Math.max(0, Math.min(1, fill));
  };

  const handleClick = (nextValue: number) => {
    if (disabled) return;
    const adjusted = Math.max(minValue, Math.min(roundToStep(nextValue), clampedMax));
    setValue(adjusted);
    onChange(JSON.stringify({ normalizedValue: Math.max(0, Math.min(adjusted / clampedMax, 1)) }));
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ display: "inline-flex", gap: 4, flexWrap: "wrap", touchAction: "none", userSelect: "none" }}
      >
        {Array.from({ length: clampedMax }, (_, i) => {
          const n = i + 1;
          const fillPercent = getFillPercent(n) * 100;
          const gradientId = `rating-filler-${n}`;

          return (
            <div
              key={n}
              onClick={() => handleClick(n)}
              style={{ padding: 1, cursor: disabled ? "default" : "pointer" }}
            >
              <svg width={24} height={24} viewBox="0 0 28 28">
                <defs>
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset={`${fillPercent}%`} stopColor="#EF9F27" />
                    <stop offset={`${fillPercent}%`} stopColor="transparent" />
                  </linearGradient>
                </defs>
                <polygon
                  points="14,3 17.5,10.5 26,11.5 20,17.5 21.5,26 14,22 6.5,26 8,17.5 2,11.5 10.5,10.5"
                  fill={fillPercent > 0 ? `url(#${gradientId})` : "none"}
                  stroke={n <= active ? "#EF9F27" : "#B4B2A9"}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          );
        })}
      </div>
      {!disabled && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#6b6b6b" }}>Hold to rate</div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <span style={{ minWidth: 52, textAlign: "left", fontSize: 12 }}>
          {value.toFixed(1)} / {clampedMax}
        </span>
      </div>
    </div>
  );
};