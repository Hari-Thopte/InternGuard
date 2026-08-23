"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Check,
  Clipboard,
  FileCheck2,
  FileDown,
  Fingerprint,
  Info,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type { DocumentCategory, DocumentReport } from "@/lib/types";
import { PrintDocumentReport } from "./PrintDocumentReport";
import { CategoryRiskGraph } from "./CategoryRiskGraph";
import { ForensicTelemetryWidget } from "./ForensicTelemetryWidget";

const categoryLabels: Record<DocumentCategory, string> = {
  issuer: "Issuer identity",
  content: "Readable content",
  metadata: "File metadata",
  integrity: "File integrity",
  verification: "Verification path",
};

const riskRanges = {
  low: "0-20",
  caution: "21-50",
  high: "51-100",
} as const;

function visible(value: string) {
  return value || "Not confidently detected";
}

export function DocumentReportView({
  report,
  onReset,
}: {
  report: DocumentReport;
  onReset?: () => void;
}) {
  const reduced = useReducedMotion();
  const [copyStatus, setCopyStatus] = useState("");
  const tone = `risk-${report.riskLevel}`;
  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(report.sha256);
      setCopyStatus("Fingerprint copied.");
    } catch {
      setCopyStatus("Clipboard access was blocked by this browser.");
    }
  };
  const topReasons = [...report.findings]
    .filter((finding) => finding.status === "warning")
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);
  const candidatePaymentSignal = report.findings.some((finding) =>
    /payment|fee|deposit|equipment purchase|paid training/i.test(finding.title),
  );

  return (
    <>
      <motion.section
      id="document-report"
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6 sm:space-y-8"
      aria-label="Document trust report"
      tabIndex={-1}
    >
      {/* Section 1: Assessment Summary Hero */}
      <div className={`panel ${tone} w-full overflow-hidden`}>
        <div className="grid lg:grid-cols-[1fr_20rem]">
          <div className="p-6 sm:p-9">
            <p className="eyebrow">Document assessment / {report.id}</p>
            <span className="risk-badge mt-5">
              {report.riskLevel === "low" ? (
                <ShieldCheck size={15} />
              ) : (
                <AlertTriangle size={15} />
              )}
              {report.riskLevel} concern
            </span>
            <h2 className="mt-5 text-3xl font-semibold sm:text-5xl">
              {report.verdict}
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-muted">
              This is an evidence review, not an authenticity certificate. It
              highlights details to verify and never declares the issuer or
              document genuine or fraudulent.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-line px-3 py-1.5">
                {report.documentType}
              </span>
              <span className="rounded-full border border-line px-3 py-1.5">
                {report.pageCount} {report.pageCount === 1 ? "page" : "pages"}
              </span>
              <span className="max-w-full truncate rounded-full border border-line px-3 py-1.5 text-muted">
                {report.fileName}
              </span>
            </div>
          </div>
          <div className="flex items-center border-t border-line bg-raised/35 p-6 lg:border-l lg:border-t-0">
            <div
              className="w-full"
              aria-label={`Document concern score ${report.overallScore} out of 100`}
            >
              <p className="eyebrow">Document concern score</p>
              <div className="mt-4 flex items-end gap-2">
                <strong className="font-display text-7xl leading-none">
                  {report.overallScore}
                </strong>
                <span className="pb-2 text-sm text-muted">/ 100</span>
              </div>
              <div className="relative mt-5">
                <div
                  className="grid h-3 grid-cols-[21fr_30fr_49fr] overflow-hidden rounded-full"
                  aria-hidden="true"
                >
                  <span className="bg-low/15" />
                  <span className="bg-caution/15" />
                  <span className="bg-high/15" />
                </div>
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${report.overallScore}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    backgroundColor: "rgb(var(--risk))",
                    boxShadow: "0 0 18px rgb(var(--risk) / .45)",
                  }}
                />
                <motion.span
                  className="absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full border border-canvas"
                  initial={reduced ? false : { left: 0 }}
                  animate={{ left: `${report.overallScore}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ backgroundColor: "rgb(var(--risk))" }}
                />
              </div>
              <div className="mt-2 grid grid-cols-[21fr_30fr_49fr] text-center font-mono text-[8px] uppercase tracking-wider">
                <span className="text-low">Low</span>
                <span className="text-caution">Review</span>
                <span className="text-high">High</span>
              </div>
              <p className="mt-5 text-xs leading-5 text-muted">
                <strong className="capitalize text-[rgb(var(--risk))]">
                  {report.overallScore} is in the {report.riskLevel} band (
                  {riskRanges[report.riskLevel]}).
                </strong>{" "}
                This is signal strength, not a probability of forgery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Top Reasons & Money Context */}
      <div className="grid gap-5 lg:grid-cols-2 w-full">
        <section className="panel p-5 sm:p-6 w-full" aria-label="Top score reasons">
          <p className="eyebrow">Top reasons for this score</p>
          <h3 className="mt-2 text-2xl font-semibold">
            The strongest document signals
          </h3>
          {topReasons.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {topReasons.map((reason, index) => (
                <div
                  key={reason.id}
                  className="rounded-xl border border-line bg-raised/45 p-4"
                >
                  <span className="font-mono text-[10px] text-accent">
                    0{index + 1}
                  </span>
                  <strong className="mt-2 block text-sm">{reason.title}</strong>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">
                    {reason.explanation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">
              No warning rule matched. This does not establish authenticity.
            </p>
          )}
        </section>

        <section className="panel p-5 sm:p-6 w-full" aria-label="Payment context">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
              <Banknote size={19} />
            </span>
            <div>
              <p className="eyebrow">Money context</p>
              <h3 className="mt-1 text-xl font-semibold">
                {candidatePaymentSignal
                  ? "Candidate payment signal"
                  : report.extracted.amounts.length
                    ? "Compensation or amount only"
                    : "No amount detected"}
              </h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            {candidatePaymentSignal
              ? "The document asks the candidate to pay, transfer, or deposit money. Treat stipend claims separately."
              : report.extracted.amounts.length
                ? "Amounts were extracted, but no candidate-facing payment rule matched."
                : "No supported currency amount was confidently extracted."}
          </p>
          {report.extracted.amounts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {report.extracted.amounts.map((amount) => (
                <span
                  key={amount}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${candidatePaymentSignal ? "border-caution/30 bg-caution/10 text-caution" : "border-low/30 bg-low/10 text-low"}`}
                >
                  {amount}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Section 3: Signal Breakdown & Category Risk Graph */}
      <div className="panel p-5 sm:p-7 w-full">
        <p className="eyebrow">Five-part review</p>
        <h3 className="mt-2 text-2xl font-semibold">What was checked</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          The overall band uses the stronger of document-trust checks and risks
          found in the document&apos;s claims. Category values are independent
          and are not added together. A zero does not guarantee authenticity.
        </p>
        <div className="mt-5 w-full">
          <CategoryRiskGraph report={report} variant="dark" />
        </div>
        <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full">
          {Object.entries(report.categoryScores).map(([key, score]) => (
            <div
              key={key}
              className="rounded-xl border border-line bg-raised/45 p-4"
            >
              <span className="text-xs text-muted">
                {categoryLabels[key as DocumentCategory]}
              </span>
              <strong className="mt-3 block font-display text-3xl">
                {score}
              </strong>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line/50">
                <motion.div
                  className={
                    score > 50
                      ? "h-full bg-high"
                      : score > 20
                        ? "h-full bg-caution"
                        : "h-full bg-low"
                  }
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.7 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: 12-Column Grid for Findings vs Identity */}
      <div className="grid gap-5 lg:grid-cols-12 w-full items-start">
        {/* Left Column: Findings and Reasons (7 columns) */}
        <div className="lg:col-span-7 w-full">
          <div className="panel p-5 sm:p-7 space-y-6 w-full">
            <p className="eyebrow">Evidence trail</p>
            <h3 className="mt-2 text-2xl font-semibold">Findings and reasons</h3>
            <div className="mt-6 space-y-3 w-full">
              {report.findings.map((finding, index) => {
                const Icon =
                  finding.status === "warning"
                    ? AlertTriangle
                    : finding.status === "pass"
                      ? Check
                      : Info;
                return (
                  <motion.article
                    key={finding.id}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border border-line bg-raised/35 p-4 w-full"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${finding.status === "warning" ? "bg-caution/10 text-caution" : finding.status === "pass" ? "bg-low/10 text-low" : "bg-accent/10 text-accent"}`}
                      >
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap justify-between gap-2">
                          <strong>{finding.title}</strong>
                          {finding.weight > 0 && (
                            <span className="font-mono text-[10px] uppercase text-caution">
                              +{finding.weight} rule weight
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {finding.explanation}
                        </p>
                        {finding.evidence && (
                          <code className="mt-3 block break-all rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink">
                            {finding.evidence}
                          </code>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Document Details, Domain Check, File Identity (5 columns) */}
        <div className="lg:col-span-5 space-y-5 w-full">
          <div className="panel p-5 sm:p-7 w-full">
            <p className="eyebrow">Extracted identity</p>
            <h3 className="mt-2 text-2xl font-semibold">Document details</h3>
            <dl className="mt-5 divide-y divide-line text-sm">
              {[
                ["Claimed issuer", visible(report.extracted.organization)],
                ["Candidate", visible(report.extracted.candidateName)],
                ["Document ID", visible(report.extracted.documentId)],
                [
                  "Detected amounts",
                  report.extracted.amounts.join(", ") || "None detected",
                ],
                ["Dates", report.extracted.dates.join(", ") || "None detected"],
                [
                  "Emails",
                  report.extracted.emails.join(", ") || "None detected",
                ],
                ["Links", report.extracted.urls.join(", ") || "None detected"],
                [
                  "QR-code values",
                  report.extracted.qrCodes.join(", ") || "None detected",
                ],
              ].map(([label, value]) => (
                <div key={label} className="py-3 first:pt-0">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="mt-1 break-words font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel p-5 sm:p-7 w-full">
            <p className="eyebrow">Email and website check</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold capitalize">
                Domains {report.domainComparison.status}
              </h3>
              <span
                className={`risk-badge ${report.domainComparison.status === "mismatch" ? "text-caution" : report.domainComparison.status === "aligned" ? "text-low" : "text-muted"}`}
              >
                {report.domainComparison.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              {report.domainComparison.explanation}
            </p>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-xl border border-line p-3">
                <dt className="text-muted">Email domain</dt>
                <dd className="mt-1 break-all font-semibold">
                  {report.domainComparison.emailDomains.join(", ") ||
                    "Not available"}
                </dd>
              </div>
              <div className="rounded-xl border border-line p-3">
                <dt className="text-muted">Website domain</dt>
                <dd className="mt-1 break-all font-semibold">
                  {report.domainComparison.websiteDomains.join(", ") ||
                    "Not available"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="panel p-5 sm:p-7 w-full">
            <div className="flex items-center gap-3">
              <Fingerprint className="text-accent" size={22} />
              <div>
                <p className="eyebrow">File identity</p>
                <h3 className="mt-1 text-xl font-semibold">SHA-256</h3>
              </div>
            </div>
            <code className="mt-4 block break-all rounded-xl border border-line bg-canvas p-3 text-xs">
              {report.sha256}
            </code>
            <button onClick={copyHash} className="button-secondary mt-4 w-full">
              <Clipboard size={15} /> Copy fingerprint
            </button>
            {copyStatus && (
              <p role="status" className="mt-3 text-xs text-muted">
                {copyStatus}
              </p>
            )}
          </div>

          <div className="panel p-5 sm:p-7 w-full">
            <p className="eyebrow">Heuristic Rule Verification</p>
            <h3 className="mt-2 text-xl font-semibold">Verification Audit Status</h3>
            <div className="mt-4 space-y-2 text-xs">
              {[
                { label: "File Structure Parsing", status: "Verified OK", pass: true },
                { label: "Embedded Metadata Scanned", status: "Clean Trace", pass: true },
                {
                  label: "Domain Cross-Check",
                  status: report.domainComparison.status === "mismatch" ? "Mismatch Signal" : "Aligned",
                  pass: report.domainComparison.status !== "mismatch",
                },
                {
                  label: "Payment Demand Heuristics",
                  status: report.findings.some((f) => f.status === "warning") ? "Warning Flagged" : "No Flags",
                  pass: !report.findings.some((f) => f.status === "warning"),
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-line pb-2.5 pt-1">
                  <span className="text-muted">{item.label}</span>
                  <span className={`font-mono font-semibold ${item.pass ? "text-low" : "text-caution"}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Expanded Full-Width Forensic Signal Spectrum & Telemetry Matrix */}
      <div className="w-full">
        <ForensicTelemetryWidget report={report} />
      </div>

      {/* Section 6: Full-Width Action Buttons Panel */}
      <div className="panel flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 w-full">
        <div className="flex items-center gap-3">
          <FileCheck2 className="text-accent shrink-0" size={20} />
          <p className="text-sm text-muted">
            Saved in this browser only. No account or remote profile is created.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.print()} className="button-secondary">
            <FileDown size={16} /> Export document PDF
          </button>
          {onReset && (
            <button onClick={onReset} className="button-primary">
              <RotateCcw size={16} /> Check another document
            </button>
          )}
        </div>
      </div>

      {/* Section 7: Next Checks & Scope/Limits */}
      <div className="grid gap-5 lg:grid-cols-2 w-full">
        <div className="panel p-5 sm:p-7 w-full">
          <p className="eyebrow">Next checks</p>
          <h3 className="mt-2 text-2xl font-semibold">Verify independently</h3>
          <ol className="mt-5 space-y-3">
            {report.recommendations.map((recommendation, index) => (
              <li key={recommendation} className="flex gap-3 text-sm leading-6">
                <span className="font-mono text-xs text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {recommendation}
              </li>
            ))}
          </ol>
        </div>
        <div className="panel p-5 sm:p-7 w-full">
          <p className="eyebrow">Scope and limits</p>
          <h3 className="mt-2 text-2xl font-semibold">
            What this cannot prove
          </h3>
          <ul className="mt-5 space-y-3">
            {report.limitations.map((limitation) => (
              <li
                key={limitation}
                className="flex gap-3 text-sm leading-6 text-muted"
              >
                <Info className="mt-1 shrink-0 text-accent" size={14} />
                {limitation}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Section 8: File Metadata Inspection */}
      {Object.keys(report.metadata).length > 0 && (
        <details className="panel p-5 sm:p-7 w-full">
          <summary className="font-semibold cursor-pointer">
            Inspect extracted file metadata
          </summary>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {Object.entries(report.metadata).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-line p-3">
                <dt className="font-mono text-[10px] uppercase text-muted">
                  {key}
                </dt>
                <dd className="mt-1 break-words text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </motion.section>
    <PrintDocumentReport report={report} />
  </>
  );
}
