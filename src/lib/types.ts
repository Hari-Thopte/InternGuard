export type RiskLevel = "low" | "caution" | "high";
export type Confidence = "low" | "medium" | "high";
export type Category =
  "recruiter" | "company" | "payment" | "document" | "urgency";
export interface EvidenceItem {
  id: string;
  sourceQuote: string;
  flagType: string;
  category: Category;
  severity: RiskLevel;
  explanation: string;
  ruleWeight?: number;
}
export interface SourceContext {
  sourceKind: "pasted text" | "uploaded screenshot" | "public webpage";
  verifiedSource: string;
  pageTitle?: string;
  organizationClue?: string;
  industry?: string;
  inferenceConfidence?: "low" | "medium";
  basis: string[];
}
export interface RiskReport {
  id: string;
  createdAt: string;
  sourceType: "text" | "image" | "url";
  sourceLabel: string;
  riskLevel: RiskLevel;
  verdict: string;
  confidence: Confidence;
  overallScore: number;
  categoryScores: Record<Category, number>;
  extracted: Record<string, string | string[]>;
  sourceContext?: SourceContext;
  evidenceList: EvidenceItem[];
  recommendedActions: string[];
  limitations: string[];
  reportingLinks: { label: string; href: string; description: string }[];
}

export type DocumentCategory =
  "issuer" | "content" | "metadata" | "integrity" | "verification";

export interface DocumentFinding {
  id: string;
  title: string;
  explanation: string;
  source: "file" | "ocr" | "metadata" | "content" | "verification";
  category: DocumentCategory;
  status: "pass" | "info" | "warning";
  weight: number;
  evidence?: string;
}

export interface DocumentReport {
  kind: "document-report";
  id: string;
  createdAt: string;
  fileName: string;
  mimeType: string;
  sha256: string;
  pageCount: number;
  documentType: string;
  riskLevel: RiskLevel;
  overallScore: number;
  verdict: string;
  categoryScores: Record<DocumentCategory, number>;
  extracted: {
    organization: string;
    candidateName: string;
    documentId: string;
    amounts: string[];
    dates: string[];
    emails: string[];
    urls: string[];
    qrCodes: string[];
  };
  domainComparison: {
    emailDomains: string[];
    websiteDomains: string[];
    status: "aligned" | "mismatch" | "unverifiable";
    explanation: string;
  };
  metadata: Record<string, string>;
  signatureStatus: "not-detected" | "present-unverified";
  findings: DocumentFinding[];
  recommendations: string[];
  limitations: string[];
}
