"use client";
import { AlertTriangle } from "lucide-react";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[65vh] place-items-center px-4">
      <div className="panel max-w-lg p-8 text-center">
        <AlertTriangle className="mx-auto text-high" />
        <h1 className="mt-5 text-3xl font-semibold">
          The page could not be assembled.
        </h1>
        <p className="mt-3 text-sm text-muted">
          Your evidence was not replaced with sample data. Try loading the page
          again.
        </p>
        <button onClick={reset} className="button-primary mt-6">
          Try again
        </button>
      </div>
    </main>
  );
}
