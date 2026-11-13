import { describe, expect, it } from "vite-plus/test";

import { translateUiValue } from "./domLocalization";
import en from "./translations/en.json";
import { createUiChineseLookup, UI_ZH } from "./uiZh";

const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);

describe("UI Chinese dictionary", () => {
  it("translates exact UI copy and preserves surrounding whitespace", () => {
    expect(translateUiValue("  Cancel\n")).toBe("  取消\n");
    expect(translateUiValue("Add project")).toBe("添加项目");
  });

  it("leaves unknown and empty copy untouched", () => {
    expect(translateUiValue("A project named Settings")).toBeUndefined();
    expect(translateUiValue("")).toBeUndefined();
    expect(translateUiValue(null)).toBeUndefined();
  });

  it("keeps template placeholders intact", () => {
    for (const [source, translated] of Object.entries(UI_ZH)) {
      expect(placeholders(translated)).toEqual(placeholders(source));
    }
  });

  it("merges settings translations from GT's runtime snapshot", () => {
    const hash = Object.entries(en).find(([, source]) => source === "Settings")?.[0];
    expect(hash).toBeDefined();
    expect(createUiChineseLookup({ [hash!]: "设置" })("Settings")).toBe("设置");
  });
});
