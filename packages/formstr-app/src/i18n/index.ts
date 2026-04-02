import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enUS from "antd/locale/en_US";
import resources from "./resources/en";
import { getItem, LOCAL_STORAGE_KEYS, setItem } from "../utils/localStorage";

export interface SupportedLocale {
  code: string;
  label: string;
  antdLocale: typeof enUS;
}

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  {
    code: "en",
    label: resources.common.labels.english,
    antdLocale: enUS,
  },
];

export const DEFAULT_LOCALE = "en";

export const normalizeLocale = (locale?: string | null) => {
  if (!locale) return DEFAULT_LOCALE;
  const normalized = locale.toLowerCase().split("-")[0];
  return (
    SUPPORTED_LOCALES.find((item) => item.code === normalized)?.code ||
    DEFAULT_LOCALE
  );
};

export const getStoredLocale = () =>
  getItem<string>(LOCAL_STORAGE_KEYS.APP_LOCALE, { parseAsJson: false });

export const saveLocalePreference = (locale: string) =>
  setItem(LOCAL_STORAGE_KEYS.APP_LOCALE, normalizeLocale(locale), {
    parseAsJson: false,
  });

export const resolveAppLocale = () => {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }
  const storedLocale = getStoredLocale();
  if (storedLocale) {
    return normalizeLocale(storedLocale);
  }
  const navigatorLocale =
    window.navigator.languages?.[0] || window.navigator.language;
  return normalizeLocale(navigatorLocale);
};

export const getAntdLocaleForLanguage = (language?: string) => {
  const normalized = normalizeLocale(language);
  return (
    SUPPORTED_LOCALES.find((item) => item.code === normalized)?.antdLocale ||
    enUS
  );
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: resources },
    },
    lng: resolveAppLocale(),
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
  });
}

export default i18n;
