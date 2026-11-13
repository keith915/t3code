import { lookupUiChinese, type UiChineseLookup } from "./uiZh";

const TRANSLATABLE_ATTRIBUTES = [
  "aria-label",
  "aria-description",
  "aria-placeholder",
  "placeholder",
  "title",
  "alt",
] as const;

const SKIPPED_CONTENT_SELECTOR = [
  "script",
  "style",
  "code",
  "pre",
  "samp",
  "textarea",
  "[contenteditable]:not([contenteditable='false'])",
  "[data-i18n-skip]",
  ".chat-markdown",
  ".cm-editor",
  ".xterm",
  ".monaco-editor",
  ".CodeMirror",
  "[data-thread-find-ignore]",
].join(",");

interface TranslationRecord {
  readonly source: string;
  readonly translated: string;
}

/** Replaces exact UI copy while preserving the whitespace React renders around it. */
export function translateUiValue(
  value: string | null,
  lookup: UiChineseLookup = lookupUiChinese,
): string | undefined {
  if (!value) return undefined;
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(value);
  if (!match) return undefined;
  const [, leading = "", source = "", trailing = ""] = match;
  const translated = lookup(source);
  return translated === undefined ? undefined : `${leading}${translated}${trailing}`;
}

/**
 * Translates the rendered UI without instrumenting every component. Chat markdown, code,
 * editors and user input opt out through `data-i18n-skip` or the content selectors above.
 */
export function startUiDomLocalization(
  root: HTMLElement | Document,
  lookup: UiChineseLookup = lookupUiChinese,
): () => void {
  const scope = root instanceof Document ? root.body : root;
  if (!scope) return () => {};

  const textRecords = new Map<Text, TranslationRecord>();
  const attributeRecords = new Map<Element, Map<string, TranslationRecord>>();
  const pending = new Set<Node>();
  let queued = false;
  let disposed = false;

  const translateText = (node: Text): void => {
    if (node.parentElement?.closest(SKIPPED_CONTENT_SELECTOR)) return;
    const current = node.nodeValue;
    if (current === null) return;
    const previous = textRecords.get(node);
    if (previous && current === previous.translated && current !== previous.source) return;
    const translated = translateUiValue(current, lookup);
    if (translated === undefined) {
      textRecords.delete(node);
      return;
    }
    textRecords.set(node, { source: current, translated });
    if (translated !== current) node.nodeValue = translated;
  };

  const translateAttributes = (element: Element): void => {
    if (element.namespaceURI !== "http://www.w3.org/1999/xhtml") return;
    let records = attributeRecords.get(element);
    for (const attribute of TRANSLATABLE_ATTRIBUTES) {
      const current = element.getAttribute(attribute);
      if (current === null) continue;
      const previous = records?.get(attribute);
      if (previous && current === previous.translated && current !== previous.source) continue;
      const translated = translateUiValue(current, lookup);
      if (translated === undefined) {
        records?.delete(attribute);
        continue;
      }
      if (!records) {
        records = new Map();
        attributeRecords.set(element, records);
      }
      records.set(attribute, { source: current, translated });
      if (translated !== current) element.setAttribute(attribute, translated);
    }
  };

  const translateSubtree = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      translateText(node as Text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    translateAttributes(element);
    if (element.matches(SKIPPED_CONTENT_SELECTOR)) return;
    for (const child of element.childNodes) translateSubtree(child);
  };

  const flush = (): void => {
    queued = false;
    if (disposed) return;
    const nodes = [...pending];
    pending.clear();
    for (const node of nodes) translateSubtree(node);
  };

  const schedule = (node: Node): void => {
    pending.add(node);
    if (queued) return;
    queued = true;
    queueMicrotask(flush);
  };

  translateSubtree(scope);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) schedule(node);
      } else {
        schedule(mutation.target);
      }
    }
  });
  observer.observe(scope, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
  });

  return () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    pending.clear();
    for (const [node, record] of textRecords) {
      if (node.nodeValue === record.translated) node.nodeValue = record.source;
    }
    for (const [element, records] of attributeRecords) {
      for (const [attribute, record] of records) {
        if (element.getAttribute(attribute) === record.translated) {
          element.setAttribute(attribute, record.source);
        }
      }
    }
    textRecords.clear();
    attributeRecords.clear();
  };
}
