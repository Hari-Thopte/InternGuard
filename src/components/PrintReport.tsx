import type { Category, RiskReport } from "@/lib/types";
import { normalizeMonetaryMentions } from "@/lib/amounts";
import { CategoryRiskGraph } from "@/components/CategoryRiskGraph";

const labels: Record<Category, string> = {
  recruiter: "Recruiter",
  company: "Company",
  payment: "Payment",
  document: "Documents",
  urgency: "Urgency",
};
function signalBand(score: number) {
  if (score === 0) return "No match";
  if (score < 20) return "Minor";
  if (score < 40) return "Elevated";
  return "Strong";
}

export function PrintReport({ report }: { report: RiskReport }) {
  return (
    <article
      className={`print-report risk-${report.riskLevel}`}
      aria-hidden="true"
    >
      <header className="print-header">
        <div>
          <strong>InternGuard</strong>
          <span>Evidence intelligence report</span>
        </div>
        <div className="print-meta">
          <span>{report.id}</span>
          <span>{new Date(report.createdAt).toLocaleString()}</span>
        </div>
      </header>

      <section className="print-hero">
        <div>
          <p className="print-kicker">Risk assessment</p>
          <span className="print-risk-label">{report.riskLevel} risk</span>
          <h1>{report.verdict.replaceAll("—", "-")}</h1>
          <p>
            <strong>{report.confidence} confidence.</strong> This report
            identifies patterns to verify. It does not determine fraud or accuse
            an organization.
          </p>
        </div>
        <div className="print-score">
          <strong>{report.overallScore}</strong>
          <span>/ 100</span>
          <small>risk signal score</small>
        </div>
      </section>

      <section className="print-section">
        <div className="print-section-heading">
          <div>
            <p className="print-kicker">Signal profile</p>
            <h2>Category breakdown</h2>
          </div>
          <span>Evidence-backed categories</span>
        </div>
        <CategoryRiskGraph report={report} variant="white" />
        <div className="print-categories">
          {Object.entries(report.categoryScores).map(([key, score]) => {
            const matches = report.evidenceList.filter(
              (item) => item.category === key,
            ).length;
            return (
              <div key={key}>
                <span>{labels[key as Category]}</span>
                <strong>{signalBand(score)}</strong>
                <small>
                  {matches} matched {matches === 1 ? "rule" : "rules"}
                </small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="print-section">
        <p className="print-kicker">Evidence and reasoning</p>
        <h2>What triggered this assessment</h2>
        <div className="print-evidence">
          {report.evidenceList.length ? (
            report.evidenceList.map((item, index) => (
              <div key={item.id}>
                <div>
                  <span>0{index + 1}</span>
                  <strong>{item.flagType.replaceAll("-", " ")}</strong>
                  <em>{item.severity}</em>
                </div>
                <blockquote>“{item.sourceQuote}”</blockquote>
                <p>{item.explanation}</p>
              </div>
            ))
          ) : (
            <p>
              No known rules matched. This is not proof of legitimacy;
              independently verify the employer and recruiter.
            </p>
          )}
        </div>
      </section>

      <section className="print-two-column">
        <div className="print-section">
          <p className="print-kicker">Extracted details</p>
          <h2>Source summary</h2>
          <dl>
            {report.sourceContext && (
              <>
                <div>
                  <dt>Recorded source</dt>
                  <dd>{report.sourceContext.verifiedSource}</dd>
                </div>
                {report.sourceContext.pageTitle && (
                  <div>
                    <dt>Page title</dt>
                    <dd>{report.sourceContext.pageTitle}</dd>
                  </div>
                )}
                {report.sourceContext.organizationClue && (
                  <div>
                    <dt>Organization clue (not verified)</dt>
                    <dd>{report.sourceContext.organizationClue}</dd>
                  </div>
                )}
                {report.sourceContext.industry && (
                  <div>
                    <dt>Likely industry (inferred)</dt>
                    <dd>
                      {report.sourceContext.industry} —{" "}
                      {report.sourceContext.inferenceConfidence} confidence
                    </dd>
                  </div>
                )}
              </>
            )}
            {Object.entries(report.extracted).map(([key, value]) => (
              <div key={key}>
                <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
                <dd>
                  {Array.isArray(value)
                    ? (key === "monetaryMentions"
                        ? normalizeMonetaryMentions(value)
                        : value
                      ).join(", ")
                    : value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="print-source">Source: {report.sourceLabel}</p>
        </div>
        <div className="print-section">
          <p className="print-kicker">Next steps</p>
          <h2>Verify before proceeding</h2>
          <ol>
            {report.recommendedActions.map((action, index) => (
              <li key={action}>
                <span>{index + 1}</span>
                {action}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="print-section print-reporting">
        <p className="print-kicker">Escalation</p>
        <h2>Official reporting paths</h2>
        <div>
          {report.reportingLinks.map((link) => (
            <p key={link.label}>
              <strong>{link.label}</strong>
              <span>{link.description}</span>
              <small>{link.href}</small>
            </p>
          ))}
        </div>
      </section>
      <footer className="print-footer">
        <div>
          {report.limitations.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
        <strong>InternGuard</strong>
      </footer>
    </article>
  );
}
