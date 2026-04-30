import React, { useState } from "react";

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
  const [hovered, setHovered] = useState<number>(0);
  const clampedMax = Math.max(3, Math.min(maxStars, 10));

  const normalizeStoredRating = (value: string): number => {
    if (!value) return 0;

    const parseStars = (storedValue: number): number => {
      if (!Number.isFinite(storedValue)) return 0;
      if (storedValue >= 0 && storedValue <= 1) {
        return Math.round(storedValue * clampedMax);
      }
      return Math.round(storedValue);
    };

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        if (typeof parsed.normalizedValue === "number") {
          return parseStars(Math.max(0, Math.min(parsed.normalizedValue, 1)));
        }
        if (typeof parsed.value === "number") {
          if (typeof parsed.maxStars === "number" && parsed.maxStars > 0) {
            return Math.round((parsed.value / parsed.maxStars) * clampedMax);
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

  const displayValue = normalizeStoredRating(defaultValue || "");
  const active = hovered || displayValue || 0;

  const handleSelect = (n: number) => {
    const ratingData = {
      normalizedValue: n / clampedMax,
    };
    onChange(JSON.stringify(ratingData));
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div role="radiogroup" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {Array.from({ length: clampedMax }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === displayValue}
            aria-label={`${n} star`}
            disabled={disabled}
            onClick={() => handleSelect(n)}
            onMouseEnter={() => !disabled && setHovered(n)}
            onMouseLeave={() => !disabled && setHovered(0)}
            style={{
              background: "none",
              border: "none",
              cursor: disabled ? "default" : "pointer",
              padding: 1,
              transition: "transform 0.1s",
            }}
          >
            <svg width={24} height={24} viewBox="0 0 28 28">
              <polygon
                points="14,3 17.5,10.5 26,11.5 20,17.5 21.5,26 14,22 6.5,26 8,17.5 2,11.5 10.5,10.5"
                fill={n <= active ? "#EF9F27" : "none"}
                stroke={n <= active ? "#EF9F27" : "#B4B2A9"}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};