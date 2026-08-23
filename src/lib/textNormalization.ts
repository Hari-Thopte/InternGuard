import { normalizeCurrencyText } from "./amounts";

/** Conservative cleanup for PDF extraction and OCR without rewriting meaning. */
export function normalizeEvidenceText(text: string) {
  return normalizeCurrencyText(
    text
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
      .replace(/\u00ad/g, "")
      .replace(/([A-Za-z])-[ \t]*\r?\n[ \t]*([a-z])/g, "$1$2")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .trim(),
  );
}

export function flattenEvidenceText(text: string) {
  return normalizeEvidenceText(text).replace(/\s+/g, " ").trim();
}
