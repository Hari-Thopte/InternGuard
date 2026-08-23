import { z } from "zod";
import { useSyncExternalStore } from "react";
import type { RiskReport } from "./types";

const KEY = "ig-history-v2";
const LEGACY_KEY = "ig-history";
export const HISTORY_EVENT = "ig-history-updated";
const EMPTY_HISTORY: RiskReport[] = [];
let cachedRaw: string | null | undefined;
let cachedReports = EMPTY_HISTORY;

const riskLevel = z.enum(["low", "caution", "high"]);
const category = z.enum([
  "recruiter",
  "company",
  "payment",
  "document",
  "urgency",
]);
const reportSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  sourceType: z.enum(["text", "image", "url"]),
  sourceLabel: z.string(),
  riskLevel,
  verdict: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  overallScore: z.number().min(0).max(100),
  categoryScores: z.object({
    recruiter: z.number(),
    company: z.number(),
    payment: z.number(),
    document: z.number(),
    urgency: z.number(),
  }),
  extracted: z.record(z.union([z.string(), z.array(z.string())])),
  sourceContext: z
    .object({
      sourceKind: z.enum([
        "pasted text",
        "uploaded screenshot",
        "public webpage",
      ]),
      verifiedSource: z.string(),
      pageTitle: z.string().optional(),
      organizationClue: z.string().optional(),
      industry: z.string().optional(),
      inferenceConfidence: z.enum(["low", "medium"]).optional(),
      basis: z.array(z.string()),
    })
    .optional(),
  evidenceList: z.array(
    z.object({
      id: z.string(),
      sourceQuote: z.string(),
      flagType: z.string(),
      category,
      severity: riskLevel,
      explanation: z.string(),
      ruleWeight: z.number().min(0).optional(),
    }),
  ),
  recommendedActions: z.array(z.string()),
  limitations: z.array(z.string()),
  reportingLinks: z.array(
    z.object({ label: z.string(), href: z.string(), description: z.string() }),
  ),
});

export function parseScanHistory(raw: string | null): RiskReport[] {
  if (!raw) return EMPTY_HISTORY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_HISTORY;
    const valid = parsed.flatMap((item) => {
      const result = reportSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
    return valid.length ? valid : EMPTY_HISTORY;
  } catch {
    return EMPTY_HISTORY;
  }
}

export function readScanHistory(): RiskReport[] {
  if (typeof window === "undefined") return EMPTY_HISTORY;
  try {
    const current = localStorage.getItem(KEY);
    if (current) {
      if (current === cachedRaw) return cachedReports;
      cachedRaw = current;
      cachedReports = parseScanHistory(current);
      return cachedReports;
    }
    const migrated = parseScanHistory(localStorage.getItem(LEGACY_KEY));
    if (migrated.length)
      try {
        localStorage.setItem(KEY, JSON.stringify(migrated));
      } catch {
        // The legacy reports are still readable even when storage is full.
      }
    cachedRaw = migrated.length ? JSON.stringify(migrated) : null;
    cachedReports = migrated.length ? migrated : EMPTY_HISTORY;
    return cachedReports;
  } catch {
    return EMPTY_HISTORY;
  }
}

function subscribeToHistory(onChange: () => void) {
  window.addEventListener(HISTORY_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(HISTORY_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useScanHistory() {
  return useSyncExternalStore(
    subscribeToHistory,
    readScanHistory,
    () => EMPTY_HISTORY,
  );
}

export function saveScanReport(report: RiskReport) {
  try {
    const validated = reportSchema.parse(report);
    const next = [
      validated,
      ...readScanHistory().filter((item) => item.id !== validated.id),
    ].slice(0, 50);
    localStorage.setItem(KEY, JSON.stringify(next));
    cachedRaw = undefined;
    window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function deleteScanReport(id: string) {
  try {
    const next = readScanHistory().filter((item) => item.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
    cachedRaw = undefined;
    window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function clearScanHistory() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
    cachedRaw = undefined;
    window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function getScanReport(id: string) {
  return readScanHistory().find((item) => item.id === id) ?? null;
}
