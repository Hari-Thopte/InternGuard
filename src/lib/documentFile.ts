export type DocumentKind = "pdf" | "image" | "docx";

const supportedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/x-docx",
  "application/msword",
  "application/zip",
]);

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

export function inspectDocumentFile(
  bytes: Uint8Array,
  declaredMimeType: string,
): { kind: DocumentKind; mimeType: string; extension: string } | null {
  const declared = declaredMimeType.toLowerCase().split(";", 1)[0].trim();
  let detected:
    | { kind: DocumentKind; mimeType: string; extension: string }
    | undefined;

  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]))
    detected = { kind: "pdf", mimeType: "application/pdf", extension: ".pdf" };
  else if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    detected = { kind: "image", mimeType: "image/png", extension: ".png" };
  else if (startsWith(bytes, [0xff, 0xd8, 0xff]))
    detected = { kind: "image", mimeType: "image/jpeg", extension: ".jpg" };
  else if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]))
    detected = {
      kind: "docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: ".docx",
    };

  const riff = startsWith(bytes, [0x52, 0x49, 0x46, 0x46]);
  const webp =
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  if (!detected && riff && webp)
    detected = { kind: "image", mimeType: "image/webp", extension: ".webp" };

  if (!detected) return null;
  if (!declared || declared === "application/octet-stream") return detected;
  if (
    !supportedMimeTypes.has(declared) ||
    (declared !== detected.mimeType &&
      !(detected.kind === "docx" && (declared.includes("word") || declared.includes("zip"))))
  )
    return null;
  return detected;
}

export function safeDocumentName(name: string) {
  const clean = name
    .replace(/[\\/<>:"|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return clean || "uploaded-document";
}
