import { createTheme } from "@mui/material/styles";

/**
 * Formstr design tokens for the MUI rewrite (branch ui-rewrite-mui).
 * Single source of truth — replaces the duplicate antd ConfigProviders.
 * Values mirror docs/ui-rewrite/mockups/00-design-tokens.svg.
 */
export const FORMSTR_COLORS = {
  /** Canonical brand orange (mid-tone of the brand gradient). */
  primary: "#FF4D00",
  primaryHover: "#E84400",
  primaryTint: "#FFF1EC",
  ink: "#1A1A1A",
  secondary: "#6B6B6B",
  muted: "#A3A3A3",
  border: "#E8E8E8",
  pageBg: "#FAFAFA",
} as const;

const SYSTEM_FONT_STACK = [
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  '"Noto Sans"',
  "sans-serif",
].join(", ");

/**
 * Display font for headings ONLY. Anek Devanagari's line box is ~170% of em
 * (vs ~115% for system fonts); using it for UI text made text sit off-center
 * in every compact control — the root cause of the recurring alignment bugs.
 */
const DISPLAY_FONT_STACK = ['"Anek Devanagari"', SYSTEM_FONT_STACK].join(", ");

const displayStyle = {
  fontFamily: DISPLAY_FONT_STACK,
  fontWeight: 600,
  color: FORMSTR_COLORS.ink,
} as const;

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: FORMSTR_COLORS.primary,
      dark: FORMSTR_COLORS.primaryHover,
      contrastText: "#FFFFFF",
    },
    text: {
      primary: FORMSTR_COLORS.ink,
      secondary: FORMSTR_COLORS.secondary,
      disabled: FORMSTR_COLORS.muted,
    },
    divider: FORMSTR_COLORS.border,
    background: {
      default: FORMSTR_COLORS.pageBg,
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: SYSTEM_FONT_STACK,
    h1: { ...displayStyle, fontSize: "1.75rem" },
    h2: { ...displayStyle, fontSize: "1.375rem" },
    h3: { ...displayStyle, fontSize: "1.25rem" },
    h4: { ...displayStyle, fontSize: "1.125rem" },
    h5: { ...displayStyle, fontSize: "1rem" },
    h6: { fontWeight: 600, fontSize: "0.9375rem" },
    body1: { fontSize: "0.9375rem" },
    body2: { fontSize: "0.8125rem", color: FORMSTR_COLORS.secondary },
    button: { textTransform: "none", fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: FORMSTR_COLORS.pageBg },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { boxShadow: "none", ":hover": { boxShadow: "none" } },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        // Border-first cards — no shadows on surfaces (see tokens mockup).
        root: {
          border: `1px solid ${FORMSTR_COLORS.border}`,
          borderRadius: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 12 } },
    },
    MuiMenu: {
      styleOverrides: { paper: { borderRadius: 12 } },
    },
    MuiPopover: {
      styleOverrides: { paper: { borderRadius: 12 } },
    },
  },
});

export default muiTheme;
