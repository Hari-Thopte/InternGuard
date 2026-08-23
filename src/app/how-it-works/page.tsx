import {
  ArrowDown,
  Braces,
  FileSearch,
  Gauge,
  ListChecks,
  Scale,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
export const metadata = { title: "How it works" };
const steps = [
  [
    Braces,
    "Extract",
    "Readable content and structured fields are separated from presentation.",
  ],
  [
    FileSearch,
    "Detect",
    "Explicit patterns inspect payments, contacts, documents, claims, and pressure.",
  ],
  [
    Gauge,
    "Score",
    "Five categories receive bounded contributions instead of one opaque guess.",
  ],
  [
    Scale,
    "Qualify",
    "Evidence quantity and context determine confidence alongside risk level.",
  ],
  [
    ListChecks,
    "Act",
    "Verification steps and official reporting paths turn findings into action.",
  ],
];
const scoreRules = [
  ["Candidate-paid fee", "Payment", "+38", "Money requested before joining"],
  ["Interview fee", "Payment", "+38", "Money required to enter selection"],
  ["Unofficial payment", "Payment", "+34", "UPI, wallet, crypto, or gift card"],
  [
    "Required equipment purchase",
    "Payment",
    "+34",
    "Recruiter-directed device or starter-kit purchase",
  ],
  [
    "Mandatory paid training",
    "Payment",
    "+30",
    "Paid course required before onboarding",
  ],
  ["Credential request", "Documents", "+36", "Password, OTP, or remote access"],
  [
    "Sensitive documents",
    "Documents",
    "+28",
    "Aadhaar, PAN, passport, or bank data",
  ],
  [
    "Software download",
    "Documents",
    "+28",
    "Unverified APK, EXE, or remote app",
  ],
  [
    "Artificial urgency",
    "Urgency",
    "+24",
    "Pressure such as “within 30 minutes”",
  ],
  [
    "Unrealistic compensation",
    "Company",
    "+22",
    "Exceptional pay requiring verification",
  ],
  [
    "Guaranteed selection",
    "Company",
    "+18",
    "No interview or guaranteed placement",
  ],
  ["Shortened link", "Company", "+16", "Destination hidden behind a short URL"],
  [
    "Generic recruiter email",
    "Recruiter",
    "+18",
    "Free mailbox needing verification",
  ],
  [
    "Chat-only recruitment",
    "Recruiter",
    "+16",
    "Process restricted to WhatsApp or Telegram",
  ],
] as const;
export default function How() {
  return (
    <main id="main">
      <section className="section border-b border-line">
        <div className="shell max-w-4xl">
          <p className="eyebrow">Transparent methodology</p>
          <h1 className="display mt-5">
            A rule engine you can{" "}
            <span className="text-accent">interrogate.</span>
          </h1>
          <p className="mt-7 text-lg leading-8 text-muted">
            InternGuard is not a trained fraud-prediction model. That is
            deliberate: each signal has a named rule, bounded score, exact
            source quote, and plain-language reason.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <div className="mx-auto max-w-3xl">
            {steps.map(([I, t, d], i) => (
              <Reveal key={String(t)}>
                <div className="panel p-6 sm:p-8">
                  <div className="flex gap-5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                      <I />
                    </span>
                    <div>
                      <span className="eyebrow">Stage 0{i + 1}</span>
                      <h2 className="mt-2 text-2xl font-semibold">
                        {String(t)}
                      </h2>
                      <p className="mt-2 leading-7 text-muted">{String(d)}</p>
                    </div>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <ArrowDown className="mx-auto my-4 text-accent" />
                )}
              </Reveal>
            ))}
            <Reveal>
              <div
                id="scoring-method"
                className="panel mt-14 scroll-mt-24 p-6 sm:p-8"
              >
                <p className="eyebrow">Scoring method</p>
                <h2 className="mt-2 text-3xl font-semibold">
                  The numbers have visible rules.
                </h2>
                <p className="mt-3 leading-7 text-muted">
                  A rule can contribute once to its category. Examples include
                  candidate-paid fees (38 points), unofficial payment channels
                  (34), credential requests (36), sensitive documents (28),
                  artificial urgency (24), and generic recruiter email (18).
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-raised/55 p-5">
                    <h3 className="font-semibold">Overall risk bands</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Low 0-21 | Caution 22-54 | High 55-100
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      Overall = 55% of the strongest category + 12% of all five
                      category scores, rounded up and capped at 100.
                    </p>
                  </div>
                  <div className="rounded-xl border border-line bg-raised/55 p-5">
                    <h3 className="font-semibold">Category signal labels</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      No match 0 | Minor 1-19 | Elevated 20-39 | Strong 40-100
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      These measure matched warning signals, not fraud
                      probability and not employer intent.
                    </p>
                  </div>
                </div>
                <div className="mt-8 border-t border-line pt-7">
                  <h3 className="text-xl font-semibold">
                    What can add points?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    A rule contributes at most once. A match is shown only when
                    InternGuard can attach the triggering source sentence.
                  </p>
                  <div className="mt-4 overflow-hidden rounded-xl border border-line">
                    {scoreRules.map(([signal, category, points, reason]) => (
                      <div
                        key={signal}
                        className="grid gap-2 border-b border-line bg-canvas p-4 last:border-b-0 sm:grid-cols-[1fr_6rem_3rem_1.4fr] sm:items-center"
                      >
                        <strong className="text-sm">{signal}</strong>
                        <span className="text-xs text-muted">{category}</span>
                        <span className="font-mono text-xs font-bold text-accent">
                          {points}
                        </span>
                        <span className="text-xs leading-5 text-muted">
                          {reason}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl border border-accent/25 bg-accent/10 p-4 text-sm leading-6">
                    <strong>Worked example:</strong>{" "}
                    <span className="text-muted">
                      Documents 28, Urgency 24, and Recruiter 18 produce 23.8,
                      rounded to 24. That falls inside Caution (22-54).
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      <section className="section border-y border-line bg-surface">
        <div className="shell grid gap-8 lg:grid-cols-2">
          <Reveal>
            <h2 className="title">Why not hide behind “AI-powered”?</h2>
          </Reveal>
          <Reveal>
            <p className="text-lg leading-8 text-muted">
              Because confidence requires inspectability. A heuristic system has
              limits, but those limits are visible. It cannot establish intent,
              authenticate a company, or replace independent checks. It can
              consistently surface patterns worth investigating and show exactly
              why.
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
