"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useDeferredValue, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  FileCheck2,
  FileImage,
  FileSearch,
  Flag,
  Globe2,
  MessageSquareText,
  ShieldCheck,
  SlidersHorizontal,
  RotateCcw,
  Download,
  GitCompareArrows,
  Search,
  Trash2,
} from "lucide-react";
import type { Category, RiskLevel } from "@/lib/types";
import {
  clearScanHistory,
  deleteScanReport,
  useScanHistory,
} from "@/lib/historyStore";
import {
  clearDocumentHistory,
  deleteDocumentReport,
  useDocumentHistory,
} from "@/lib/documentHistoryStore";
import {
  averageProfile,
  createDashboardRecords,
  type DashboardSource,
} from "@/lib/dashboardRecords";
import { CountUp } from "./CountUp";
import { ScoreGuide } from "@/components/ScoreGuide";
import { useHydrated } from "@/lib/useHydrated";

const categories: Category[] = [
  "recruiter",
  "company",
  "payment",
  "document",
  "urgency",
];
const categoryLabels: Record<Category, string> = {
  recruiter: "Recruiter",
  company: "Company",
  payment: "Payment",
  document: "Documents",
  urgency: "Urgency",
};
const sourceIcons = {
  text: MessageSquareText,
  image: FileImage,
  url: Globe2,
  document: FileCheck2,
} satisfies Record<DashboardSource, typeof MessageSquareText>;
type TimeRange = "7" | "30" | "90" | "365" | "all";
const rangeLabels: Record<TimeRange, string> = {
  "7": "Last 7 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
  "365": "Last year",
  all: "All time",
};
const distributionColors = {
  low: { bar: "bg-low", text: "text-low" },
  caution: { bar: "bg-caution", text: "text-caution" },
  high: { bar: "bg-high", text: "text-high" },
} as const;
const RiskTrendChart = dynamic(
  () => import("./RiskTrendChart").then((module) => module.RiskTrendChart),
  {
    loading: () => (
      <div className="grid h-full place-items-center rounded-xl bg-raised/30 text-xs text-muted">
        Loading chart…
      </div>
    ),
  },
);

