import { describe, expect, it } from "vitest";
import { analyzeDocument } from "./documentEngine";
import { parseDocumentHistory } from "./documentHistoryStore";
import { analyzeHeuristically } from "./heuristicEngine";
import { parseScanHistory } from "./historyStore";

describe("local history recovery", () => {
  it("keeps valid opportunity reports when another entry is corrupted", () => {
    const valid = analyzeHeuristically(
      "Software internship on the official company careers page with no candidate payment required.",
    );
    expect(parseScanHistory(JSON.stringify([{ broken: true }, valid]))).toEqual(
      [valid],
    );
  });

  it("keeps valid document reports when another entry is corrupted", () => {
    const valid = analyzeDocument({
      text: "Certificate of Internship\nIssuer: Acme Labs\nCandidate: Ishan Kumar\nReference: AC-2026-55",
      pageCount: 1,
      metadata: {},
      signatureFields: 0,
      usedOcr: false,
      qrCodes: [],
      fileName: "certificate.pdf",
      mimeType: "application/pdf",
      sha256: "a".repeat(64),
    });
    expect(
      parseDocumentHistory(JSON.stringify([valid, { broken: true }])),
    ).toEqual([valid]);
  });

  it("returns an empty stable result for malformed JSON", () => {
    expect(parseScanHistory("not-json")).toEqual([]);
    expect(parseDocumentHistory("{}")).toEqual([]);
  });
});
