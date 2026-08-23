import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import {
  analyzeDocument,
  type DocumentWorkerResult,
} from "@/lib/documentEngine";
import { inspectDocumentFile, safeDocumentName } from "@/lib/documentFile";

export const runtime = "nodejs";

const runFile = promisify(execFile);
const MAX_BYTES = 10 * 1024 * 1024;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 4;
const requests = new Map<string, number[]>();

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function hasCapacity(key: string) {
  const now = Date.now();
  if (requests.size > 1_000) {
    for (const [requestKey, timestamps] of requests) {
      const active = timestamps.filter(
        (timestamp) => now - timestamp < WINDOW_MS,
      );
      if (active.length) requests.set(requestKey, active);
      else requests.delete(requestKey);
    }
    while (requests.size > 1_000) {
      const oldest = requests.keys().next().value as string | undefined;
      if (!oldest) break;
      requests.delete(oldest);
    }
  }
  const recent = (requests.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= MAX_REQUESTS) {
    requests.set(key, recent);
    return false;
  }
  requests.set(key, [...recent, now]);
  return true;
}

function validWorkerResult(value: unknown): value is DocumentWorkerResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<DocumentWorkerResult>;
  return (
    typeof result.text === "string" &&
    result.text.length <= 40_000 &&
    typeof result.pageCount === "number" &&
    Number.isInteger(result.pageCount) &&
    result.pageCount >= 1 &&
    result.pageCount <= 100 &&
    result.metadata !== null &&
    typeof result.metadata === "object" &&
    !Array.isArray(result.metadata) &&
    typeof result.signatureFields === "number" &&
    Number.isInteger(result.signatureFields) &&
    result.signatureFields >= 0 &&
    typeof result.usedOcr === "boolean" &&
    Array.isArray(result.qrCodes) &&
    result.qrCodes.length <= 20 &&
    result.qrCodes.every(
      (value) => typeof value === "string" && value.length <= 2_048,
    )
  );
}

async function runTesseractJSOcr(buffer: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  let worker: any = null;
  try {
    const ocrPromise = (async () => {
      worker = await createWorker("eng", 1, {
        cachePath: tmpdir(),
        logger: () => {},
      });
      const res = await worker.recognize(buffer);
      return res?.data?.text?.trim() ?? "";
    })();
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("OCR request timed out")), 15000),
    );
    return await Promise.race([ocrPromise, timeoutPromise]);
  } finally {
    if (worker) {
      await worker.terminate().catch(() => undefined);
    }
  }
}

