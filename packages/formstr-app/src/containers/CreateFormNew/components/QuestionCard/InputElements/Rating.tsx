import React, { useEffect, useRef, useState } from "react";

interface RatingProps {
  initialValue?: number;
  maxStars?: number;
  onChange: (value: number) => void;
}

export const Rating: React.FC<RatingProps> = ({
  initialValue = 0,
  maxStars = 5,
  onChange,
}) => {
  const [value, setValue] = useState(initialValue);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const touchTimer = useRef<number | null>(null);
  const touchUnlocked = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clampedMax = Math.max(3, Math.min(maxStars, 10));
  const active = value;
  const minValue = 0.5;

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
    onChange(nextValue);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPointerDown(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setFromPosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown) return;
    setFromPosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPointerDown(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchUnlocked.current = false;
    touchTimer.current = window.setTimeout(() => {
      touchUnlocked.current = true;
      navigator.vibrate?.(50);
      const touch = e.touches[0];
      if (touch) setFromPosition(touch.clientX);
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchUnlocked.current) return;
    const touch = e.touches[0];
    if (touch) setFromPosition(touch.clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
    if (!touchUnlocked.current) {
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
    const adjusted = Math.max(minValue, Math.min(roundToStep(nextValue), clampedMax));
    setValue(adjusted);
    onChange(adjusted);
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
          const gradientId = `rating-preview-${n}`;

          return (
            <div
              key={n}
              onClick={() => handleClick(n)}
              style={{ padding: 1, cursor: "pointer" }}
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <span style={{ minWidth: 52, textAlign: "right", fontSize: 12 }}>
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  );
};