export function Dashboard() {
  const scanHistory = useScanHistory();
  const documentHistory = useDocumentHistory();
  const hydrated = useHydrated();
  const history = useMemo(
    () => createDashboardRecords(scanHistory, documentHistory),
    [scanHistory, documentHistory],
  );
  const reduced = useReducedMotion();
  const [risk, setRisk] = useState<"all" | RiskLevel>("all");
  const [source, setSource] = useState("all");
  const [range, setRange] = useState<TimeRange>("30");
  const [query, setQuery] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [timeAnchor] = useState(Date.now);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const recent = useMemo(
    () =>
      history.filter((item) => {
        const age =
          (timeAnchor - new Date(item.createdAt).getTime()) / 86400000;
        return (
          (range === "all" || age <= Number(range)) &&
          (risk === "all" || item.riskLevel === risk) &&
          (source === "all" || item.sourceType === source) &&
          (!deferredQuery ||
            [
              item.title,
              item.organization,
              item.industry,
              item.fileName,
              item.sourceLabel,
              ...item.amounts,
              ...item.reasons,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(deferredQuery))
        );
      }),
    [history, risk, source, range, deferredQuery, timeAnchor],
  );
  const average = recent.length
    ? Math.round(
        recent.reduce((sum, item) => sum + item.overallScore, 0) /
          recent.length,
      )
    : 0;
  const highCount = recent.filter((item) => item.riskLevel === "high").length;
  const cautionCount = recent.filter(
    (item) => item.riskLevel === "caution",
  ).length;
  const profile = averageProfile(recent);
  const categoryAverages = categories.map((category) => ({
    category,
    label: categoryLabels[category],
    score: profile[category],
  }));
  const strongest = [...categoryAverages].sort((a, b) => b.score - a.score)[0];
  const trend = [...recent].reverse().map((item) => ({
    date: new Date(item.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    score: item.overallScore,
  }));
  const stats = [
    {
      label: "Scans in view",
      value: recent.length,
      note: rangeLabels[range],
      icon: FileSearch,
    },
    {
      label: "Needs attention",
      value: highCount + cautionCount,
      note: `${highCount} high risk`,
      icon: Flag,
    },
    {
      label: "Average signal",
      value: average,
      note: "Out of 100",
      icon: BarChart3,
    },
    {
      label: "Low risk",
      value: recent.filter((item) => item.riskLevel === "low").length,
      note: "Still verify",
      icon: ShieldCheck,
    },
  ];
  const activeFilters = [
    ...(risk !== "all" ? [`Risk: ${risk}`] : []),
    ...(source !== "all"
      ? [
          `Source: ${source === "text" ? "message" : source === "image" ? "screenshot" : source === "url" ? "webpage" : "document"}`,
        ]
      : []),
    ...(range !== "30" ? [`Time: ${rangeLabels[range]}`] : []),
    ...(query.trim() ? [`Search: ${query.trim()}`] : []),
  ];
  const clearFilters = () => {
    setRisk("all");
    setSource("all");
    setRange("30");
    setQuery("");
  };
  const selectedRecords = compareIds
    .map((id) => history.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const toggleCompare = (id: string) =>
    setCompareIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current.slice(-1), id],
    );
  const removeRecord = (kind: "opportunity" | "document", id: string) => {
    if (!window.confirm("Delete this locally stored report?")) return;
    const deleted =
      kind === "document" ? deleteDocumentReport(id) : deleteScanReport(id);
    if (!deleted) {
      setHistoryError(
        "This browser did not allow the report to be removed from local storage.",
      );
      return;
    }
    setHistoryError("");
    setCompareIds((current) => current.filter((item) => item !== id));
  };
  const clearHistory = () => {
    if (
      !window.confirm(
        "Delete all locally stored report history? This cannot be undone.",
      )
    )
      return;
    const scansCleared = clearScanHistory();
    const documentsCleared = clearDocumentHistory();
    if (!scansCleared || !documentsCleared) {
      setHistoryError(
        "Some local history could not be deleted. Check this browser's storage permissions.",
      );
      return;
    }
    setHistoryError("");
    setCompareIds([]);
  };
  const exportHistory = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            opportunityReports: scanHistory,
            documentReports: documentHistory,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `internguard-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
  };

  if (!hydrated)
    return (
      <div className="panel grid min-h-96 place-items-center p-8" role="status">
        <div className="text-center">
          <FileSearch className="mx-auto animate-pulse text-accent" />
          <p className="mt-4 text-sm text-muted">
            Loading local report history…
          </p>
        </div>
      </div>
    );

  if (!history.length)
    return (
      <div className="panel grid min-h-96 place-items-center overflow-hidden p-8 text-center">
        <div className="max-w-xl">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
            <FileSearch />
          </span>
          <p className="eyebrow mt-6">No reports yet</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Your safety dashboard starts with one scan.
          </h2>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-muted">
            Analyze a recruiter message, screenshot, public listing, or
            document. Reports remain in this browser and appear here
            automatically.
          </p>
          <Link href="/analyze" className="button-primary mt-7">
            Analyze an opportunity <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );

  return (
    <div className="space-y-5">
      {historyError && (
        <div
          role="alert"
          className="rounded-xl border border-high/35 bg-high/10 p-4 text-sm"
        >
          {historyError}
        </div>
      )}
      <section className="panel">
        <div className="flex flex-col gap-5 border-b border-line bg-raised/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <p className="eyebrow">Activity overview</p>
              <ScoreGuide align="left" />
            </div>
            <h2 className="mt-2 text-2xl font-semibold">
              Your recent safety checks
            </h2>
            <p className="mt-1 text-sm text-muted">
              Only reports stored in this browser are included.
            </p>
          </div>
          <Link href="/analyze" className="button-primary shrink-0">
            New analysis <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, note, icon: Icon }, index) => (
            <motion.article
              key={label}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : index * 0.06 }}
              className={`p-5 sm:p-6 ${index % 2 ? "border-l border-line" : ""} ${index > 1 ? "border-t border-line lg:border-t-0" : ""} ${index > 0 ? "lg:border-l lg:border-line" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-muted">{label}</span>
                <Icon size={17} className="text-accent" />
              </div>
              <strong className="mt-5 block font-display text-4xl">
                <CountUp value={value} />
              </strong>
              <span className="mt-1 block text-xs text-muted">{note}</span>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="panel p-4 lg:sticky lg:top-20 lg:z-30 lg:bg-surface/90 lg:backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 pr-3 text-sm font-semibold">
            <SlidersHorizontal size={16} className="text-accent" />
            Filter reports
          </div>
          <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="dashboard-filter">
              <span>Search reports</span>
              <span className="flex items-center gap-2">
                <Search size={14} className="text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Company, file, industry"
                  className="min-w-0 flex-1 bg-transparent text-right outline-none placeholder:text-muted/70"
                />
              </span>
            </label>
            <label className="dashboard-filter">
              <span>Risk level</span>
              <select
                value={risk}
                onChange={(event) => setRisk(event.target.value as typeof risk)}
              >
                <option value="all">All risk levels</option>
                <option value="low">Low</option>
                <option value="caution">Caution</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="dashboard-filter">
              <span>Source</span>
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
              >
                <option value="all">All sources</option>
                <option value="text">Text</option>
                <option value="image">Screenshot</option>
                <option value="url">Webpage</option>
                <option value="document">Document</option>
              </select>
            </label>
            <label className="dashboard-filter">
              <span>Time range</span>
              <select
                value={range}
                onChange={(event) => setRange(event.target.value as TimeRange)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
            </label>
          </div>
          {activeFilters.length > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="button-secondary min-h-10 shrink-0 px-4"
            >
              <RotateCcw size={14} /> Clear
            </button>
          )}
        </div>
        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-medium capitalize text-accent"
              >
                {filter}
              </span>
            ))}
          </div>
        )}
      </section>

      {selectedRecords.length > 0 && (
        <section className="panel p-5 sm:p-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Scan comparison</p>
              <h2 className="mt-2 text-xl font-semibold">
                {selectedRecords.length === 1
                  ? "Choose one more report"
                  : "Side-by-side signal check"}
              </h2>
            </div>
            <button
              className="button-secondary"
              onClick={() => setCompareIds([])}
            >
              Clear comparison
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {selectedRecords.map((item) => (
              <div
                key={item.id}
                className={`risk-${item.riskLevel} rounded-xl border border-line bg-raised/40 p-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <strong className="min-w-0 truncate">{item.title}</strong>
                  <span className="risk-badge">{item.riskLevel}</span>
                </div>
                <strong className="mt-4 block font-display text-4xl">
                  {item.overallScore}
                  <small className="text-sm text-muted"> /100</small>
                </strong>
                <p className="mt-3 text-xs leading-5 text-muted">
                  {item.reasons.slice(0, 2).join(" · ") ||
                    "No warning reasons recorded."}
                </p>
                <p className="mt-2 text-xs text-caution">
                  {item.amounts.join(", ") || "No amount detected"}
                </p>
              </div>
            ))}
          </div>
          {selectedRecords.length === 2 && (
            <p className="mt-4 text-sm text-muted">
              Signal-score difference:{" "}
              <strong className="text-ink">
                {Math.abs(
                  selectedRecords[0].overallScore -
                    selectedRecords[1].overallScore,
                )}{" "}
                points
              </strong>
              . Compare the evidence, not only the number.
            </p>
          )}
        </section>
      )}

      {!recent.length ? (
        <section className="panel p-10 text-center">
          <CalendarDays className="mx-auto text-muted" />
          <h2 className="mt-4 text-2xl font-semibold">
            No reports match these filters.
          </h2>
          <p className="mt-2 text-sm text-muted">
            Adjust the risk, source, or time range to bring reports back into
            view.
          </p>
          <button onClick={clearFilters} className="button-secondary mt-5">
            <RotateCcw size={14} /> Reset filters
          </button>
        </section>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
            <motion.section
              className="panel p-5 sm:p-6"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Risk trend</p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Signal score over time
                  </h2>
                </div>
                <span className="text-xs text-muted">0-100 scale</span>
              </div>
              <div className="mt-6 h-64">
                <RiskTrendChart data={trend} reducedMotion={reduced} />
              </div>
            </motion.section>
            <motion.section
              className="panel p-5 sm:p-6"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : 0.08 }}
            >
              <p className="eyebrow">Signal profile</p>
              <h2 className="mt-2 text-2xl font-semibold">
                Average by category
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted">
                {strongest.score
                  ? `${strongest.label} is the strongest signal in this view.`
                  : "No category signals detected."}
              </p>
              <div className="mt-6 space-y-5">
                {categoryAverages.map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between text-xs">
                      <span>{item.label}</span>
                      <strong>{item.score}</strong>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-line/35">
                      <motion.div
                        className="h-full rounded-full bg-accent"
                        initial={reduced ? false : { width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          <section className="panel p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Risk distribution</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Reports by concern band
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={exportHistory} className="button-secondary">
                  <Download size={15} /> Export history
                </button>
                <button
                  onClick={clearHistory}
                  className="button-secondary text-high"
                >
                  <Trash2 size={15} /> Delete all history
                </button>
              </div>
            </div>
            <div
              className="mt-6 flex h-3 overflow-hidden rounded-full bg-line/30"
              aria-label={`${recent.filter((item) => item.riskLevel === "low").length} low, ${cautionCount} caution, ${highCount} high risk reports`}
            >
              {(["low", "caution", "high"] as const).map((level) => {
                const count = recent.filter(
                  (item) => item.riskLevel === level,
                ).length;
                return count ? (
                  <motion.span
                    key={level}
                    initial={reduced ? false : { width: 0 }}
                    animate={{ width: `${(count / recent.length) * 100}%` }}
                    className={distributionColors[level].bar}
                  />
                ) : null;
              })}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              {(["low", "caution", "high"] as const).map((level) => (
                <div key={level} className="rounded-xl border border-line p-3">
                  <span
                    className={`capitalize ${distributionColors[level].text}`}
                  >
                    {level}
                  </span>
                  <strong className="mt-1 block text-2xl">
                    {recent.filter((item) => item.riskLevel === level).length}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section className="panel overflow-hidden">
            <div className="flex items-end justify-between gap-4 border-b border-line p-5 sm:p-6">
              <div>
                <p className="eyebrow">Report history</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Recent investigations
                </h2>
              </div>
              <span className="text-xs text-muted">{recent.length} shown</span>
            </div>
            <div className="divide-y divide-line">
              {recent.map((report) => {
                const Icon = sourceIcons[report.sourceType];
                return (
                  <article
                    key={report.id}
                    className="flex items-stretch hover:bg-raised/45"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCompare(report.id)}
                      aria-pressed={compareIds.includes(report.id)}
                      aria-label={`${compareIds.includes(report.id) ? "Remove" : "Add"} ${report.title} ${compareIds.includes(report.id) ? "from" : "to"} comparison`}
                      className={`w-11 shrink-0 border-r border-line transition hover:text-accent ${compareIds.includes(report.id) ? "bg-accent/10 text-accent" : "text-muted"}`}
                      title="Compare report"
                    >
                      <GitCompareArrows size={16} className="mx-auto" />
                    </button>
                    <Link
                      href={report.href}
                      className="group grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-3 p-4 sm:p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center"
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-raised text-accent">
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm">
                          {report.title}
                        </strong>
                        <span className="mt-1 block break-words text-xs leading-5 text-muted">
                          <span className="capitalize text-ink">
                            {report.sourceType === "text"
                              ? "Pasted message"
                              : report.sourceType === "image"
                                ? "Screenshot"
                                : report.sourceType === "url"
                                  ? "Webpage"
                                  : "Document"}
                          </span>{" "}
                          · {report.fileName ?? report.sourceLabel} ·{" "}
                          {new Date(report.createdAt).toLocaleString()} ·{" "}
                          {report.confidenceLabel}
                        </span>
                        {report.industry && (
                          <span className="mt-1 block text-[10px] text-accent">
                            {report.industry} · inferred
                          </span>
                        )}
                        {(report.amounts.length > 0 ||
                          report.reasons.length > 0) && (
                          <span className="mt-2 flex flex-wrap gap-1.5">
                            {report.amounts
                              .slice(0, 3)
                              .map((amount, amountIndex) => (
                                <span
                                  key={`${report.id}-amount-${amountIndex}`}
                                  className="rounded-full border border-caution/25 bg-caution/10 px-2 py-0.5 text-[10px] font-semibold text-caution"
                                >
                                  {amount}
                                </span>
                              ))}
                            {report.reasons
                              .slice(0, 2)
                              .map((reason, reasonIndex) => (
                                <span
                                  key={`${report.id}-reason-${reasonIndex}`}
                                  className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[10px] text-muted"
                                >
                                  {reason}
                                </span>
                              ))}
                          </span>
                        )}
                      </span>
                      <span className="col-span-2 flex items-center justify-between gap-3 pl-14 lg:col-span-1 lg:pl-0">
                        <span
                          className={`risk-badge risk-${report.riskLevel} w-fit`}
                        >
                          {report.riskLevel}
                        </span>
                        <span className="flex items-center gap-3">
                          <strong className="font-display text-2xl">
                            {report.overallScore}
                          </strong>
                          <small className="text-muted"> /100</small>
                          <ArrowRight
                            size={17}
                            className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent"
                          />
                        </span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeRecord(report.kind, report.id)}
                      aria-label={`Delete ${report.title}`}
                      className="w-11 shrink-0 border-l border-line text-muted transition hover:bg-high/10 hover:text-high"
                      title="Delete saved report"
                    >
                      <Trash2 size={16} className="mx-auto" />
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
