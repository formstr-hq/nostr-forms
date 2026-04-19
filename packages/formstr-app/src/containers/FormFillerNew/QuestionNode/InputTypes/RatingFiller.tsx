import React, { useState } from "react";

interface RatingFillerProps {
  defaultValue?: number;
  onChange: (value: number, message?: string) => void;
  disabled?: boolean;
}

export const RatingFiller: React.FC<RatingFillerProps> = ({
  defaultValue,
  onChange,
  disabled = false,
}) => {
  const [hovered, setHovered] = useState<number>(0);
  const active = hovered || defaultValue || 0;

  const handleSelect = (n: number) => {
    onChange(n);
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div role="radiogroup" style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
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
              padding: 2,
              transition: "transform 0.1s",
            }}
          >
            <svg width={32} height={32} viewBox="0 0 28 28">
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