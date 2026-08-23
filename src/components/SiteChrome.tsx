import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { ScrollProgress } from "./ScrollProgress";
import { MobileNav } from "./MobileNav";
const nav = [
  ["Dashboard", "/dashboard"],
  ["How it works", "/how-it-works"],
  ["Red flags", "/red-flags"],
  ["Trust & safety", "/about"],
];
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-canvas/85 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between">
        <Link href="/" aria-label="InternGuard home">
          <Logo />
        </Link>
        <nav className="hidden gap-7 lg:flex" aria-label="Primary">
          {nav.map(([l, h]) => (
            <Link
              key={h}
              href={h}
              className="text-sm text-muted hover:text-ink"
            >
              {l}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/analyze"
            className="button-primary hidden sm:inline-flex"
          >
            Analyze opportunity <ArrowUpRight size={15} />
          </Link>
          <MobileNav items={nav} />
        </div>
      </div>
      <ScrollProgress />
    </header>
  );
}
export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="shell grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
            Rule-based internship risk intelligence. Every flag traces back to
            evidence; no report confirms fraud.
          </p>
        </div>
        <div>
          <h3 className="eyebrow">Explore</h3>
          <div className="mt-4 grid gap-3 text-sm">
            {nav.map(([l, h]) => (
              <Link key={h} href={h}>
                {l}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="eyebrow">Act</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href="/contact">Report a concern</Link>
            <a
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noreferrer"
            >
              Cyber Crime Portal ↗
            </a>
            <Link href="/analyze">Start an analysis</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:justify-between">
          <span>© 2026 InternGuard</span>
          <span>Risk signals, not accusations. Verify independently.</span>
        </div>
      </div>
    </footer>
  );
}
