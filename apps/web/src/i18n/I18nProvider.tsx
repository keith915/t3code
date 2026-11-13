import { GTProvider } from "gt-react";
import { useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";

import { startUiDomLocalization } from "./domLocalization";
import { getI18nSnapshot, persistGTLocale, subscribeI18n } from "./runtime";
import { createUiChineseLookup } from "./uiZh";

const reloadToSetting = (state: { readonly locale: string }) => persistGTLocale(state.locale);

export function I18nProvider({ children }: { readonly children: ReactNode }) {
  const { locale, translations } = useSyncExternalStore(subscribeI18n, getI18nSnapshot);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- installs the Chinese DOM translator while the locale is active
  useLayoutEffect(
    () =>
      locale === "zh"
        ? startUiDomLocalization(document, createUiChineseLookup(translations[locale]))
        : undefined,
    [locale, translations],
  );
  return (
    <GTProvider locale={locale} translations={translations} _reload={reloadToSetting}>
      {children}
    </GTProvider>
  );
}
