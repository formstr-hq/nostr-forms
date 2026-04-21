import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enUS from "antd/locale/en_US";
import hiIN from "antd/locale/hi_IN";
import { getItem, LOCAL_STORAGE_KEYS, setItem } from "../utils/localStorage";

type TranslationResources = typeof import("./resources/en").default;

export interface SupportedLocale {
  code: string;
  label: string;
  antdLocale: typeof enUS;
}

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  {
    code: "en",
    label: "English",
    antdLocale: enUS,
  },
  {
    code: "hi",
    label: "हिंदी",
    antdLocale: hiIN,
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

const LOCALE_LOADERS: Record<
  string,
  () => Promise<{ default: TranslationResources }>
> = {
  en: () => import("./resources/en"),
  hi: () => import("./resources/hi"),
};

const loadLocaleResources = async (locale: string) => {
  const normalized = normalizeLocale(locale);
  const loader = LOCALE_LOADERS[normalized] || LOCALE_LOADERS[DEFAULT_LOCALE];
  const module = await loader();

  const resources: Record<string, { translation: TranslationResources }> = {
    [normalized]: { translation: module.default },
  };

  if (normalized !== DEFAULT_LOCALE) {
    const fallbackModule = await LOCALE_LOADERS[DEFAULT_LOCALE]();
    resources[DEFAULT_LOCALE] = { translation: fallbackModule.default };
  }

  return {
    locale: normalized,
    resources,
  };
};

const registerLocaleResources = (
  resources: Record<string, { translation: TranslationResources }>,
) => {
  Object.entries(resources).forEach(([locale, bundle]) => {
    i18n.addResourceBundle(locale, "translation", bundle.translation, true, true);
  });
};

let initPromise: Promise<typeof i18n> | null = null;

export const initI18n = async () => {
  if (i18n.isInitialized) {
    return i18n;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const { locale, resources } = await loadLocaleResources(resolveAppLocale());

    await i18n.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: DEFAULT_LOCALE,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      returnNull: false,
    });

    return i18n;
  })();

  return initPromise;
};

export const changeAppLanguage = async (locale: string) => {
  const normalized = normalizeLocale(locale);

  await initI18n();

  const { resources } = await loadLocaleResources(normalized);
  registerLocaleResources(resources);
  saveLocalePreference(normalized);
  await i18n.changeLanguage(normalized);

  return normalized;
};

export default i18n;
