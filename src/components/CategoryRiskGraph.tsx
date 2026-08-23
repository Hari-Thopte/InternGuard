"use client";

import type { Category, DocumentCategory, DocumentReport, RiskReport } from "@/lib/types";

const categoryLabels: Record<string, string> = {
  recruiter: "Recruiter Authenticity",
  company: "Company Footprint",
  payment: "Payment & Fees",
  document: "Document Integrity",
  urgency: "Urgency Pressure",
  issuer: "Issuer Identity",
  content: "Readable Content",
  metadata: "File Metadata",
  integrity: "File Integrity",
  verification: "Verification Path",
};

export function CategoryRiskGraph({
  report,
  variant = "dark",
}: {
  report: RiskReport | DocumentReport;
  variant?: "dark" | "white";
}) {
  const isWhite = variant === "white";
  const categories = Object.entries(report.categoryScores).map(([key, score]) => ({
    key,
    score: score as number,
    label: categoryLabels[key] ?? key.replace(/([A-Z])/g, " $1"),
  }));

  return (
    <div
      className={`print-graph-container mt-4 mb-2 rounded-xl border p-4 sm:p-5 transition-all w-full ${
        isWhite
          ? "border-gray-300 bg-white text-gray-900 shadow-sm"
          : "border-line bg-canvas/80 text-ink shadow-inner"
      }`}
    >
      <div
        className={`flex items-center justify-between mb-4 border-b pb-2.5 ${
          isWhite ? "border-gray-200" : "border-line"
        }`}
      >
        <span
          className={`font-mono text-xs uppercase tracking-wider font-bold ${
            isWhite ? "text-gray-900" : "text-accent"
          }`}
        >
          Category Risk Distribution Graph
        </span>
        <span
          className={`font-mono text-[10px] ${
            isWhite ? "text-gray-600 font-semibold" : "text-muted"
          }`}
        >
          Max Scale: 100 Pts
        </span>
      </div>

      {/* Vector Bar Chart for Categories */}
      <div className="space-y-3.5 w-full">
        {categories.map((cat) => {
          const score = cat.score;
          const percentage = Math.min(100, Math.max(0, score));
          const colorClass =
            score >= 40
              ? isWhite ? "bg-[#dc2626]" : "bg-high shadow-[0_0_14px_rgb(var(--high)/0.55)]"
              : score > 0
              ? isWhite ? "bg-[#d97706]" : "bg-caution shadow-[0_0_14px_rgb(var(--caution)/0.55)]"
              : isWhite ? "bg-[#10b981]" : "bg-low/50";

          return (
            <div key={cat.key} className="space-y-1.5 w-full">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isWhite ? "text-gray-900 font-bold" : "text-ink"}`}>
                  {cat.label}
                </span>
                <span className={`font-mono font-bold ${isWhite ? "text-gray-900" : "text-ink"}`}>
                  {score} / 100
                </span>
              </div>
              <div
                className={`relative h-4 w-full overflow-hidden rounded-full border ${
                  isWhite
                    ? "border-gray-300 bg-gray-100"
                    : "border-line/60 bg-line/30"
                }`}
              >
                {/* Background Scale Dividers */}
                <div
                  className={`absolute inset-0 grid grid-cols-4 pointer-events-none divide-x ${
                    isWhite ? "divide-gray-200" : "divide-line/40"
                  }`}
                >
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Graph Scale Markers */}
      <div
        className={`mt-4 flex justify-between font-mono text-[9px] border-t pt-2.5 ${
          isWhite
            ? "border-gray-200 text-gray-700 font-bold"
            : "border-line/40 text-muted"
        }`}
      >
        <span>0 (Clear)</span>
        <span>25 (Minor)</span>
        <span>50 (Elevated)</span>
        <span>75 (Strong)</span>
        <span>100 (Critical)</span>
      </div>
    </div>
  );
}
