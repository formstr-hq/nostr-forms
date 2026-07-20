import { ConfigProvider } from "antd";
import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import React from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n, { getAntdLocaleForLanguage } from "../i18n";
import { formstrTheme } from "../theme";
import { muiTheme } from "../theme/muiTheme";
import { SnackbarProvider } from "./SnackbarProvider";

const ThemedProviders = ({ children }: { children: React.ReactNode }) => {
  const { i18n: instance } = useTranslation();

  // MUI wraps antd during the rewrite (branch ui-rewrite-mui): new components
  // take tokens from muiTheme; antd keeps rendering legacy surfaces until each
  // phase ports them. antd's ConfigProvider is removed in Phase 6.
  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <SnackbarProvider>
        <ConfigProvider
          theme={formstrTheme}
          locale={getAntdLocaleForLanguage(instance.language)}
        >
          {children}
        </ConfigProvider>
      </SnackbarProvider>
    </MuiThemeProvider>
  );
};

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemedProviders>{children}</ThemedProviders>
    </I18nextProvider>
  );
};

export default AppProviders;
