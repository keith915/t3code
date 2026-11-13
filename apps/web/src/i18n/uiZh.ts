import en from "./translations/en.json";
import manualZh from "./ui-zh.json";

/** Exact English UI copy to Simplified Chinese. User-generated text never belongs here. */
export const UI_ZH: Readonly<Record<string, string>> = manualZh;

export type UiChineseLookup = (source: string) => string | undefined;

/** Manual copy wins; GT's loaded hashes fill in settings strings if that catalog is unavailable. */
export function createUiChineseLookup(
  settingsTranslations: Readonly<Record<string, unknown>> = {},
): UiChineseLookup {
  const entries = new Map(Object.entries(UI_ZH));
  for (const [hash, source] of Object.entries(en)) {
    const translated = settingsTranslations[hash];
    if (typeof translated === "string" && translated !== source && !entries.has(source)) {
      entries.set(source, translated);
    }
  }
  return (source) => {
    const translated = entries.get(source);
    return translated === undefined || translated === source ? undefined : translated;
  };
}

export const lookupUiChinese = createUiChineseLookup();
