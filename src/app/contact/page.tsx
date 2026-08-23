import { Building2, ExternalLink, Flag, GraduationCap } from "lucide-react";
export const metadata = { title: "Report a Concern" };
export default function Contact() {
  return (
    <main id="main" className="section">
      <div className="shell">
        <div className="max-w-4xl">
          <p className="eyebrow">Contact / report a concern</p>
          <h1 className="display mt-5">
            Preserve evidence. Report through the right channel.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            If money, identity theft, or account compromise may be involved,
            stop contact and use an official reporting route.
          </p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <a
            href="https://cybercrime.gov.in/"
            target="_blank"
            rel="noreferrer"
            className="panel p-6 hover:border-accent"
          >
            <Flag className="text-high" />
            <h2 className="mt-8 text-2xl font-semibold">Cyber Crime Portal</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              India’s official National Cyber Crime Reporting Portal.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm text-accent">
              Open official portal <ExternalLink size={14} />
            </span>
          </a>
          <article id="placement-cell" className="panel p-6">
            <GraduationCap className="text-accent" />
            <h2 className="mt-8 text-2xl font-semibold">
              College placement cell / TPO
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Send the original message, listing URL, recruiter contact, payment
              details, and downloaded InternGuard report to your institution’s
              published placement contact.
            </p>
          </article>
          <article id="platform-report" className="panel p-6">
            <Building2 className="text-caution" />
            <h2 className="mt-8 text-2xl font-semibold">Listing platform</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Use the internship platform’s built-in Report, Trust & Safety, or
              Help channel. Include the listing URL and preserve screenshots
              before it changes.
            </p>
          </article>
        </div>
        <div className="panel mt-6 p-6">
          <h2 className="text-2xl font-semibold">Evidence checklist</h2>
          <p className="mt-3 leading-7 text-muted">
            Keep the full conversation, sender address, headers where available,
            listing URL, payment destination, transaction reference, phone
            number, timestamps, and screenshots. Do not edit originals. An
            InternGuard report adds context but does not replace primary
            evidence.
          </p>
        </div>
      </div>
    </main>
  );
}
