import { Eye, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
export const metadata = { title: "Trust & Safety" };
export default function About() {
  const values = [
    [
      Eye,
      "Explain every flag",
      "Source quotes remain connected to named rules and reasons.",
    ],
    [
      Scale,
      "Avoid accusations",
      "The strongest output is High Risk — Verify Before Proceeding.",
    ],
    [
      LockKeyhole,
      "Minimize exposure",
      "No account is required; scan history stays in the user's browser.",
    ],
    [
      ShieldCheck,
      "Turn caution into action",
      "Every report ends with independent verification and real reporting paths.",
    ],
  ];
  return (
    <main id="main">
      <section className="section border-b border-line">
        <div className="shell grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">About / trust & safety</p>
            <h1 className="display mt-5">
              Protection without pretending certainty.
            </h1>
          </div>
          <p className="self-end text-lg leading-8 text-muted">
            InternGuard helps students pause, inspect, and verify suspicious
            internship communications. It does not authenticate organizations,
            provide legal advice, or confirm fraud.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell grid gap-4 sm:grid-cols-2">
          {values.map(([I, t, d]) => (
            <article key={String(t)} className="panel p-6 sm:p-8">
              <I className="text-accent" />
              <h2 className="mt-8 text-2xl font-semibold">{String(t)}</h2>
              <p className="mt-3 leading-7 text-muted">{String(d)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section border-y border-line bg-surface">
        <div className="shell max-w-3xl">
          <p className="eyebrow">Clear limitations</p>
          <h2 className="title mt-4">
            A report is a starting point for verification.
          </h2>
          <div className="mt-7 space-y-4 leading-7 text-muted">
            <p>
              Rules can miss novel tactics, sarcasm, image content that OCR
              cannot read, or context outside the submitted source.
            </p>
            <p>
              A low-risk report means no configured pattern was detected in
              available content. It never means an opportunity is verified
              legitimate.
            </p>
            <p>
              When money, identity documents, or safety are involved, verify
              through separately obtained official channels and involve your
              institution.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
