import { describe, expect, it } from "vitest";
import {
  flattenEvidenceText,
  normalizeEvidenceText,
} from "./textNormalization";

describe("evidence text cleanup", () => {
  it("removes invisible characters and repairs line-break hyphenation", () => {
    expect(normalizeEvidenceText("regis-\ntration\u200B fee")).toBe(
      "registration fee",
    );
  });

  it("repairs broken rupee glyph extraction before flattening", () => {
    expect(flattenEvidenceText("Pay I3,999\nwithin 30 minutes")).toBe(
      "Pay INR 3,999 within 30 minutes",
    );
  });
});
