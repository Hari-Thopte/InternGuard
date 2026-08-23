import { useSyncExternalStore } from "react";
import { z } from "zod";
import type { DocumentReport } from "./types";

const KEY = "ig-document-history-v1";
const EVENT = "ig-document-history-updated";
const EMPTY: DocumentReport[] = [];
let cachedRaw: string | null | undefined;
let cachedReports = EMPTY;

const riskLevel = z.enum(["low", "caution", "high"]);
const categoryScores = z.object({
  issuer: z.number().min(0).max(100),
  content: z.number().min(0).max(100),
  metadata: z.number().min(0).max(100),
  integrity: z.number().min(0).max(100),
  verification: z.number().min(0).max(100),
});
const reportSchema = z.object({
  kind: z.literal("document-report"),
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  pageCount: z.number().int().min(1).max(12),
  documentType: z.string(),
  riskLevel,
  overallScore: z.number().min(0).max(100),
  verdict: z.string(),
  categoryScores,
  extracted: z.object({
    organization: z.string(),
    candidateName: z.string(),
    documentId: z.string(),
    amounts: z.array(z.string()).default([]),
    dates: z.array(z.string()),
    emails: z.array(z.string()),
    urls: z.array(z.string()),
    qrCodes: z.array(z.string()).default([]),
  }),
  domainComparison: z
    .object({
      emailDomains: z.array(z.string()),
      websiteDomains: z.array(z.string()),
      status: z.enum(["aligned", "mismatch", "unverifiable"]),
      explanation: z.string(),
    })
    .default({
      emailDomains: [],
      websiteDomains: [],
      status: "unverifiable",
      explanation: "Not enough domain information was available to compare.",
    }),
  metadata: z.record(z.string()),
  signatureStatus: z.enum(["not-detected", "present-unverified"]),
  findings: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      explanation: z.string(),
      source: z.enum(["file", "ocr", "metadata", "content", "verification"]),
      category: z.enum([
        "issuer",
        "content",
        "metadata",
        "integrity",
        "verification",
      ]),
      status: z.enum(["pass", "info", "warning"]),
      weight: z.number().min(0),
      evidence: z.string().optional(),
    }),
  ),
  recommendations: z.array(z.string()),
  limitations: z.array(z.string()),
});

export function parseDocumentHistory(raw: string | null): DocumentReport[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const valid = parsed.flatMap((item) => {
      const result = reportSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
    return valid.length ? valid : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function readDocumentHistory(): DocumentReport[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cachedRaw) return cachedReports;
    cachedRaw = raw;
    cachedReports = parseDocumentHistory(raw);
    return cachedReports;
  } catch {
    return EMPTY;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useDocumentHistory() {
  return useSyncExternalStore(subscribe, readDocumentHistory, () => EMPTY);
}

export function saveDocumentReport(report: DocumentReport) {
  try {
    const validated = reportSchema.parse(report);
    const next = [
      validated,
      ...readDocumentHistory().filter(
        (item) => item.id !== validated.id && item.sha256 !== validated.sha256,
      ),
    ].slice(0, 25);
    localStorage.setItem(KEY, JSON.stringify(next));
    cachedRaw = undefined;
    window.dispatchEvent(new CustomEvent(EVENT));
    return true;
  } catch {
    return false;
  }
}

export function deleteDocumentReport(id: string) {
  try {
    const next = readDocumentHistory().filter((item) => item.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
    cachedRaw = undefined;
    window.dispatchEvent(new CustomEvent(EVENT));
    return true;
  } catch {
    return false;
  }
}

export function clearDocumentHistory() {
  try {
    localStorage.removeItem(KEY);
    cachedRaw = undefined;
    window.dispatchEvent(new CustomEvent(EVENT));
    return true;
  } catch {
    return false;
  }
}
