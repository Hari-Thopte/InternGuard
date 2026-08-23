import type { Category, DocumentReport, RiskLevel, RiskReport } from "./types";
import { normalizeMonetaryMentions } from "./amounts";

export type DashboardSource = "text" | "image" | "url" | "document";

export interface DashboardRecord {
  kind: "opportunity" | "document";
  id: string;
  createdAt: string;
  riskLevel: RiskLevel;
  overallScore: number;
  sourceType: DashboardSource;
  sourceLabel: string;
  title: string;
  organization?: string;
  industry?: string;
  fileName?: string;
  amounts: string[];
  reasons: string[];
  confidenceLabel: string;
  href: string;
  profileScores: Record<Category, number>;
}

const categories: Category[] = [
  "recruiter",
  "company",
  "payment",
  "document",
  "urgency",
];

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function opportunityRecord(report: RiskReport): DashboardRecord {
  const money = report.extracted.monetaryMentions;
  const monetaryMentions = (Array.isArray(money) ? money : [money]).filter(
    (value): value is string => typeof value === "string",
  );
  const amounts = normalizeMonetaryMentions(monetaryMentions).filter(
    (value) => value !== "None detected",
  );
  const organization = report.sourceContext?.organizationClue;
  return {
    kind: "opportunity",
    id: report.id,
    createdAt: report.createdAt,
    riskLevel: report.riskLevel,
    overallScore: report.overallScore,
    sourceType: report.sourceType,
    sourceLabel: report.sourceContext?.verifiedSource ?? report.sourceLabel,
    title:
      organization ?? report.sourceContext?.pageTitle ?? report.sourceLabel,
    ...(organization ? { organization } : {}),
    ...(report.sourceContext?.industry
      ? { industry: report.sourceContext.industry }
      : {}),
    amounts,
    reasons: [...report.evidenceList]
      .sort((a, b) => (b.ruleWeight ?? 0) - (a.ruleWeight ?? 0))
      .slice(0, 3)
      .map((finding) => titleCase(finding.flagType)),
    confidenceLabel: `${report.confidence} confidence`,
    href: `/report/${report.id}`,
    profileScores: report.categoryScores,
  };
}

function documentProfile(report: DocumentReport): Record<Category, number> {
  const sum = (titles: RegExp) =>
    Math.min(
      100,
      report.findings
        .filter((finding) => titles.test(finding.title))
        .reduce((total, finding) => total + finding.weight, 0),
    );
  return {
    recruiter: report.categoryScores.issuer,
    company: sum(/guaranteed|compensation|company/i),
    payment: sum(/payment|deposit|fee|equipment purchase|paid training/i),
    document: sum(/sensitive|credential|software download/i),
    urgency: sum(/urgency|time-pressure/i),
  };
}

function documentRecord(report: DocumentReport): DashboardRecord {
  const organization =
    report.extracted.organization === "Not confidently detected"
      ? undefined
      : report.extracted.organization;
  return {
    kind: "document",
    id: report.id,
    createdAt: report.createdAt,
    riskLevel: report.riskLevel,
    overallScore: report.overallScore,
    sourceType: "document",
    sourceLabel: `${report.documentType} · ${report.pageCount} ${report.pageCount === 1 ? "page" : "pages"}`,
    title: organization ?? report.fileName,
    ...(organization ? { organization } : {}),
    fileName: report.fileName,
    amounts: report.extracted.amounts,
    reasons: [...report.findings]
      .filter((finding) => finding.status === "warning")
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((finding) => finding.title),
    confidenceLabel: "document evidence review",
    href: `/document-report/${report.id}`,
    profileScores: documentProfile(report),
  };
}

export function createDashboardRecords(
  reports: RiskReport[],
  documents: DocumentReport[],
) {
  return [
    ...reports.map(opportunityRecord),
    ...documents.map(documentRecord),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function averageProfile(records: DashboardRecord[]) {
  return Object.fromEntries(
    categories.map((category) => [
      category,
      records.length
        ? Math.round(
            records.reduce(
              (total, record) => total + record.profileScores[category],
              0,
            ) / records.length,
          )
        : 0,
    ]),
  ) as Record<Category, number>;
}
