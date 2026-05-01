import type { ThemeConfig } from "antd";

export const appThemeVariables = {
  colorPrimary: "#ff5733",
  colorSecondary: "#ff8a66",
  colorPrimaryGradientStart: "#ff6b00",
  colorPrimaryGradientEnd: "#ff2e00",
  colorSuccess: "#52c41a",
  colorWarning: "#faad14",
  colorError: "#ff4d4f",
  colorInfo: "#1677ff",
  colorSuccessActive: "#389e0d",
  colorErrorActive: "#cf1322",
  colorBgSubtle: "#fafafa",
  colorOverlayStrong: "rgba(0, 0, 0, 0.7)",
  colorOverlaySoft: "rgba(0, 0, 0, 0.3)",
  colorOverlayLight: "rgba(255, 255, 255, 0.2)",
  colorShadowSoft: "0 1px 3px rgba(0, 0, 0, 0.1)",
  colorTextBase: "rgba(0, 0, 0, 0.88)",
  colorTextDefault: "#000000",
  colorTextMuted: "rgba(0, 0, 0, 0.45)",
  colorTextSecondary: "rgba(0, 0, 0, 0.65)",
  colorBorder: "#d9d9d9",
  colorBorderSoft: "#f0f0f0",
  colorBgCanvas: "#dedede",
  colorBgSurface: "#ffffff",
  headerShadow:
    "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
  borderRadiusSm: 4,
  borderRadiusMd: 8,
  borderRadiusLg: 12,
  borderRadiusXl: 16,
} as const;

export const antThemeConfig: ThemeConfig = {
  token: {
    fontFamily: "Anek Devanagari, ui-serif, Inter, ui-sans-serif",
    colorPrimary: appThemeVariables.colorPrimary,
    colorLink: appThemeVariables.colorPrimary,
    colorSuccess: appThemeVariables.colorSuccess,
    colorWarning: appThemeVariables.colorWarning,
    colorError: appThemeVariables.colorError,
    colorInfo: appThemeVariables.colorInfo,
    borderRadius: appThemeVariables.borderRadiusMd,
    borderRadiusLG: appThemeVariables.borderRadiusLg,
  },
};

const appCssVariableMap: Record<string, string> = {
  "--app-color-primary": appThemeVariables.colorPrimary,
  "--app-color-secondary": appThemeVariables.colorSecondary,
  "--app-color-primary-gradient-start": appThemeVariables.colorPrimaryGradientStart,
  "--app-color-primary-gradient-end": appThemeVariables.colorPrimaryGradientEnd,
  "--app-color-success": appThemeVariables.colorSuccess,
  "--app-color-warning": appThemeVariables.colorWarning,
  "--app-color-error": appThemeVariables.colorError,
  "--app-color-info": appThemeVariables.colorInfo,
  "--app-color-success-active": appThemeVariables.colorSuccessActive,
  "--app-color-error-active": appThemeVariables.colorErrorActive,
  "--app-color-bg-subtle": appThemeVariables.colorBgSubtle,
  "--app-color-overlay-strong": appThemeVariables.colorOverlayStrong,
  "--app-color-overlay-soft": appThemeVariables.colorOverlaySoft,
  "--app-color-overlay-light": appThemeVariables.colorOverlayLight,
  "--app-shadow-soft": appThemeVariables.colorShadowSoft,
  "--app-color-text-base": appThemeVariables.colorTextBase,
  "--app-color-text-default": appThemeVariables.colorTextDefault,
  "--app-color-text-muted": appThemeVariables.colorTextMuted,
  "--app-color-text-secondary": appThemeVariables.colorTextSecondary,
  "--app-color-border": appThemeVariables.colorBorder,
  "--app-color-border-soft": appThemeVariables.colorBorderSoft,
  "--app-color-bg-canvas": appThemeVariables.colorBgCanvas,
  "--app-color-bg-surface": appThemeVariables.colorBgSurface,
  "--app-shadow-header": appThemeVariables.headerShadow,
  "--app-border-radius-sm": `${appThemeVariables.borderRadiusSm}px`,
  "--app-border-radius-md": `${appThemeVariables.borderRadiusMd}px`,
  "--app-border-radius-lg": `${appThemeVariables.borderRadiusLg}px`,
  "--app-border-radius-xl": `${appThemeVariables.borderRadiusXl}px`,
};

export const applyThemeCssVariables = () => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  for (const [variableName, value] of Object.entries(appCssVariableMap)) {
    root.style.setProperty(variableName, value);
  }
};
