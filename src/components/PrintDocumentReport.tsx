import type { DocumentCategory, DocumentReport } from "@/lib/types";
import { CategoryRiskGraph } from "@/components/CategoryRiskGraph";

const labels: Record<DocumentCategory, string> = {
  issuer: "Issuer identity",
  content: "Readable content",
  metadata: "File metadata",
  integrity: "File integrity",
  verification: "Verification path",
};

export function PrintDocumentReport({ report }: { report: DocumentReport }) {
  return (
    <article
      className={`print-report risk-${report.riskLevel}`}
      aria-hidden="true"
    >
      <header className="print-header">
        <div>
          <strong>InternGuard</strong>
          <span>Document evidence report</span>
        </div>
        <div className="print-meta">
          <span>{report.id}</span>
          <span>{new Date(report.createdAt).toLocaleString()}</span>
        </div>
      </header>
      <section className="print-hero">
        <div>
          <p className="print-kicker">Document assessment</p>
          <span className="print-risk-label">{report.riskLevel} concern</span>
          <h1>{report.verdict}</h1>
          <p>
            This evidence review highlights details to verify; it does not
            certify authenticity or forgery.
          </p>
        </div>
        <div className="print-score">
          <strong>{report.overallScore}</strong>
          <span>/ 100</span>
          <small>concern score</small>
        </div>
      </section>
      <section className="print-section">
        <p className="print-kicker">Five-part review</p>
        <h2>What was checked</h2>
        <CategoryRiskGraph report={report} variant="white" />
        <div className="print-categories">
          {Object.entries(report.categoryScores).map(([key, score]) => (
            <div key={key}>
              <span>{labels[key as DocumentCategory]}</span>
              <strong>{score}</strong>
              <small>signal points</small>
            </div>
          ))}
        </div>
      </section>
      <section className="print-two-column">
        <div className="print-section">
          <p className="print-kicker">Extracted details</p>
          <h2>Document identity</h2>
          <dl>
            <div>
              <dt>File</dt>
              <dd>{report.fileName}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{report.documentType}</dd>
            </div>
            <div>
              <dt>Claimed issuer</dt>
              <dd>{report.extracted.organization}</dd>
            </div>
            <div>
              <dt>Candidate</dt>
              <dd>{report.extracted.candidateName}</dd>
            </div>
            <div>
              <dt>Document ID</dt>
              <dd>{report.extracted.documentId}</dd>
            </div>
            <div>
              <dt>Amounts</dt>
              <dd>{report.extracted.amounts.join(", ") || "None detected"}</dd>
            </div>
            <div>
              <dt>Dates</dt>
              <dd>{report.extracted.dates.join(", ") || "None detected"}</dd>
            </div>
            <div>
              <dt>QR values</dt>
              <dd>{report.extracted.qrCodes.join(", ") || "None detected"}</dd>
            </div>
          </dl>
        </div>
        <div className="print-section">
          <p className="print-kicker">Domain check</p>
          <h2>{report.domainComparison.status}</h2>
          <p>{report.domainComparison.explanation}</p>
          <dl>
            <div>
              <dt>Email domains</dt>
              <dd>
                {report.domainComparison.emailDomains.join(", ") ||
                  "None detected"}
              </dd>
            </div>
            <div>
              <dt>Website domains</dt>
              <dd>
                {report.domainComparison.websiteDomains.join(", ") ||
                  "None detected"}
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <section className="print-section">
        <p className="print-kicker">Evidence trail</p>
        <h2>Findings and reasons</h2>
        <div className="print-evidence">
          {report.findings.map((finding, index) => (
            <div key={finding.id}>
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{finding.title}</strong>
                <em>{finding.status}</em>
              </div>
              <p>{finding.explanation}</p>
              {finding.evidence && <blockquote>{finding.evidence}</blockquote>}
            </div>
          ))}
        </div>
      </section>
      <footer className="print-footer">
        <div>
          <p>SHA-256: {report.sha256}</p>
          <p>Risk signals are not accusations. Verify independently.</p>
        </div>
        <strong>InternGuard</strong>
      </footer>
    </article>
  );
}
