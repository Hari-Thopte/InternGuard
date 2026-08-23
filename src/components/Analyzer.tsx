"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck2,
  FileImage,
  Globe2,
  History,
  MessageSquareText,
  ScanSearch,
  UploadCloud,
  X,
} from "lucide-react";
import { z } from "zod";
import type { DocumentReport, RiskReport } from "@/lib/types";
import { ReportView } from "./ReportView";
import { DocumentReportView } from "./DocumentReportView";
import Image from "next/image";
import { saveScanReport, useScanHistory } from "@/lib/historyStore";
import {
  saveDocumentReport,
  useDocumentHistory,
} from "@/lib/documentHistoryStore";
type Tab = "text" | "image" | "url" | "document";
const sourceTabs = [
  { id: "text", label: "Paste message", icon: MessageSquareText },
  { id: "image", label: "Upload screenshot", icon: FileImage },
  { id: "url", label: "Analyze webpage", icon: Globe2 },
  { id: "document", label: "Check a document", icon: FileCheck2 },
] as const;
const stages = [
  "Source received",
  "Reading content",
  "Extracting information",
  "Checking risk signals",
  "Correlating evidence",
  "Assembling report",
];
const documentStages = [
  "Upload validated",
  "Creating fingerprint",
  "Inspecting pages",
  "Reading document text",
  "Checking issuer signals",
  "Assembling trust report",
];
async function compressScreenshot(file: File) {
  if (file.size < 800_000) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.84),
  );
  return blob
    ? new File([blob], file.name.replace(/\.[^.]+$/, "") + "-optimized.jpg", {
        type: "image/jpeg",
      })
    : file;
}
export function Analyzer() {
  const [tab, setTab] = useState<Tab>("text"),
    [text, setText] = useState(""),
    [url, setUrl] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [documentFile, setDocumentFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [busy, setBusy] = useState(false),
    [stage, setStage] = useState(0),
    [error, setError] = useState(""),
    [storageWarning, setStorageWarning] = useState(""),
    [report, setReport] = useState<RiskReport | null>(null),
    [documentReport, setDocumentReport] = useState<DocumentReport | null>(null),
    [dragging, setDragging] = useState<Tab | null>(null),
    [duplicateDocument, setDuplicateDocument] = useState<DocumentReport | null>(
      null,
    ),
    history = useScanHistory(),
    documentHistory = useDocumentHistory();
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const screenshotInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);
  const documentSelectionVersion = useRef(0);
  const submitting = useRef(false);
  const activeStages = tab === "document" ? documentStages : stages;
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      submitting.current = false;
    },
    [],
  );
  const selectScreenshot = (selected: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setFile(null);
    if (!selected) return;
    const supportedType = /^image\/(png|jpeg|webp)$/i.test(selected.type);
    const missingGenericType =
      !selected.type || selected.type === "application/octet-stream";
    const supportedExtension = /\.(png|jpe?g|webp)$/i.test(selected.name);
    if (!supportedType && !(missingGenericType && supportedExtension)) {
      setError("Choose a PNG, JPEG, or WebP screenshot.");
      if (screenshotInput.current) screenshotInput.current.value = "";
      return;
    }
    if (selected.size < 1) {
      setError("The screenshot file is empty.");
      if (screenshotInput.current) screenshotInput.current.value = "";
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("The screenshot must be 5 MB or smaller.");
      if (screenshotInput.current) screenshotInput.current.value = "";
      return;
    }
    setError("");
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };
  const selectDocument = async (selected: File | null) => {
    const selectionVersion = ++documentSelectionVersion.current;
    setDocumentFile(null);
    setDuplicateDocument(null);
    if (!selected) return;
    const docxMime =
      selected.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      selected.type === "application/x-docx" ||
      selected.type === "application/msword" ||
      selected.type === "application/zip";
    const supportedType =
      selected.type === "application/pdf" ||
      docxMime ||
      /^image\/(png|jpeg|webp)$/i.test(selected.type);
    const missingGenericType =
      !selected.type || selected.type === "application/octet-stream";
    const supported =
      supportedType ||
      (missingGenericType && /\.(pdf|docx?|png|jpe?g|webp)$/i.test(selected.name)) ||
      /\.docx?$/i.test(selected.name);
    if (!supported) {
      setError("Choose a PDF, DOCX, PNG, JPEG, or WebP document.");
      if (documentInput.current) documentInput.current.value = "";
      return;
    }
    if (selected.size < 1) {
      setError("The document file is empty.");
      if (documentInput.current) documentInput.current.value = "";
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("The document must be 10 MB or smaller.");
      if (documentInput.current) documentInput.current.value = "";
      return;
    }
    setError("");
    setDocumentFile(selected);
    try {
      const digest = await crypto.subtle.digest(
        "SHA-256",
        await selected.arrayBuffer(),
      );
      const hash = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      if (selectionVersion !== documentSelectionVersion.current) return;
      setDuplicateDocument(
        documentHistory.find((item) => item.sha256 === hash) ?? null,
      );
    } catch {
      // Server-side fingerprinting still runs if this browser API is unavailable.
    }
  };
  const dropFile = (
    event: React.DragEvent<HTMLLabelElement>,
    target: "image" | "document",
  ) => {
    event.preventDefault();
    setDragging(null);
    const selected = event.dataTransfer.files?.[0] ?? null;
    if (target === "image") selectScreenshot(selected);
    else void selectDocument(selected);
  };
  const submit = async () => {
    if (submitting.current) return;
    setError("");
    setStorageWarning("");
    setReport(null);
    setDocumentReport(null);
    try {
      if (tab === "text")
        z.string()
          .min(20, "Paste at least 20 characters of context.")
          .max(20000)
          .parse(text);
      if (tab === "url")
        z.string()
          .url("Enter a complete public HTTP(S) URL.")
          .refine(
            (value) => /^https?:\/\//i.test(value),
            "Only public HTTP(S) URLs can be analyzed.",
          )
          .parse(url);
      if (tab === "image" && !file)
        throw new Error("Choose a screenshot first.");
      if (tab === "document" && !documentFile)
        throw new Error("Choose a PDF or document image first.");
      submitting.current = true;
      setBusy(true);
      setStage(0);
      timer.current = setInterval(
        () => setStage((s) => Math.min(activeStages.length - 1, s + 1)),
        650,
      );
      let response: Response;
      if (tab === "document") {
        const body = new FormData();
        body.append("file", documentFile!);
        response = await fetch("/api/analyze-document", {
          method: "POST",
          body,
        });
      } else if (tab === "image") {
        const body = new FormData();
        body.append("file", await compressScreenshot(file!));
        response = await fetch("/api/analyze", { method: "POST", body });
      } else
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            tab === "text"
              ? { sourceType: "text", content: text }
              : { sourceType: "url", url },
          ),
        });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        kind?: string;
      } | null;
      if (!data)
        throw new Error(
          "The analysis service returned an unreadable response. Please try again.",
        );
      if (!response.ok) throw new Error(data.error || "Analysis failed.");
      if (tab === "document") {
        const result = data as DocumentReport;
        setDocumentReport(result);
        if (!saveDocumentReport(result))
          setStorageWarning(
            "The report is ready, but this browser could not save it to local history.",
          );
      } else {
        const result = data as RiskReport;
        setReport(result);
        if (!saveScanReport(result))
          setStorageWarning(
            "The report is ready, but this browser could not save it to local history.",
          );
      }
      setTimeout(
        () =>
          (() => {
            const result = document.getElementById(
              tab === "document" ? "document-report" : "report",
            );
            result?.focus({ preventScroll: true });
            result?.scrollIntoView({
              behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
            });
          })(),
        80,
      );
    } catch (e) {
      setError(
        e instanceof z.ZodError
          ? e.issues[0].message
          : e instanceof Error
            ? e.message
            : "Analysis failed safely.",
      );
    } finally {
      if (timer.current) clearInterval(timer.current);
      submitting.current = false;
      setBusy(false);
    }
  };
  const reset = () => {
    setReport(null);
    setDocumentReport(null);
    setError("");
    setStorageWarning("");
    setText("");
    setUrl("");
    setFile(null);
    setDocumentFile(null);
    documentSelectionVersion.current++;
    setDuplicateDocument(null);
    setPreview("");
    if (screenshotInput.current) screenshotInput.current.value = "";
    if (documentInput.current) documentInput.current.value = "";
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };
  const sample = () =>
    setText(
      "Remote marketing internship. Pay ₹4,000 registration fee by personal UPI immediately to secure your seat. Send Aadhaar and PAN card to hiringteam@gmail.com within 30 minutes.",
    );
  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden">
        <div className="grid lg:grid-cols-[16rem_1fr]">
          <aside className="border-b border-line bg-surface p-4 lg:border-b-0 lg:border-r">
            <p className="eyebrow px-2 py-3">Source channel</p>
            <div
              role="tablist"
              aria-label="Analysis source"
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1"
            >
              {sourceTabs.map((t, index) => (
                <button
                  key={t.id}
                  id={`source-tab-${t.id}`}
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-controls={`source-panel-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  disabled={busy}
                  onClick={() => {
                    setTab(t.id);
                    setError("");
                  }}
                  onKeyDown={(event) => {
                    if (
                      ![
                        "ArrowDown",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowLeft",
                        "Home",
                        "End",
                      ].includes(event.key)
                    )
                      return;
                    event.preventDefault();
                    const nextIndex =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? sourceTabs.length - 1
                          : event.key === "ArrowDown" ||
                              event.key === "ArrowRight"
                            ? (index + 1) % sourceTabs.length
                            : (index - 1 + sourceTabs.length) %
                              sourceTabs.length;
                    const next = sourceTabs[nextIndex].id;
                    setTab(next);
                    requestAnimationFrame(() =>
                      document.getElementById(`source-tab-${next}`)?.focus(),
                    );
                  }}
                  className={`relative flex min-h-14 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors ${tab === t.id ? "text-canvas" : "text-muted hover:bg-raised hover:text-ink"}`}
                >
                  {tab === t.id && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 rounded-xl bg-ink"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <t.icon size={18} />
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-7 border-t border-line pt-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <History size={16} className="text-accent" />
                {tab === "document" ? "Recent documents" : "Recent scans"}
              </div>
              <div className="mt-3 space-y-2">
                {tab === "document"
                  ? documentHistory.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setReport(null);
                          setDocumentReport(item);
                        }}
                        className="block w-full truncate rounded-lg border border-line p-2 text-left text-xs text-muted hover:border-accent"
                      >
                        {item.fileName} · {item.riskLevel}
                      </button>
                    ))
                  : history.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setDocumentReport(null);
                          setReport(item);
                        }}
                        className="block w-full truncate rounded-lg border border-line p-2 text-left text-xs text-muted hover:border-accent"
                      >
                        {item.sourceLabel} · {item.riskLevel}
                      </button>
                    ))}
                {(tab === "document"
                  ? !documentHistory.length
                  : !history.length) && (
                  <p className="text-xs leading-5 text-muted">
                    Completed reports stay in this browser only.
                  </p>
                )}
              </div>
            </div>
          </aside>
          <div className="p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">New investigation</p>
                <h2 className="mt-2 text-3xl font-semibold">
                  Bring the evidence you received.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  InternGuard applies traceable rules. It does not train on your
                  submission or declare an employer fraudulent.
                </p>
              </div>
              <span className="rounded-full border border-low/30 bg-low/10 px-3 py-1 text-xs text-low">
                Local heuristic engine
              </span>
            </div>
            <div
              id={`source-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`source-tab-${tab}`}
              className="mt-7"
            >
              {tab === "text" && (
                <>
                  <label htmlFor="content" className="text-sm font-semibold">
                    Message or listing text
                  </label>
                  <textarea
                    id="content"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={busy}
                    rows={10}
                    maxLength={20000}
                    placeholder="Paste the recruiter message, email, or internship listing exactly as received…"
                    className="mt-2 w-full resize-y rounded-xl border border-line bg-canvas p-4 text-sm leading-7 outline-none focus:border-accent"
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <button onClick={sample} className="hover:text-accent">
                      Load suspicious example
                    </button>
                    <span>{text.length.toLocaleString()} / 20,000</span>
                  </div>
                </>
              )}
              {tab === "url" && (
                <>
                  <label htmlFor="url" className="text-sm font-semibold">
                    Public internship URL
                  </label>
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={busy}
                    placeholder="https://company.example/careers/internship"
                    className="mt-2 h-14 w-full rounded-xl border border-line bg-canvas px-4 outline-none focus:border-accent"
                  />
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Only public HTTP(S) pages are retrieved. Private networks,
                    credential-bearing URLs, unsafe redirects, and oversized
                    responses are blocked.
                  </p>
                </>
              )}
              {tab === "image" && (
                <div>
                  <label
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setDragging("image");
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={() => setDragging(null)}
                    onDrop={(event) => dropFile(event, "image")}
                    className={`grid min-h-60 cursor-pointer place-items-center rounded-xl border border-dashed bg-canvas p-6 text-center transition ${dragging === "image" ? "border-accent bg-accent/10 shadow-[0_0_35px_rgb(var(--accent)/.12)]" : "border-line hover:border-accent"}`}
                  >
                    <input
                      ref={screenshotInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) =>
                        selectScreenshot(e.target.files?.[0] || null)
                      }
                    />
                    <span>
                      {preview ? (
                        <Image
                          src={preview}
                          alt="Screenshot preview"
                          width={720}
                          height={480}
                          unoptimized
                          className="max-h-52 w-auto rounded-lg object-contain"
                        />
                      ) : (
                        <>
                          <UploadCloud className="mx-auto text-accent" />
                          <strong className="mt-3 block">
                            Drop or choose a screenshot
                          </strong>
                          <span className="mt-2 block text-xs text-muted">
                            PNG, JPEG, or WebP · maximum 5 MB
                          </span>
                        </>
                      )}
                    </span>
                  </label>
                  {file && (
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview("");
                        if (screenshotInput.current)
                          screenshotInput.current.value = "";
                      }}
                      className="mt-3 inline-flex items-center gap-2 text-xs text-muted"
                    >
                      <X size={14} />
                      Remove {file.name}
                    </button>
                  )}
                </div>
              )}
              {tab === "document" && (
                <div>
                  <label
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setDragging("document");
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={() => setDragging(null)}
                    onDrop={(event) => dropFile(event, "document")}
                    className={`grid min-h-60 cursor-pointer place-items-center rounded-xl border border-dashed bg-canvas p-6 text-center transition ${dragging === "document" ? "border-accent bg-accent/10 shadow-[0_0_35px_rgb(var(--accent)/.12)]" : "border-line hover:border-accent"}`}
                  >
                    <input
                      ref={documentInput}
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/x-docx,application/msword,image/png,image/jpeg,image/webp"
                      className="sr-only"
                      disabled={busy}
                      onChange={(event) =>
                        void selectDocument(event.target.files?.[0] || null)
                      }
                    />
                    {documentFile ? (
                      <span className="max-w-full">
                        <FileCheck2 className="mx-auto text-accent" size={34} />
                        <strong className="mt-3 block break-words">
                          {documentFile.name}
                        </strong>
                        <span className="mt-2 block text-xs text-muted">
                          {(documentFile.size / 1024 / 1024).toFixed(2)} MB ·
                          ready for a private evidence review
                        </span>
                      </span>
                    ) : (
                      <span>
                        <UploadCloud className="mx-auto text-accent" />
                        <strong className="mt-3 block">
                          Drop or choose a certificate, offer letter, or document
                        </strong>
                        <span className="mt-2 block text-xs leading-5 text-muted">
                          PDF, DOCX, PNG, JPEG, or WebP · maximum 10 MB
                        </span>
                      </span>
                    )}
                  </label>
                  {documentFile && (
                    <button
                      onClick={() => {
                        documentSelectionVersion.current++;
                        setDocumentFile(null);
                        setDuplicateDocument(null);
                        if (documentInput.current)
                          documentInput.current.value = "";
                      }}
                      className="mt-3 inline-flex items-center gap-2 text-xs text-muted hover:text-ink"
                    >
                      <X size={14} /> Remove document
                    </button>
                  )}
                  {duplicateDocument && (
                    <div
                      role="status"
                      className="mt-4 rounded-xl border border-caution/35 bg-caution/10 p-4 text-sm"
                    >
                      <strong>This exact file was checked before.</strong>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Its SHA-256 fingerprint matches{" "}
                        {duplicateDocument.fileName}. You can review the saved
                        report or scan it again.
                      </p>
                      <Link
                        href={`/document-report/${duplicateDocument.id}`}
                        className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline"
                      >
                        Open previous report
                      </Link>
                    </div>
                  )}
                  <p className="mt-4 text-xs leading-5 text-muted">
                    The server creates a SHA-256 fingerprint, extracts readable
                    text and metadata, then deletes its temporary copy. The
                    report is stored only in this browser.
                  </p>
                </div>
              )}
            </div>
            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-high/40 bg-high/10 p-4 text-sm"
              >
                <strong>Analysis could not continue.</strong>
                <p className="mt-1 text-muted">{error}</p>
              </div>
            )}
            {storageWarning && (
              <div
                role="status"
                className="mt-5 rounded-xl border border-caution/40 bg-caution/10 p-4 text-sm"
              >
                <strong>Local history was not updated.</strong>
                <p className="mt-1 text-muted">{storageWarning}</p>
              </div>
            )}
            {busy ? (
              <div
                role="status"
                aria-live="polite"
                className="relative mt-6 overflow-hidden rounded-xl border border-accent/30 bg-raised p-5"
              >
                <div className="scan-beam absolute inset-x-0 top-0 h-px" />
                <div className="flex items-center gap-3">
                  <ScanSearch className="animate-pulse text-accent" />
                  <div>
                    <strong>
                      {activeStages[stage]} ·{" "}
                      {Math.round(((stage + 1) / activeStages.length) * 100)}%
                    </strong>
                    <p className="text-xs text-muted">
                      Presentation sequence — not live backend telemetry
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-6 gap-1">
                  {activeStages.map((s, i) => (
                    <span
                      key={s}
                      className={`h-1 rounded ${i <= stage ? "bg-accent" : "bg-line"}`}
                    />
                  ))}
                </div>
                <progress
                  className="sr-only"
                  max={activeStages.length}
                  value={stage + 1}
                  aria-label="Analysis progress"
                />
              </div>
            ) : (
              <motion.button
                onClick={submit}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="button-primary mt-6 cursor-pointer"
              >
                <ScanSearch size={17} />
                {tab === "document"
                  ? "Check this document"
                  : "Analyze this source"}
              </motion.button>
            )}
          </div>
        </div>
      </section>
      {report && <ReportView report={report} onReset={reset} />}
      {documentReport && (
        <DocumentReportView report={documentReport} onReset={reset} />
      )}
    </div>
  );
}
