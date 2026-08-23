import { describe, expect, it } from "vitest";
import { analyzeDocument, type DocumentWorkerResult } from "./documentEngine";
import { analyzeHeuristically } from "./heuristicEngine";
import { createDashboardRecords } from "./dashboardRecords";

describe("unified dashboard records", () => {
  it("combines opportunity and document reports with useful context", () => {
    const opportunity = analyzeHeuristically(
      "Pay USD 500 registration fee immediately to recruiter@gmail.com.",
    );
    const worker: DocumentWorkerResult = {
      text: "Offer Letter. Organization: ApexNova Technologies. Pay AED 1,000 registration fee within 30 minutes.",
      pageCount: 1,
      metadata: {},
      signatureFields: 0,
      usedOcr: false,
      qrCodes: [],
    };
    const document = analyzeDocument({
      ...worker,
      fileName: "offer.pdf",
      mimeType: "application/pdf",
      sha256: "a".repeat(64),
    });
    const records = createDashboardRecords([opportunity], [document]);
    expect(records).toHaveLength(2);
    expect(records.find((item) => item.kind === "document")).toMatchObject({
      sourceType: "document",
      organization: "ApexNova Technologies",
      fileName: "offer.pdf",
      amounts: ["AED 1,000"],
    });
    expect(records.every((item) => item.reasons.length > 0)).toBe(true);
  });

  it("cleans and deduplicates legacy monetary values before rendering", () => {
    const opportunity = analyzeHeuristically(
      "Pay INR 599 as a registration fee.",
    );
    opportunity.extracted.monetaryMentions = [
      "rs.,",
      "₹599",
      "₹599",
      "₹10,000",
    ];

    const [record] = createDashboardRecords([opportunity], []);

    expect(record.amounts).toEqual(["₹599", "₹10,000"]);
  });
});
