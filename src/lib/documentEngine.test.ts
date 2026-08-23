import { describe, expect, it } from "vitest";
import { analyzeDocument, type DocumentWorkerResult } from "./documentEngine";

const worker: DocumentWorkerResult = {
  text: "",
  pageCount: 1,
  metadata: {},
  signatureFields: 0,
  usedOcr: false,
  qrCodes: [],
};

function report(
  text: string,
  metadata: Record<string, string> = {},
  overrides: Partial<DocumentWorkerResult> = {},
) {
  return analyzeDocument({
    ...worker,
    ...overrides,
    text,
    metadata,
    fileName: "certificate.pdf",
    mimeType: "application/pdf",
    sha256: "a".repeat(64),
  });
}

describe("document trust engine", () => {
  it("extracts labelled identity details without declaring authenticity", () => {
    const result = report(
      "Certificate of Internship. Organization: Orion Systems India Pvt. Candidate Name: Ishan Kumar. Certificate ID: ORI-2026-1204. Issued August 20, 2026. Contact hr@orionsystems.in. Verify at https://orionsystems.in/verify/ORI-2026-1204.",
    );
    expect(result.documentType).toBe("Certificate");
    expect(result.extracted.organization).toContain("Orion Systems India Pvt");
    expect(result.extracted.candidateName).toContain("Ishan Kumar");
    expect(result.extracted.documentId).toBe("ORI-2026-1204");
    expect(result.riskLevel).toBe("low");
  });

  it("flags a free-mail issuer contact and a missing issuer", () => {
    const result = report(
      "Certificate of Internship awarded to Ishan Kumar. Certificate ID: CERT-8821. Contact verificationdesk@gmail.com for immediate verification. This certificate recognizes completion of the internship program.",
    );
    expect(result.riskLevel).toBe("caution");
    expect(result.findings.map((finding) => finding.title)).toEqual(
      expect.arrayContaining([
        "Free-mail contact requires verification",
        "Issuer name not confidently detected",
      ]),
    );
  });

  it("detects mismatched contact and verification domains", () => {
    const result = report(
      "Certificate of Internship. Organization: Acme Learning Labs. Candidate Name: Ishan Kumar. Document No: ACM-1002. Contact hr@acme.example. Website listed in document: https://different.example/certificate/ACM-1002.",
    );
    expect(
      result.findings.some(
        (finding) => finding.title === "Contact and website domains differ",
      ),
    ).toBe(true);
    expect(result.domainComparison.status).toBe("mismatch");
  });

  it("compares aligned domains and includes QR evidence safely", () => {
    const result = report(
      "Certificate of Internship\nIssued by: Acme Learning Pvt. Ltd.\nAwarded to Ishan Kumar\nIssued date: 20 August 2026\nContact: verify@acme.example\nOfficial website: https://verify.acme.example/certificate/AC-1",
      {},
      { qrCodes: ["https://verify.acme.example/certificate/AC-1"] },
    );
    expect(result.domainComparison.status).toBe("aligned");
    expect(result.extracted.organization).toBe("Acme Learning Pvt. Ltd.");
    expect(result.extracted.candidateName).toBe("Ishan Kumar");
    expect(result.extracted.dates).toContain("20 August 2026");
    expect(result.extracted.qrCodes).toEqual([
      "https://verify.acme.example/certificate/AC-1",
    ]);
  });

  it("extracts a candidate from common certificate wording", () => {
    const result = report(
      "Certificate of Completion\nThis is to certify that Aisha Rahman has completed the internship.\nIssuer: Northstar Labs\nReference: NS-2026-44",
    );
    expect(result.extracted.candidateName).toBe("Aisha Rahman");
    expect(result.extracted.documentId).toBe("NS-2026-44");
  });

  it("does not mistake a company-name label for the candidate", () => {
    const result = report(
      "Offer Letter\nCompany Name: Meridian Works\nReference: MW-2026-91\nThe selected candidate will be contacted separately.",
    );
    expect(result.extracted.organization).toBe("Meridian Works");
    expect(result.extracted.candidateName).toBe("Not confidently detected");
  });

  it("treats future dates and editing metadata as review signals", () => {
    const result = report(
      "Certificate. Organization: Acme Labs. Candidate Name: Ishan Kumar. Document No: ACM-1002. Issued January 12, 2099.",
      { creator: "Adobe Photoshop" },
    );
    expect(result.categoryScores.content).toBeGreaterThan(0);
    expect(result.categoryScores.metadata).toBeGreaterThan(0);
  });

  it("never describes its result as proof of fraud or authenticity", () => {
    const result = report(
      "Certificate of Internship. Contact issuer@gmail.com immediately to verify this document and its recipient details.",
    );
    expect(JSON.stringify(result)).not.toMatch(
      /confirmed (?:fraud|forgery)|proven authentic|genuine certificate/i,
    );
    expect(result.limitations[0]).toMatch(/cannot establish authenticity/i);
  });

  it("applies opportunity-risk rules to extracted offer-letter content", () => {
    const result = report(
      "FINAL INTERNSHIP SELECTION NOTICE. Organization: ApexNova Technologies. Email: apexnova.internship.hr@gmail.com. Guaranteed stipend I45,000 per month. A refundable registration fee of I3,999 must be paid before activation. A security deposit of I2,500 is required. Payment must be completed within 60 minutes. Send Aadhaar card, PAN card, bank account details, and UPI ID.",
    );
    expect(result.riskLevel).toBe("high");
    expect(result.overallScore).toBeGreaterThanOrEqual(55);
    expect(result.extracted.amounts).toEqual([
      "₹45,000 / month",
      "₹3,999",
      "₹2,500",
    ]);
    expect(result.findings.map((finding) => finding.title)).toEqual(
      expect.arrayContaining([
        "Upfront Payment",
        "Unofficial Payment",
        "Artificial Urgency",
        "Sensitive Documents",
      ]),
    );
  });

  it("keeps a normal foreign-currency stipend separate from candidate fees", () => {
    const result = report(
      "Offer Letter. Organization: Example Technologies. Candidate Name: Ishan Kumar. Reference No: EX-2026-101. Contact hr@example.org. The internship provides a USD 1,000 monthly stipend. No registration fee or candidate deposit is required.",
    );
    expect(result.riskLevel).toBe("low");
    expect(result.findings.map((finding) => finding.title)).not.toContain(
      "Upfront Payment",
    );
  });
});
