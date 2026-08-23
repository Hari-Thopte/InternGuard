"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useScanHistory } from "@/lib/historyStore";
import { ReportView } from "./ReportView";
import { useHydrated } from "@/lib/useHydrated";

export function SavedReport() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const report = useScanHistory().find((item) => item.id === id);
  if (!hydrated)
    return (
      <div className="panel p-8 text-center text-sm text-muted" role="status">
        Opening the locally saved report…
      </div>
    );
  if (!report)
    return (
      <div className="panel p-8 text-center">
        <h1 className="text-3xl font-semibold">
          Report not found in this browser.
        </h1>
        <p className="mt-3 text-muted">
          Local reports do not travel across devices or private-browsing
          sessions.
        </p>
        <Link href="/dashboard" className="button-primary mt-6">
          Return to dashboard
        </Link>
      </div>
    );
  return <ReportView report={report} />;
}
