import React, { useState } from "react";

interface RatingFillerProps {
  defaultValue?: number;
  onChange: (value: number, message?: string) => void;
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
  const active = hovered || defaultValue || 0;

  const handleSelect = (n: number) => {
    onChange(n);
  };

  const clampedMax = Math.max(3, Math.min(maxStars, 10));

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div role="radiogroup" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {Array.from({ length: clampedMax }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === defaultValue}
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