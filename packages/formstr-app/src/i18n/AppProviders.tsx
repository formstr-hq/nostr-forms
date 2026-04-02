import { ConfigProvider } from "antd";
import React from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n, { getAntdLocaleForLanguage } from ".";

const theme = {
  token: {
    fontFamily: "Anek Devanagari, ui-serif, Inter, ui-sans-serif",
    colorPrimary: "#FF5733",
    colorLink: "#FF5733",
  },
};

const ThemedProviders = ({ children }: { children: React.ReactNode }) => {
  const { i18n: instance } = useTranslation();

  return (
    <ConfigProvider
      theme={theme}
      locale={getAntdLocaleForLanguage(instance.language)}
    >
      {children}
    </ConfigProvider>
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
