import type { ThemeConfig } from "antd";

/**
 * Formstr design tokens.
 * Single source of truth for brand colors — replace hardcoded hexes
 * (#FF6B00 / #FF2E00 / #FF5733 / rgb(255,42,0) / #F7931A) with these.
 */
export const FORMSTR_BRAND = {
  /** Mid-tone of the brand gradient — used for antd colorPrimary. */
  primary: "#FF4D00",
  /** Brand gradient used on primary buttons. */
  primaryGradient: "linear-gradient(180deg, #FF6B00 0%, #FF2E00 60.92%)",
} as const;

export const formstrTheme: ThemeConfig = {
  token: {
    colorPrimary: FORMSTR_BRAND.primary,
    colorInfo: FORMSTR_BRAND.primary,
    colorLink: FORMSTR_BRAND.primary,
    fontFamily: "'Anek Devanagari', sans-serif",
    borderRadius: 8,
    colorBgLayout: "#f5f5f5",
  },
  components: {
    Layout: {
      headerBg: "#ffffff",
      headerHeight: 64,
      headerPadding: "0 24px",
    },
    Menu: {
      itemSelectedColor: FORMSTR_BRAND.primary,
      horizontalItemSelectedColor: FORMSTR_BRAND.primary,
    },
    Button: {
      primaryShadow: "none",
    },
  },
};