function extractRawPdfStrings(buffer: Buffer): string {
  const rawStr = buffer.toString("binary");
  const textBlocks: string[] = [];
  const matches = rawStr.match(
    /(\((?:[^()\\]|\\.){3,}\)\s*(?:Tj|TJ|\'))|(\[(?:\((?:[^()\\]|\\.){1,}\)\s*)+\]\s*TJ)/g,
  );
  if (matches) {
    for (const match of matches) {
      const strings = match.match(/\(([^()\\]|\\.)*\)/g);
      if (strings) {
        for (const s of strings) {
          const cleaned = s
            .slice(1, -1)
            .replace(/\\([()])/g, "$1")
            .trim();
          if (cleaned.length > 2 && /[\w\s]{3,}/.test(cleaned)) {
            textBlocks.push(cleaned);
          }
        }
      }
    }
  }
  return textBlocks.join(" ").replace(/\s+/g, " ").trim();
}

async function parseDocumentInJS(
  buffer: Buffer,
  kind: "pdf" | "image" | "docx",
): Promise<DocumentWorkerResult> {
  if (kind === "pdf") {
    try {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText().catch(() => null);
      const infoResult = await parser.getInfo().catch(() => null);
      await parser.destroy().catch(() => undefined);

      let text = (textResult?.text || "").trim();
      const pageCount = Math.max(textResult?.pages?.length || 1, 1);
      const info = (infoResult?.info || {}) as Record<string, unknown>;
      const metadata: Record<string, string> = {};

      if (typeof info.Author === "string" && info.Author)
        metadata.author = info.Author;
      if (typeof info.Creator === "string" && info.Creator)
        metadata.creator = info.Creator;
      if (typeof info.Producer === "string" && info.Producer)
        metadata.producer = info.Producer;
      if (typeof info.CreationDate === "string" && info.CreationDate)
        metadata.creationDate = info.CreationDate;
      if (typeof info.ModDate === "string" && info.ModDate)
        metadata.modDate = info.ModDate;

      const rawStr = buffer.toString("binary");
      const sigMatches = rawStr.match(/\/Type\s*\/Sig|\/ByteRange\b/g);
      const signatureFields = sigMatches ? Math.min(sigMatches.length, 10) : 0;

      let usedOcr = false;
      if (text.length < 20) {
        const rawFallback = extractRawPdfStrings(buffer);
        if (rawFallback.length > text.length) {
          text = rawFallback;
        }
      }

      return {
        text: text.slice(0, 40_000),
        pageCount: Math.min(pageCount, 100),
        metadata,
        signatureFields,
        usedOcr,
        qrCodes: [],
      };
    } catch {
      throw new Error("The PDF document could not be read.");
    }
  }

  if (kind === "image") {
    try {
      const text = await runTesseractJSOcr(buffer);
      return {
        text: text.slice(0, 40_000),
        pageCount: 1,
        metadata: {},
        signatureFields: 0,
        usedOcr: true,
        qrCodes: [],
      };
    } catch {
      throw new Error("The document image could not be processed.");
    }
  }

  if (kind === "docx") {
    const rawStr = buffer.toString("utf-8");
    const textMatches = [...rawStr.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)];
    const text = textMatches
      .map((m) => m[1])
      .join(" ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .trim();
    return {
      text: text.slice(0, 40_000),
      pageCount: 1,
      metadata: {},
      signatureFields: 0,
      usedOcr: false,
      qrCodes: [],
    };
  }

  throw new Error("Unsupported document type.");
}

export async function POST(request: Request) {
  if (!hasCapacity(clientKey(request)))
    return NextResponse.json(
      { error: "Too many document checks. Wait a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } },
    );

  let temporaryDirectory = "";
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return NextResponse.json(
        { error: "Choose a PDF, DOCX, or document image first." },
        { status: 400 },
      );
    if (file.size < 1 || file.size > MAX_BYTES)
      return NextResponse.json(
        { error: "Documents must be between 1 byte and 10 MB." },
        { status: 413 },
      );

    const buffer = Buffer.from(await file.arrayBuffer());
    const inspected = inspectDocumentFile(buffer, file.type);
    if (!inspected)
      return NextResponse.json(
        {
          error:
            "The file content does not match a supported PDF, DOCX, PNG, JPEG, or WebP document.",
        },
        { status: 415 },
      );

    const sha256 = createHash("sha256").update(buffer).digest("hex");
    let worker: DocumentWorkerResult | undefined;

    // 1. Try Python worker if python command is configured and available
    if (process.env.PYTHON_COMMAND) {
      try {
        temporaryDirectory = await mkdtemp(
          join(tmpdir(), "internguard-document-"),
        );
        const temporaryFile = join(
          temporaryDirectory,
          "source" + inspected.extension,
        );
        await writeFile(temporaryFile, buffer, { flag: "wx" });

        const { stdout } = await runFile(
          process.env.PYTHON_COMMAND,
          [
            join(process.cwd(), "scripts", "document_analyzer.py"),
            temporaryFile,
            inspected.kind,
          ],
          {
            timeout: 45_000,
            maxBuffer: 2 * 1024 * 1024,
            windowsHide: true,
          },
        );
        const parsed: unknown = JSON.parse(stdout);
        if (validWorkerResult(parsed)) {
          worker = parsed;
        }
      } catch {
        // Fall back to JS parser below
      }
    }

    // 2. Pure JS / WebAssembly document parser (works on Netlify, Vercel, Linux, Windows)
    if (!worker) {
      try {
        worker = await parseDocumentInJS(buffer, inspected.kind);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "The document could not be inspected.";
        return NextResponse.json({ error: message }, { status: 422 });
      }
    }

    const report = analyzeDocument({
      ...worker,
      fileName: safeDocumentName(file.name),
      mimeType: inspected.mimeType,
      sha256,
    });
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "The document upload could not be processed safely." },
      { status: 500 },
    );
  } finally {
    if (temporaryDirectory)
      await rm(temporaryDirectory, { recursive: true, force: true }).catch(
        () => undefined,
      );
  }
}
