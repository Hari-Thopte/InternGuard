import Link from "next/link";
import { Info } from "lucide-react";
import type { Category } from "@/lib/types";

const categoryLabels: Record<Category, string> = {
  recruiter: "Recruiter",
  company: "Company",
  payment: "Payment",
  document: "Documents",
  urgency: "Urgency",
};

function overallBand(score: number) {
  if (score < 22) return "Low";
  if (score < 55) return "Caution";
  return "High";
}

export function ScoreGuide({
  align = "right",
  score,
  categoryScores,
}: {
  align?: "left" | "right";
  score?: number;
  categoryScores?: Record<Category, number>;
}) {
  const strongest = categoryScores
    ? (Object.entries(categoryScores) as [Category, number][]).sort(
        (a, b) => b[1] - a[1],
      )[0]
    : null;

  return (
    <details className="group relative">
      <summary className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-full border border-line bg-canvas text-muted hover:border-accent hover:text-accent [&::-webkit-details-marker]:hidden">
        <Info size={15} />
        <span className="sr-only">How risk scoring works</span>
      </summary>
      <div
        className={`absolute top-10 z-40 w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-5 text-left shadow-2xl ${align === "right" ? "right-0" : "left-0"}`}
      >
        <p className="eyebrow">How scoring works</p>
        <h3 className="mt-2 text-lg font-semibold">
          From visible warning signs to one risk band
        </h3>
        <p className="mt-2 text-xs leading-5 text-muted">
          InternGuard does not guess a scam probability. It finds specific
          phrases, assigns known points, and shows the evidence that caused each
          match.
        </p>

        <ol className="mt-4 grid grid-cols-2 gap-2">
          {[
            ["1", "Find a phrase", "Example: “within 24 hours”"],
            ["2", "Add rule points", "Artificial urgency adds 24"],
            [
              "3",
              "Build categories",
              "Recruiter, company, payment, documents, urgency",
            ],
            [
              "4",
              "Choose a band",
              "The combined score maps to Low, Caution, or High",
            ],
          ].map(([number, title, description]) => (
            <li
              key={number}
              className="rounded-xl border border-line bg-canvas p-3"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/15 font-mono text-[10px] font-bold text-accent">
                  {number}
                </span>
                <strong className="text-xs">{title}</strong>
              </div>
              <p className="mt-1.5 text-[11px] leading-4 text-muted">
                {description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          <div className="grid grid-cols-[22fr_33fr_45fr] text-center text-[10px] font-bold">
            <span className="bg-low/15 px-2 py-2 text-low">Low · 0-21</span>
            <span className="bg-caution/15 px-2 py-2 text-caution">
              Caution · 22-54
            </span>
            <span className="bg-high/15 px-2 py-2 text-high">
              High · 55-100
            </span>
          </div>
        </div>

        {score !== undefined && (
          <div className="mt-3 rounded-xl border border-accent/25 bg-accent/10 p-3">
            <p className="text-xs font-semibold">
              This report: {score}/100 → {overallBand(score)}
            </p>
            {strongest && (
              <p className="mt-1 text-[11px] leading-5 text-muted">
                {categoryLabels[strongest[0]]} is the strongest category at{" "}
                {strongest[1]}. Other matched categories provide supporting
                weight.
              </p>
            )}
          </div>
        )}

        <div className="mt-4">
          <p className="text-[11px] font-semibold text-ink">
            Common rule examples
          </p>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            Generic recruiter email +18 · Artificial urgency +24 · Sensitive
            documents +28 · Upfront payment +38
          </p>
        </div>
        <p className="mt-3 border-t border-line pt-3 text-[11px] leading-5 text-muted">
          Final calculation: 55% of the strongest category plus 12% of all five
          category scores, rounded up and capped at 100. It is not a verdict
          about an employer.
        </p>
        <Link
          href="/how-it-works#scoring-method"
          className="mt-3 inline-flex text-xs font-semibold text-accent"
        >
          See every rule and the full method
        </Link>
      </div>
    </details>
  );
}
