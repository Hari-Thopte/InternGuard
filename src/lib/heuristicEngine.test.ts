import { describe, expect, it } from "vitest";
import { analyzeHeuristically } from "./heuristicEngine";
import { normalizeMonetaryMentions } from "./amounts";
describe("heuristic engine integrity", () => {
  it("distinguishes candidate-paid fees from stipend", () => {
    expect(
      analyzeHeuristically(
        "Selected interns must pay INR 4,000 registration fee immediately before joining.",
      ).categoryScores.payment,
    ).toBeGreaterThan(0);
    expect(
      analyzeHeuristically(
        "Engineering internship with INR 4,000 monthly stipend through the official careers page.",
      ).categoryScores.payment,
    ).toBe(0);
    expect(
      analyzeHeuristically(
        "The company will pay you USD 1,000 per month as an internship stipend.",
      ).evidenceList.map((item) => item.flagType),
    ).not.toContain("upfront-payment");
  });
  it("does not treat a normal QR link as an unofficial payment", () => {
    const report = analyzeHeuristically(
      "Scan the QR code to open the official certificate verification webpage and review the internship credential.",
    );
    expect(report.evidenceList.map((item) => item.flagType)).not.toContain(
      "unofficial-payment",
    );
  });
  it("still detects a personal UPI QR payment instruction", () => {
    const report = analyzeHeuristically(
      "Scan this personal UPI QR to reserve your internship seat before onboarding closes.",
    );
    expect(report.evidenceList.map((item) => item.flagType)).toContain(
      "unofficial-payment",
    );
  });
  it("understands explicit negation for new payment rules", () => {
    const report = analyzeHeuristically(
      "No equipment purchase is required. Training is free and optional for every selected intern.",
    );
    expect(report.evidenceList.map((item) => item.flagType)).not.toEqual(
      expect.arrayContaining([
        "required-equipment-purchase",
        "mandatory-paid-training",
      ]),
    );
  });
  it("does not let a nearby no-fee sentence hide an equipment purchase", () => {
    const report = analyzeHeuristically(
      "No registration fee is charged. Purchase the required laptop equipment from our vendor before joining.",
    );
    expect(report.evidenceList.map((item) => item.flagType)).toContain(
      "required-equipment-purchase",
    );
  });
  it.each([
    [
      "interview-fee",
      "Pay an interview processing fee of USD 25 before your interview slot is released.",
    ],
    [
      "required-equipment-purchase",
      "You must purchase the required laptop equipment from our approved vendor before joining.",
    ],
    [
      "mandatory-paid-training",
      "Mandatory paid training costs EUR 80 and must be completed before onboarding.",
    ],
  ])("detects the %s recruitment charge pattern", (flagType, text) => {
    const report = analyzeHeuristically(text);
    expect(report.evidenceList.map((item) => item.flagType)).toContain(
      flagType,
    );
    expect(report.categoryScores.payment).toBeGreaterThan(0);
  });
  it("never claims confirmed fraud", () => {
    const report = analyzeHeuristically(
      "Pay ₹5000 by personal UPI immediately. Send Aadhaar and PAN card to recruiter@gmail.com within 30 minutes.",
    );
    expect(JSON.stringify(report)).not.toMatch(
      /confirmed (?:fraud|scam)|fraudulent company/i,
    );
    expect(report.verdict).toContain("Verify Before Proceeding");
    expect(report.riskLevel).toBe("high");
  });
  it("keeps low findings non-conclusive", () => {
    expect(
      analyzeHeuristically(
        "Software internship on the official company careers page. No payment is required at any stage.",
      ).verdict,
    ).toMatch(/Not Proof of Legitimacy/i);
  });
  it("does not let an unrelated no-payment sentence hide a later fee", () => {
    expect(
      analyzeHeuristically(
        "The stipend has no payment conditions. Later, send INR 5,000 registration fee to confirm your internship seat immediately.",
      ).categoryScores.payment,
    ).toBeGreaterThan(0);
  });
  it("flags hidden destinations and chat-only recruitment", () => {
    const report = analyzeHeuristically(
      "Contact our recruiter for the interview only on Telegram and open https://bit.ly/example-internship now.",
    );
    expect(report.evidenceList.map((item) => item.flagType)).toEqual(
      expect.arrayContaining(["chat-only-recruitment", "shortened-link"]),
    );
  });
  it("creates collision-resistant report identifiers", () => {
    const text =
      "Software internship listed on the official employer careers page with a normal interview process.";
    expect(analyzeHeuristically(text).id).not.toBe(
      analyzeHeuristically(text).id,
    );
  });
  it("returns complete evidence sentences instead of dangling excerpts", () => {
    const report = analyzeHeuristically(
      "Welcome to the internship program. Pay INR 4,000 registration fee before joining. Orientation follows next week.",
    );
    expect(report.evidenceList[0].sourceQuote).toBe(
      "Pay INR 4,000 registration fee before joining.",
    );
  });
  it("normalizes, deduplicates, and rejects broken monetary fragments", () => {
    const report = analyzeHeuristically(
      "Marketing internship stipend INR 10,000 per month. The page repeats Rs. 10,000 monthly and contains OCR fragments Rs., Rs. 6, and ₹2. A ₹599 fee is mentioned.",
    );
    expect(report.extracted.monetaryMentions).toEqual([
      "₹10,000 / month",
      "₹599",
    ]);
    expect(
      normalizeMonetaryMentions(["rs.,", "₹599", "₹10,000", "rs. 6", "₹599"]),
    ).toEqual(["₹599", "₹10,000"]);
  });
  it("separates verified source facts from inferred context", () => {
    const report = analyzeHeuristically(
      "Company: Acme Labs. Software developer internship using React and Python.",
      "url",
      "https://careers.example.com/jobs/intern",
      { pageTitle: "Software Intern | Acme Labs" },
    );
    expect(report.sourceContext).toMatchObject({
      sourceKind: "public webpage",
      verifiedSource: "careers.example.com",
      pageTitle: "Software Intern | Acme Labs",
      organizationClue: "Acme Labs",
      industry: "Software & technology",
      inferenceConfidence: "medium",
    });
  });
});
