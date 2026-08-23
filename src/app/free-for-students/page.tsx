import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
export const metadata = { title: "Free for Students" };
export default function Free() {
  return (
    <main id="main" className="section">
      <div className="shell">
        <div className="mx-auto max-w-4xl text-center">
          <p className="eyebrow">Free for students</p>
          <h1 className="display mt-5">
            Safety should not sit behind a paywall.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted">
            Analyze messages, screenshots, and public listings without an
            account or payment.
          </p>
        </div>
        <div className="panel mx-auto mt-12 max-w-3xl p-7 sm:p-10">
          <div className="flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end">
            <div>
              <span className="eyebrow">Student access</span>
              <strong className="mt-3 block font-display text-4xl">₹0</strong>
            </div>
            <span className="text-sm text-muted">
              No trial. No card. No hidden verdict engine.
            </span>
          </div>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2">
            {[
              "Text risk analysis",
              "Screenshot OCR",
              "Protected public URL retrieval",
              "Five-category score breakdown",
              "Exact evidence quotes",
              "Verification and reporting actions",
              "Browser-local scan history",
              "PDF-ready report export",
            ].map((x) => (
              <li key={x} className="flex gap-3 text-sm">
                <Check size={17} className="text-low" />
                {x}
              </li>
            ))}
          </ul>
          <Link href="/analyze" className="button-primary mt-8 w-full">
            Start an investigation <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
