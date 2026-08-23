import { describe, expect, it } from "vitest";
import {
  normalizeCurrencyText,
  normalizeMonetaryMentions,
} from "./amounts";
import { analyzeHeuristically } from "./heuristicEngine";

describe("multi-currency amount detection", () => {
  it("normalizes commonly used currency symbols, codes, and names", () => {
    expect(
      normalizeMonetaryMentions(
        "INR 3,999; USD 500; €600; 700 pounds; AED 1,000; 50 KWD; CHF 900; ¥50,000; 800 Canadian dollars; AUD 750; SGD 650; CNY 4,000; HKD 3,500; SAR 2,000; QAR 1,900; OMR 200; BHD 180; NZD 720.",
      ),
    ).toEqual([
      "₹3,999",
      "$500",
      "€600",
      "AED 1,000",
      "CHF 900",
      "¥50,000",
      "AUD 750",
      "SGD 650",
      "CNY 4,000",
      "HKD 3,500",
      "SAR 2,000",
      "QAR 1,900",
      "OMR 200",
      "BHD 180",
      "NZD 720",
      "£700",
      "KWD 50",
      "CAD 800",
    ]);
  });

  it("repairs the known broken PDF rupee glyph extraction", () => {
    expect(normalizeCurrencyText("Pay I3,999 and receive I45,000 monthly")).toBe(
      "Pay INR 3,999 and receive INR 45,000 monthly",
    );
    expect(
      normalizeMonetaryMentions("Pay I3,999 and receive I45,000 monthly"),
    ).toEqual(["₹3,999", "₹45,000 / month"]);
  });

  it.each([
    "$500",
    "EUR 450",
    "300 pounds sterling",
    "AED 1,500",
    "75 Kuwaiti dinars",
    "CHF 800",
    "JPY 50,000",
  ])("recognizes a candidate fee expressed as %s", (amount) => {
    const result = analyzeHeuristically(
      `Selected candidates must pay ${amount} as a registration fee before onboarding.`,
    );
    expect(result.categoryScores.payment).toBeGreaterThan(0);
    expect(result.evidenceList.map((item) => item.flagType)).toContain(
      "upfront-payment",
    );
  });

  it("does not treat compensation or an explicit no-fee statement as a fee", () => {
    expect(
      analyzeHeuristically(
        "Software internship with a USD 1,000 monthly stipend. No registration fee or candidate deposit is required.",
      ).categoryScores.payment,
    ).toBe(0);
  });
});
