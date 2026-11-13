import { initializeGTSPA } from "gt-react";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./locales";

const TRANSLATION_LOADERS: Readonly<Record<string, () => Promise<{ default: unknown }>>> = {
  de: () => import("./translations/de.json"),
  es: () => import("./translations/es.json"),
  fr: () => import("./translations/fr.json"),
  ja: () => import("./translations/ja.json"),
  ko: () => import("./translations/ko.json"),
  "pt-BR": () => import("./translations/pt-BR.json"),
  ru: () => import("./translations/ru.json"),
  zh: () => import("./translations/zh.json"),
};

// English is the source text, so it never loads a chunk.
async function loadTranslations(locale: string): Promise<unknown> {
  if (locale === DEFAULT_LOCALE) return {};
  const load = TRANSLATION_LOADERS[locale];
  return load ? (await load()).default : {};
}

/** Sets up GT's singletons. `onLocaleRequest` receives GT's own locale changes. */
export function initializeI18n(onLocaleRequest: (locale: string) => void): void {
  void initializeGTSPA({
    defaultLocale: DEFAULT_LOCALE,
    locales: [...SUPPORTED_LOCALES],
    locale: DEFAULT_LOCALE,
    loadTranslations,
    _reload: (state) => onLocaleRequest(state.locale),
  });
}
