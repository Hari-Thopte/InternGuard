import { spawn } from "node:child_process";
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { heuristicEngine } from "@/lib/heuristicEngine";
import { retrievePublicPage } from "@/lib/safeUrl";
import { htmlPageTitle, visibleHtmlText } from "@/lib/htmlText";
import { inspectDocumentFile } from "@/lib/documentFile";

export const runtime = "nodejs";

const jsonSchema = z.discriminatedUnion("sourceType", [
  z.object({
    sourceType: z.literal("text"),
    content: z.string().min(20).max(20000),
  }),
  z.object({ sourceType: z.literal("url"), url: z.string().url().max(2000) }),
]);

const requestBuckets = new Map<string, { count: number; resetsAt: number }>();
function checkRateLimit(request: NextRequest, limit: number) {
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  const now = Date.now();
  if (requestBuckets.size > 1_000) {
    for (const [bucketKey, bucket] of requestBuckets)
      if (bucket.resetsAt <= now) requestBuckets.delete(bucketKey);
    while (requestBuckets.size > 1_000) {
      const oldest = requestBuckets.keys().next().value as string | undefined;
      if (!oldest) break;
      requestBuckets.delete(oldest);
    }
  }
  const current = requestBuckets.get(key);
  if (!current || current.resetsAt <= now) {
    requestBuckets.set(key, { count: 1, resetsAt: now + 60_000 });
    return true;
  }
  if (current.count >= limit) return false;
  current.count++;
  return true;
}

async function retrieveUrl(raw: string) {
  const page = await retrievePublicPage(raw);
  const text = visibleHtmlText(page.body);
  const pageTitle = htmlPageTitle(page.body);
  if (text.length < 80)
    throw new Error(
      "Not enough readable public listing content was retrieved. Paste the listing text or upload a screenshot instead.",
    );
  return { text, finalUrl: page.finalUrl, pageTitle };
}

async function runWindowsNativeOcr(buffer: Buffer): Promise<string> {
  const scriptPath = join(process.cwd(), "scripts", "windows_ocr.ps1");
  if (!existsSync(scriptPath)) throw new Error("Windows OCR script missing.");
  const tempPath = join(tmpdir(), `ig-ocr-${randomUUID()}.png`);
  try {
    writeFileSync(tempPath, buffer);
    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn(
        "powershell.exe",
        ["-ExecutionPolicy", "Bypass", "-File", scriptPath, "-ImagePath", tempPath],
        { windowsHide: true },
      );
      let output = "",
        errors = "";
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error("timeout"));
      }, 15000);
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (errors += chunk));
      child.on("error", reject);
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0 && output.trim()) resolve(output);
        else reject(new Error(errors || "Windows OCR returned empty result"));
      });
    });
    return stdout.trim();
  } finally {
    try {
      if (existsSync(tempPath)) unlinkSync(tempPath);
    } catch {
      // Clean up temporary file silently
    }
  }
}

async function ocrImage(file: File) {
  if (file.size < 1) throw new Error("The screenshot file is empty.");
  if (file.size > 5 * 1024 * 1024)
    throw new Error("The screenshot must be 5 MB or smaller.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const inspected = inspectDocumentFile(buffer, file.type);
  if (!inspected || inspected.kind !== "image")
    throw new Error(
      "The file content does not match a supported PNG, JPEG, or WebP screenshot.",
    );

  // 1. Try Windows Native WinRT OCR first when running on Windows (instant local execution)
  if (process.platform === "win32") {
    try {
      const text = await runWindowsNativeOcr(buffer);
      if (text.length >= 15) return text;
    } catch {
      // Fall through to Tesseract
    }
  }

  // 2. Try native Tesseract CLI if installed locally
  const windowsDefault = "C:\\Program Files\\Tesseract-OCR\\tesseract.exe";
  const tesseractAvailable =
    process.env.TESSERACT_COMMAND ||
    (process.platform === "win32" && existsSync(windowsDefault));

  if (tesseractAvailable) {
    try {
      const command = process.env.TESSERACT_COMMAND || windowsDefault;
      const stdout = await new Promise<string>((resolve, reject) => {
        const child = spawn(
          /* turbopackIgnore: true */ command,
          ["stdin", "stdout", "-l", "eng"],
          { windowsHide: true },
        );
        let output = "",
          errors = "";
        const timeout = setTimeout(() => {
          child.kill();
          reject(new Error("timeout"));
        }, 20000);
        child.stdout.on("data", (chunk) => {
          output += chunk;
          if (output.length > 2_000_000) child.kill();
        });
        child.stderr.on("data", (chunk) => (errors += chunk));
        child.on("error", reject);
        child.on("close", (code) => {
          clearTimeout(timeout);
          if (code === 0) resolve(output);
          else reject(new Error(errors));
        });
        child.stdin.end(buffer);
      });
      if (stdout.trim().length >= 15) return stdout.trim();
    } catch {
      // Fall through to tesseract.js
    }
  }

  // 3. Try tesseract.js (Pure JS / WebAssembly with 15s timeout - works on Netlify, Vercel, Linux)
  try {
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
      const text = await Promise.race([ocrPromise, timeoutPromise]);
      if (text.length >= 15) return text;
    } finally {
      if (worker) {
        await worker.terminate().catch(() => undefined);
      }
    }
  } catch {
    // Fall through to final error
  }

  throw new Error(
    "The screenshot could not be read clearly. Try a sharper crop or paste the visible text.",
  );
}

export async function POST(request: NextRequest) {
  try {
    const type = request.headers.get("content-type") ?? "";
    if (!checkRateLimit(request, type.includes("multipart/form-data") ? 4 : 12))
      return NextResponse.json(
        { error: "Too many analysis requests. Try again in a minute." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    if (type.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File))
        throw new Error("Choose a screenshot to analyze.");
      const text = await ocrImage(file);
      return NextResponse.json(
        heuristicEngine.analyze(text, "image", file.name),
      );
    }
    const payload = jsonSchema.parse(await request.json());
    if (payload.sourceType === "text")
      return NextResponse.json(
        heuristicEngine.analyze(payload.content, "text", "Pasted message"),
      );
    const page = await retrieveUrl(payload.url);
    return NextResponse.json(
      heuristicEngine.analyze(page.text, "url", page.finalUrl, {
        pageTitle: page.pageTitle,
      }),
    );
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "The submitted input is incomplete or invalid."
        : error instanceof Error
          ? error.message
          : "Analysis failed safely.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
