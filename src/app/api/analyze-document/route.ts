import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
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

function workerMessage(error: unknown) {
  const stderr =
    typeof error === "object" && error && "stderr" in error
      ? String((error as { stderr?: unknown }).stderr ?? "")
      : "";
  try {
    const parsed = JSON.parse(stderr.trim()) as { error?: string };
    return parsed.error || "The document could not be inspected.";
  } catch {
    return stderr.trim() || "The document could not be inspected.";
  }
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
    temporaryDirectory = await mkdtemp(join(tmpdir(), "internguard-document-"));
    const temporaryFile = join(
      temporaryDirectory,
      "source" + inspected.extension,
    );
    await writeFile(temporaryFile, buffer, { flag: "wx" });

    let worker: DocumentWorkerResult;
    try {
      const { stdout } = await runFile(
        process.env.PYTHON_COMMAND || "python",
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
      if (!validWorkerResult(parsed))
        throw new Error("The document worker returned an invalid result.");
      worker = parsed;
    } catch (error) {
      return NextResponse.json(
        { error: workerMessage(error) },
        { status: 422 },
      );
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
