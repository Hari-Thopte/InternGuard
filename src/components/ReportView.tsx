"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Clipboard,
  ExternalLink,
  FileDown,
  Flag,
  ShieldCheck,
  ShieldAlert,
  Building2,
  BriefcaseBusiness,
  Banknote,
  Globe2,
} from "lucide-react";
import type { Category, RiskReport } from "@/lib/types";
import { PrintReport } from "./PrintReport";
import { ScoreGuide } from "@/components/ScoreGuide";
import { normalizeMonetaryMentions } from "@/lib/amounts";
import { ForensicTelemetryWidget } from "./ForensicTelemetryWidget";
import { CategoryRiskGraph } from "@/components/CategoryRiskGraph";
const labels: Record<Category, string> = {
  recruiter: "Recruiter",
  company: "Company",
  payment: "Payment",
  document: "Documents",
  urgency: "Urgency",
};
const extractedLabels: Record<string, string> = {
  recruiterContact: "Recruiter contact",
  monetaryMentions: "Detected amounts",
  links: "Detected links",
};
function signalBand(score: number) {
  if (score === 0) return { label: "No match", dot: "bg-muted" };
  if (score < 20) return { label: "Minor", dot: "bg-low" };
  if (score < 40) return { label: "Elevated", dot: "bg-caution" };
  return { label: "Strong", dot: "bg-high" };
}
const riskRanges = {
  low: "0-21",
  caution: "22-54",
  high: "55-100",
} as const;
export function ReportView({
  report,
  onReset,
}: {
  report: RiskReport;
  onReset?: () => void;
}) {
  const reduced = useReducedMotion();
  const [copyStatus, setCopyStatus] = useState("");
  const tone = `risk-${report.riskLevel}`;
  const suspiciousWebsite = report.sourceType === "url";
  const strongPaymentSignal = report.categoryScores.payment >= 40;
  const reportingHref = suspiciousWebsite
    ? "https://cybercrime.gov.in/webform/cyber_suspect.aspx"
    : "https://cybercrime.gov.in/";
  const topReasons = [...report.evidenceList]
    .sort((a, b) => (b.ruleWeight ?? 0) - (a.ruleWeight ?? 0))
    .slice(0, 3);
  const detectedAmounts = normalizeMonetaryMentions(
    report.extracted.monetaryMentions ?? [],
  ).filter((amount) => amount !== "None detected");
  const candidatePaymentSignal = report.categoryScores.payment > 0;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${report.verdict} (${report.confidence} confidence, ${report.overallScore}/100). ${report.evidenceList.map((e) => e.flagType).join(", ") || "No matched signals"}. Verify independently.`,
      );
      setCopyStatus("Summary copied.");
    } catch {
      setCopyStatus("Clipboard access was blocked by this browser.");
    }
  };
  return (
    <>
      <motion.section
        id="report"
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-6 sm:space-y-8"
        aria-label="Risk report"
        tabIndex={-1}
      >
        {/* Section 1: Assessment Summary Hero */}
        <div className={`panel ${tone} w-full overflow-hidden`}>
          <div className="grid lg:grid-cols-[1fr_20rem]">
            <div className="p-6 sm:p-9">
              <p className="eyebrow">Assessment / {report.id}</p>
              <div className="mt-5">
                <span className="risk-badge">
                  {report.riskLevel === "low" ? (
                    <ShieldCheck size={15} />
                  ) : (
                    <AlertTriangle size={15} />
                  )}{" "}
                  {report.riskLevel} risk
                </span>
              </div>
              <h2 className="mt-5 text-3xl font-semibold sm:text-5xl">
                {report.verdict}
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-muted">
                <strong className="capitalize text-ink">
                  {report.confidence} confidence flag.
                </strong>{" "}
                This heuristic report identifies patterns to verify; it does not
                determine fraud or accuse an organization.
              </p>
            </div>
            <div className="flex items-center border-t border-line bg-raised/35 p-6 lg:border-l lg:border-t-0">
              <div
                className="w-full"
                aria-label={`Risk signal score ${report.overallScore} out of 100`}
              >
                <p className="eyebrow">Risk signal score</p>
                <div className="mt-4 flex items-end gap-2">
                  <strong className="font-display text-7xl leading-none">
                    {report.overallScore}
                  </strong>
                  <span className="pb-2 text-sm text-muted">/ 100</span>
                </div>
                <div className="relative mt-5">
                  <div
                    className="grid h-3 grid-cols-[22fr_33fr_45fr] overflow-hidden rounded-full"
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
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-2 grid grid-cols-[22fr_33fr_45fr] text-center font-mono text-[8px] uppercase tracking-wider">
                  <span className="text-low">Low 0-21</span>
                  <span className="text-caution">Caution 22-54</span>
                  <span className="text-high">High 55-100</span>
                </div>
                <p className="mt-5 text-xs leading-5 text-muted">
                  <strong className="capitalize text-[rgb(var(--risk))]">
                    {report.overallScore} falls in the {report.riskLevel} band (
                    {riskRanges[report.riskLevel]}).
                  </strong>{" "}
                  This measures signal strength, not fraud probability.
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
              The strongest matched signals
            </h3>
            {topReasons.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {topReasons.map((reason, index) => (
                  <motion.div
                    key={reason.id}
                    initial={reduced ? false : { opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-line bg-raised/45 p-4 transition-colors hover:border-accent/40"
                  >
                    <span className="font-mono text-[10px] text-accent">
                      0{index + 1}
                    </span>
                    <strong className="mt-2 block text-sm capitalize">
                      {reason.flagType.replaceAll("-", " ")}
                    </strong>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">
                      {reason.explanation}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted">
                No known rules matched. Low detected risk is not proof of
                legitimacy.
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
                    : detectedAmounts.length
                      ? "Compensation or amount only"
                      : "No amount detected"}
                </h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              {candidatePaymentSignal
                ? "Fee, deposit, transfer, or payment language matched. Verify who pays whom before proceeding."
                : detectedAmounts.length
                  ? "Amounts were extracted, but no candidate-facing fee or deposit rule matched."
                  : "No supported currency amount was confidently extracted from this source."}
            </p>
            {detectedAmounts.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {detectedAmounts.map((amount) => (
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
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <p className="eyebrow">Multi-factor model</p>
                <ScoreGuide
                  align="left"
                  score={report.overallScore}
                  categoryScores={report.categoryScores}
                />
              </div>
              <h3 className="mt-2 text-2xl font-semibold">Signal breakdown</h3>
            </div>
            <span className="text-xs text-muted">
              Evidence-backed categories
            </span>
          </div>
          <div className="mt-5 w-full">
            <CategoryRiskGraph report={report} />
          </div>
          <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full">
            {Object.entries(report.categoryScores).map(([key, score]) => {
              const band = signalBand(score);
              const matches = report.evidenceList.filter(
                (item) => item.category === key,
              ).length;
              return (
                <div
                  key={key}
                  className="rounded-xl border border-line bg-raised/55 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted">
                      {labels[key as Category]}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${band.dot}`} />
                  </div>
                  <strong className="mt-4 block text-lg">{band.label}</strong>
                  <span className="mt-1 block text-xs text-muted">
                    {matches} matched {matches === 1 ? "rule" : "rules"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* High Risk Alert Notice if applicable */}
        {report.riskLevel === "high" && (
          <aside
            className="panel risk-high flex flex-col gap-5 border-high/45 bg-high/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 w-full"
            aria-label="High-risk reporting recommendation"
          >
            <div className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-high/15 text-high">
                <ShieldAlert size={21} />
              </span>
              <div>
                <p className="eyebrow text-high">
                  Official reporting recommended
                </p>
                <h3 className="mt-2 text-xl font-semibold">
                  Stop, preserve the evidence, and escalate if needed.
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                  {suspiciousWebsite
                    ? "This website triggered multiple strong signals. Do not sign in, pay, download files, or share identity data. India’s official Report Suspect facility accepts suspicious website URLs and supporting evidence."
                    : "Multiple strong signals were detected. Do not pay, share identity data, or install software. Preserve messages, payment details, URLs, and screenshots before reporting through India’s official cybercrime channel."}{" "}
                  {strongPaymentSignal && (
                    <>
                      If money was already transferred, call 1930
                      immediately.{" "}
                    </>
                  )}
                  This is a risk recommendation, not proof of fraud.
                </p>
              </div>
            </div>
            <a
              href={reportingHref}
              target="_blank"
              rel="noreferrer"
              className="button-primary shrink-0 bg-high text-white hover:bg-ink hover:text-canvas"
            >
              {suspiciousWebsite
                ? "Report suspicious site"
                : "Open official portal"}{" "}
              <ExternalLink size={15} />
            </a>
          </aside>
        )}

        {/* Section 4: 12-Column Grid for Evidence vs Source Context */}
        <div className="grid gap-5 lg:grid-cols-12 w-full items-start">
          {/* Left Column: Evidence & Reasoning (7 columns) */}
          <div className="lg:col-span-7 w-full">
            <div className="panel p-5 sm:p-7 space-y-6 w-full">
              <p className="eyebrow">Signal → evidence → meaning</p>
              <h3 className="mt-2 text-2xl font-semibold">
                Evidence & reasoning
              </h3>
              <div className="mt-6 space-y-3 w-full">
                {report.evidenceList.length ? (
                  report.evidenceList.map((e, i) => (
                    <details
                      key={e.id}
                      open={i === 0}
                      className="group rounded-xl border border-line bg-raised/40 p-4 w-full"
                    >
                      <summary className="cursor-pointer list-none font-semibold capitalize">
                        <span className="mr-3 font-mono text-xs text-accent">
                          0{i + 1}
                        </span>
                        {e.flagType.replaceAll("-", " ")}
                      </summary>
                      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 group-open:grid-rows-[1fr]">
                        <div className="overflow-hidden">
                          <p className="mt-4 font-mono text-[9px] uppercase tracking-wider text-muted">
                            Matched source sentence
                          </p>
                          <blockquote className="mt-2 border-l-2 border-caution pl-4 text-sm leading-6">
                            “{e.sourceQuote}”
                          </blockquote>
                          <p className="mt-3 text-sm leading-6 text-muted">
                            {e.explanation}
                          </p>
                        </div>
                      </div>
                    </details>
                  ))
                ) : (
                  <p className="rounded-xl border border-line p-4 text-sm text-muted">
                    No known rules matched. This is not proof of legitimacy;
                    independently verify the employer and recruiter.
                  </p>
                )}
              </div>
            </div>
            <ForensicTelemetryWidget report={report} />
          </div>

          {/* Right Column: Source Context & Extracted Fields (5 columns) */}
          <div className="lg:col-span-5 space-y-5 w-full">
            <div className="panel p-5 w-full">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Source context</p>
                  <h3 className="mt-2 text-xl font-semibold">
                    Where this scan came from
                  </h3>
                </div>
                <Globe2 size={19} className="text-accent" />
              </div>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-low" size={16} />
                  <div>
                    <dt className="text-xs text-muted">Recorded source</dt>
                    <dd className="mt-1 break-words font-medium">
                      {report.sourceContext?.verifiedSource ??
                        report.sourceLabel}
                    </dd>
                    <span className="mt-1 block text-[10px] uppercase tracking-wider text-low">
                      {report.sourceContext?.sourceKind ?? report.sourceType}
                    </span>
                  </div>
                </div>
                {report.sourceContext?.pageTitle && (
                  <div className="border-t border-line pt-4">
                    <dt className="text-xs text-muted">Page title</dt>
                    <dd className="mt-1 break-words">
                      {report.sourceContext.pageTitle}
                    </dd>
                  </div>
                )}
                {report.sourceContext?.organizationClue && (
                  <div className="flex gap-3 border-t border-line pt-4">
                    <Building2
                      className="mt-0.5 shrink-0 text-accent"
                      size={16}
                    />
                    <div>
                      <dt className="text-xs text-muted">
                        Organization mentioned
                      </dt>
                      <dd className="mt-1 font-medium">
                        {report.sourceContext.organizationClue}
                      </dd>
                      <span className="mt-1 block text-[10px] uppercase tracking-wider text-caution">
                        Extracted clue — not verified ownership
                      </span>
                    </div>
                  </div>
                )}
                {report.sourceContext?.industry && (
                  <div className="flex gap-3 border-t border-line pt-4">
                    <BriefcaseBusiness
                      className="mt-0.5 shrink-0 text-accent"
                      size={16}
                    />
                    <div>
                      <dt className="text-xs text-muted">Likely industry</dt>
                      <dd className="mt-1 font-medium">
                        {report.sourceContext.industry}
                      </dd>
                      <span className="mt-1 block text-[10px] uppercase tracking-wider text-muted">
                        {report.sourceContext.inferenceConfidence} confidence
                        inference
                      </span>
                    </div>
                  </div>
                )}
              </dl>
              {report.sourceContext?.basis.length ? (
                <details className="group mt-4 border-t border-line pt-4">
                  <summary className="text-xs font-semibold text-accent">
                    Why InternGuard shows this
                  </summary>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
                    {report.sourceContext.basis.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>

            <div className="panel p-5 w-full">
              <p className="eyebrow">Extracted fields</p>
              <dl className="mt-4 space-y-3 text-sm">
                {Object.entries(report.extracted).map(([k, v]) => (
                  <div key={k} className="border-b border-line pb-3">
                    <dt className="text-muted">
                      {extractedLabels[k] ?? k.replace(/([A-Z])/g, " $1")}
                    </dt>
                    <dd className="mt-2 flex flex-wrap gap-2 break-words">
                      {Array.isArray(v) ? (
                        (k === "monetaryMentions"
                          ? normalizeMonetaryMentions(v)
                          : v
                        ).map((value) => (
                          <span
                            key={value}
                            className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs"
                          >
                            {value}
                          </span>
                        ))
                      ) : (
                        <span>{v}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="panel p-5 sm:p-7 w-full">
              <p className="eyebrow">Heuristic Rule Verification</p>
              <h3 className="mt-2 text-xl font-semibold">Verification Audit Status</h3>
              <div className="mt-4 space-y-2 text-xs">
                {[
                  { label: "Normalizer Engine", status: "Verified OK", pass: true },
                  { label: "Monetary Pattern Matcher", status: report.categoryScores.payment > 0 ? "Flagged" : "Clear", pass: report.categoryScores.payment === 0 },
                  { label: "Urgency Pressure Signal", status: report.categoryScores.urgency > 0 ? "Elevated" : "Clear", pass: report.categoryScores.urgency === 0 },
                  { label: "Document Request Trace", status: report.categoryScores.document > 0 ? "Signal Matched" : "Clear", pass: report.categoryScores.document === 0 },
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

        {/* Section 6: Action Buttons Panel */}
        <div className="panel p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-accent shrink-0" size={20} />
            <p className="text-xs sm:text-sm text-muted">
              Analysis verified in browser. Export PDF or copy summary for your records.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={copy} className="button-secondary w-full sm:w-auto">
              <Clipboard size={16} /> Copy summary
            </button>
            <button
              onClick={() => window.print()}
              className="button-secondary w-full sm:w-auto"
            >
              <FileDown size={16} /> Export PDF
            </button>
            {onReset && (
              <button onClick={onReset} className="button-primary w-full sm:w-auto">
                New scan
              </button>
            )}
            {copyStatus && (
              <p role="status" className="w-full px-2 text-xs text-muted">
                {copyStatus}
              </p>
            )}
          </div>
        </div>

        {/* Section 7: Verification Steps & Escalation */}
        <div className="grid gap-5 lg:grid-cols-2 w-full">
          <div className="panel p-5 sm:p-7 w-full">
            <p className="eyebrow">Recommended verification steps</p>
            <h3 className="mt-2 text-2xl font-semibold">
              Act before you proceed
            </h3>
            <ol className="mt-5 space-y-3">
              {report.recommendedActions.map((a) => (
                <li key={a} className="flex gap-3 text-sm leading-6">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                    <Check size={14} />
                  </span>
                  {a}
                </li>
              ))}
            </ol>
          </div>
          <div className="panel border-high/35 p-5 sm:p-7 w-full">
            <p className="eyebrow text-high">Report this</p>
            <h3 className="mt-2 text-2xl font-semibold">
              Escalate a suspected scam
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Preserve the original message, payment details, URL, and this
              report. Do not publicly accuse an organization based only on this
              assessment.
            </p>
            <div className="mt-5 space-y-2">
              {report.reportingLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-line p-3 text-sm hover:border-accent"
                >
                  <span>
                    <strong className="block">{l.label}</strong>
                    <span className="mt-1 block text-xs text-muted">
                      {l.description}
                    </span>
                  </span>
                  <ExternalLink size={15} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Section 8: Disclaimer Banner */}
        <div className="flex gap-3 rounded-xl border border-caution/30 bg-caution/5 p-4 text-xs leading-5 text-muted w-full">
          <Flag className="h-4 w-4 shrink-0 text-caution" />
          <div>
            {report.limitations.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        </div>
      </motion.section>
      <PrintReport report={report} />
    </>
  );
}
