import { ConfigProvider } from "antd";
import React, { useEffect } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n, { getAntdLocaleForLanguage } from "../i18n";
import { antThemeConfig, applyThemeCssVariables } from "../theme/themeConfig";

const ThemedProviders = ({ children }: { children: React.ReactNode }) => {
  const { i18n: instance } = useTranslation();

  useEffect(() => {
    applyThemeCssVariables();
  }, []);

  return (
    <ConfigProvider
      theme={antThemeConfig}
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
