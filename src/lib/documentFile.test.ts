import { describe, expect, it } from "vitest";
import { inspectDocumentFile, safeDocumentName } from "./documentFile";

describe("document file validation", () => {
  it("accepts matching PDF and image signatures", () => {
    expect(
      inspectDocumentFile(
        new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
        "application/pdf",
      )?.kind,
    ).toBe("pdf");
    expect(
      inspectDocumentFile(
        new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
        "image/jpeg",
      )?.kind,
    ).toBe("image");
    expect(
      inspectDocumentFile(
        new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      )?.kind,
    ).toBe("docx");
  });

  it("accepts signature-verified files when a browser omits the MIME type", () => {
    expect(
      inspectDocumentFile(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), ""),
    ).toMatchObject({ kind: "pdf", mimeType: "application/pdf" });
  });

  it("rejects extension or MIME claims that do not match file bytes", () => {
    expect(
      inspectDocumentFile(
        new TextEncoder().encode("this is not a PDF"),
        "application/pdf",
      ),
    ).toBeNull();
    expect(
      inspectDocumentFile(
        new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
        "text/plain",
      ),
    ).toBeNull();
    expect(
      inspectDocumentFile(
        new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
        "image/png",
      ),
    ).toBeNull();
  });

  it("removes path characters from display names", () => {
    expect(safeDocumentName("../../unsafe:certificate?.pdf")).toBe(
      ".._.._unsafe_certificate_.pdf",
    );
  });
});
