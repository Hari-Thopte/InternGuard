import Link from "next/link";
import { SearchX } from "lucide-react";
export default function NotFound() {
  return (
    <main id="main" className="grid min-h-[70vh] place-items-center px-4">
      <div className="panel max-w-xl p-8 text-center">
        <SearchX className="mx-auto text-accent" size={38} />
        <p className="eyebrow mt-6">404 / no evidence found</p>
        <h1 className="mt-3 text-4xl font-semibold">
          This route left no trace.
        </h1>
        <p className="mt-4 text-muted">
          Return to the investigation desk or start a new analysis.
        </p>
        <Link href="/" className="button-primary mt-7">
          Back to InternGuard
        </Link>
      </div>
    </main>
  );
}
