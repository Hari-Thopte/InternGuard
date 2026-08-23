import type {
  Category,
  EvidenceItem,
  RiskLevel,
  RiskReport,
  SourceContext,
} from "./types";
import {
  currencyAmountPattern,
  normalizeCurrencyText,
  normalizeMonetaryMentions,
} from "./amounts";
import { flattenEvidenceText } from "./textNormalization";
type SourceType = RiskReport["sourceType"];
type SourceMetadata = { pageTitle?: string };
type Rule = {
  type: string;
  category: Category;
  weight: number;
  severity: RiskLevel;
  pattern: RegExp;
  explanation: string;
};
const upfrontPaymentPattern = new RegExp(
  `(?:pay|deposit|send|transfer|fee|charge)[^\\n.!?]{0,60}(?:${currencyAmountPattern.source}|registration|security|training|application|verification)|(?:${currencyAmountPattern.source})[^\\n.!?]{0,45}(?:pay|fee|deposit|charge)|(?:registration|security|training|application|verification)\\s+(?:fee|deposit)`,
  "i",
);

const RULES: Rule[] = [
  {
    type: "upfront-payment",
    category: "payment",
    weight: 38,
    severity: "high",
    pattern: upfrontPaymentPattern,
    explanation:
      "A candidate-facing payment request is a common internship scam risk and must be independently verified.",
  },
  {
    type: "unofficial-payment",
    category: "payment",
    weight: 34,
    severity: "high",
    pattern: /(?:upi|gift\s*card|crypto|wallet|personal account|payment qr)/i,
    explanation:
      "Unofficial payment channels reduce traceability and are inappropriate for normal recruitment.",
  },
  {
    type: "interview-fee",
    category: "payment",
    weight: 38,
    severity: "high",
    pattern:
      /(?:interview|screening|selection|processing)\s+(?:fee|charge)|(?:fee|charge).{0,30}(?:interview|screening|selection)/i,
    explanation:
      "Charging a candidate to interview or enter a selection process is a strong warning signal.",
  },
  {
    type: "required-equipment-purchase",
    category: "payment",
    weight: 34,
    severity: "high",
    pattern:
      /(?:buy|purchase|pay for|order).{0,45}(?:laptop|phone|equipment|device|software|starter kit)|(?:equipment|device|laptop).{0,35}(?:vendor|reimburse|purchase)/i,
    explanation:
      "A recruiter-directed equipment purchase or reimbursement promise should be independently verified before spending money.",
  },
  {
    type: "mandatory-paid-training",
    category: "payment",
    weight: 30,
    severity: "high",
    pattern:
      /(?:mandatory|required|compulsory).{0,35}(?:paid training|training fee|course fee|certification fee)|(?:pay|paid).{0,30}(?:training|course|certification).{0,15}(?:before|to join|onboarding)/i,
    explanation:
      "Mandatory paid training tied to selection can shift recruitment costs onto the candidate.",
  },
  {
    type: "artificial-urgency",
    category: "urgency",
    weight: 24,
    severity: "caution",
    pattern:
      /(?:within \d+ (?:minutes?|hours?)|act now|immediately|today only|last chance|offer.*expire)/i,
    explanation:
      "Time pressure can prevent careful verification and is a known manipulation pattern.",
  },
  {
    type: "sensitive-documents",
    category: "document",
    weight: 28,
    severity: "high",
    pattern:
      /(?:aadhaar|aadhar|pan card|passport|bank (?:details|statement)|otp|cvv)/i,
    explanation:
      "Sensitive identity or financial documents should only be shared through a verified, necessary process.",
  },
  {
    type: "generic-recruiter-email",
    category: "recruiter",
    weight: 18,
    severity: "caution",
    pattern: /[\w.+-]+@(gmail|yahoo|outlook|hotmail|protonmail)\.(com|in)/i,
    explanation:
      "A free mailbox does not prove wrongdoing, but the recruiter-company relationship needs verification.",
  },
  {
    type: "unrealistic-compensation",
    category: "company",
    weight: 22,
    severity: "caution",
    pattern:
      /(?:₹|rs\.?|inr)\s?(?:[1-9]\d{5,}|\d+\s?lakhs?).{0,30}(?:week|month|intern)/i,
    explanation:
      "Exceptional compensation claims deserve confirmation through the employer's official careers channel.",
  },
  {
    type: "guaranteed-selection",
    category: "company",
    weight: 18,
    severity: "caution",
    pattern:
      /(?:guaranteed (?:job|selection|internship)|no interview|100% placement)/i,
    explanation:
      "Guaranteed outcomes can be promotional pressure rather than a verifiable recruitment process.",
  },
  {
    type: "chat-only-recruitment",
    category: "recruiter",
    weight: 16,
    severity: "caution",
    pattern: /(?:contact|message|interview|reply).{0,30}(?:whatsapp|telegram)/i,
    explanation:
      "Chat-only recruitment should be verified through the employer's independently located official contact.",
  },
  {
    type: "shortened-link",
    category: "company",
    weight: 16,
    severity: "caution",
    pattern: /https?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy)\//i,
    explanation:
      "A shortened link hides its destination and should be expanded and verified before opening.",
  },
  {
    type: "credential-request",
    category: "document",
    weight: 36,
    severity: "high",
    pattern:
      /(?:password|login code|verification code|one.?time password|screen.?share|remote access)/i,
    explanation:
      "Recruiters should not request account secrets, login codes, screen sharing, or remote device access.",
  },
  {
    type: "software-download",
    category: "document",
    weight: 28,
    severity: "high",
    pattern:
      /(?:download|install).{0,35}(?:apk|\.exe|anydesk|teamviewer|remote app)/i,
    explanation:
      "Unverified software downloads can expose accounts and devices and are not a normal screening requirement.",
  },
];
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function negatesRule(rule: Rule, sentence: string) {
  if (rule.category !== "payment") return false;
  if (rule.type === "required-equipment-purchase")
    return /(?:no|without|never).{0,35}(?:equipment|device|laptop|phone).{0,25}(?:purchase|required|needed)|(?:do not|don't)\s+(?:need to\s+)?(?:buy|purchase|order)|(?:equipment|device|laptop|phone).{0,30}(?:not required|optional)/i.test(
      sentence,
    );
  if (rule.type === "mandatory-paid-training")
    return /(?:no|without|never).{0,35}(?:paid training|training fee|course fee|certification fee)|(?:training|course|certification).{0,30}(?:free|optional|not required)/i.test(
      sentence,
    );
  if (rule.type === "unofficial-payment")
    return /(?:no|never|do not|don't).{0,25}(?:upi|gift\s*card|crypto|wallet|personal account|payment qr)/i.test(
      sentence,
    );
  return /(?:no|without|never)\s+(?:candidate\s+)?(?:(?:registration|application|security|training|verification|interview|screening)\s+)?(?:payment|fee|deposit)|(?:payment|fee|deposit)\s+(?:is\s+)?not\s+required/i.test(
    sentence,
  );
}

function isCompensationStatement(sentence: string) {
  const compensation =
    /\b(?:stipend|salary|compensation|remuneration|allowance)\b|\b(?:we|the company|the employer)\s+(?:will\s+)?pay\s+you\b/i.test(
      sentence,
    );
  const candidateCharge =
    /\b(?:registration|application|security|verification|interview|training)\s+(?:fee|deposit)|\b(?:fee|deposit|charge)\b/i.test(
      sentence,
    );
  return compensation && !candidateCharge;
}
function quoteAround(text: string, match: RegExpMatchArray) {
  const matchStart = match.index ?? 0;
  const matchEnd = matchStart + match[0].length;
  const before = text.slice(0, matchStart);
  const priorBoundaries = [...before.matchAll(/[.!?](?=\s|$)/g)];
  const start = priorBoundaries.length
    ? (priorBoundaries.at(-1)?.index ?? -1) + 1
    : 0;
  const after = text.slice(matchEnd);
  const nextBoundary = after.search(/[.!?](?=\s|$)/);
  const end = nextBoundary >= 0 ? matchEnd + nextBoundary + 1 : text.length;
  const sentence = text.slice(start, end).trim();
  if (sentence.length <= 800) return sentence;
  return `${sentence.slice(0, 797).trimEnd()} [long sentence shortened]`;
}
function extract(text: string) {
  const email = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0];
  const money = normalizeMonetaryMentions(text);
  const urls = [...text.matchAll(/https?:\/\/[^\s)]+/gi)].map((m) => m[0]);
  return {
    recruiterContact: email ?? "Not detected",
    monetaryMentions: money,
    links: urls.length ? urls : ["None detected"],
  };
}

const industrySignals = [
  [
    "Software & technology",
    /\b(?:software|developer|engineering|programming|web|react|python|java|data|cybersecurity)\b/gi,
  ],
  [
    "Marketing & communications",
    /\b(?:marketing|seo|social media|content|advertising|brand|public relations)\b/gi,
  ],
  [
    "Finance & accounting",
    /\b(?:finance|accounting|investment|banking|audit|taxation)\b/gi,
  ],
  [
    "Design & creative",
    /\b(?:ui\/?ux|graphic design|product design|illustration|video editing)\b/gi,
  ],
  [
    "Human resources",
    /\b(?:human resources|recruitment|talent acquisition|hr intern)\b/gi,
  ],
  ["Legal", /\b(?:legal|law|litigation|compliance|paralegal)\b/gi],
  ["Education", /\b(?:education|teaching|tutor|curriculum|edtech)\b/gi],
] as const;

function organizationClue(text: string, email?: string) {
  const labelled = text.match(
    /\b(?:[Cc]ompany|[Ee]mployer|[Oo]rganization)\s*[:\-]\s*([A-Z][A-Za-z0-9&'-]*(?:\s+[A-Z][A-Za-z0-9&'-]*){0,4})(?=[.,;]|$)/,
  )?.[1];
  if (labelled)
    return { value: labelled.trim(), basis: "Named in the submitted content" };
  const internshipAt = text.match(
    /\b[Ii]nternship\s+(?:opportunity\s+)?at\s+([A-Z][A-Za-z0-9&'-]*(?:\s+[A-Z][A-Za-z0-9&'-]*){0,3})(?=[.,;]|$)/,
  )?.[1];
  if (internshipAt)
    return {
      value: internshipAt.trim(),
      basis: "Organization-like name follows “internship at”",
    };
  const domain = email?.split("@")[1]?.toLowerCase();
  if (
    domain &&
    !/^(?:gmail|yahoo|outlook|hotmail|protonmail)\.(?:com|in)$/.test(domain)
  ) {
    return {
      value: domain,
      basis: "Organization-domain clue from an email address",
    };
  }
  return null;
}

function sourceContext(
  text: string,
  sourceType: SourceType,
  sourceLabel: string,
  metadata: SourceMetadata,
): SourceContext {
  const email = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0];
  const organization = organizationClue(text, email);
  const rankedIndustries = industrySignals
    .map(([label, pattern]) => ({
      label,
      matches: [...text.matchAll(pattern)].length,
    }))
    .sort((a, b) => b.matches - a.matches);
  const industry = rankedIndustries[0];
  const sourceKind =
    sourceType === "url"
      ? "public webpage"
      : sourceType === "image"
        ? "uploaded screenshot"
        : "pasted text";
  let verifiedSource = "User-pasted content; original sender not verified";
  if (sourceType === "image") verifiedSource = `Uploaded file: ${sourceLabel}`;
  if (sourceType === "url") {
    try {
      verifiedSource = new URL(sourceLabel).hostname;
    } catch {
      verifiedSource = sourceLabel;
    }
  }
  const basis = [
    sourceType === "url"
      ? "Domain taken from the retrieved final URL"
      : sourceType === "image"
        ? "Filename taken from the uploaded screenshot"
        : "Submission channel recorded by InternGuard",
  ];
  if (organization) basis.push(organization.basis);
  if (industry?.matches)
    basis.push("Industry suggested by repeated role keywords");
  return {
    sourceKind,
    verifiedSource,
    ...(metadata.pageTitle ? { pageTitle: metadata.pageTitle } : {}),
    ...(organization ? { organizationClue: organization.value } : {}),
    ...(industry?.matches
      ? {
          industry: industry.label,
          inferenceConfidence: industry.matches >= 2 ? "medium" : "low",
        }
      : {}),
    basis,
  };
}

export function analyzeHeuristically(
  text: string,
  sourceType: SourceType = "text",
  sourceLabel = "Submitted content",
  metadata: SourceMetadata = {},
): RiskReport {
  const normalized = flattenEvidenceText(normalizeCurrencyText(text));
  if (normalized.length < 20)
    throw new Error("Provide at least 20 characters of internship context.");
  const categoryScores: RiskReport["categoryScores"] = {
    recruiter: 0,
    company: 0,
    payment: 0,
    document: 0,
    urgency: 0,
  };
  const evidenceList: EvidenceItem[] = [];
  const candidatePaymentRequest = normalized
    .split(/(?<=[.!?])\s+/)
    .some(
      (sentence) =>
        upfrontPaymentPattern.test(sentence) &&
        !isCompensationStatement(sentence) &&
        !/(?:no|without|never)\s+(?:candidate\s+)?(?:(?:registration|application|security|training|verification|interview|screening)\s+)?(?:payment|fee|deposit)|(?:payment|fee|deposit)\s+(?:is\s+)?not\s+required/i.test(
          sentence,
        ),
    );
  for (const rule of RULES) {
    const match = normalized.match(rule.pattern);
    if (!match) continue;
    const evidenceSentence = quoteAround(normalized, match);
    if (negatesRule(rule, evidenceSentence)) continue;
    if (
      rule.type === "unofficial-payment" &&
      !candidatePaymentRequest &&
      !/(?:pay|send|transfer|deposit|buy|purchase)|scan.{0,30}(?:upi|payment qr)/i.test(
        evidenceSentence,
      )
    )
      continue;
    if (
      rule.type === "upfront-payment" &&
      isCompensationStatement(evidenceSentence)
    )
      continue;
    categoryScores[rule.category] = clamp(
      categoryScores[rule.category] + rule.weight,
    );
    evidenceList.push({
      id: `e-${evidenceList.length + 1}`,
      sourceQuote: evidenceSentence,
      flagType: rule.type,
      category: rule.category,
      severity: rule.severity,
      explanation: rule.explanation,
      ruleWeight: rule.weight,
    });
  }
  const scores = Object.values(categoryScores);
  const overallScore = clamp(
    Math.ceil(
      Math.max(...scores) * 0.55 + scores.reduce((a, b) => a + b, 0) * 0.12,
    ),
  );
  const riskLevel: RiskLevel =
    overallScore >= 55 ? "high" : overallScore >= 22 ? "caution" : "low";
  const confidence =
    normalized.length > 350 && evidenceList.length >= 2
      ? "high"
      : normalized.length > 120 || evidenceList.length
        ? "medium"
        : "low";
  const verdict =
    riskLevel === "high"
      ? "High Risk — Verify Before Proceeding"
      : riskLevel === "caution"
        ? "Caution — Independent Verification Needed"
        : "Low Detected Risk — Not Proof of Legitimacy";
  return {
    id: `IG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    sourceType,
    sourceLabel,
    riskLevel,
    verdict,
    confidence,
    overallScore,
    categoryScores,
    extracted: extract(normalized),
    sourceContext: sourceContext(normalized, sourceType, sourceLabel, metadata),
    evidenceList,
    recommendedActions: [
      "Verify the role on the employer's official careers page using a separately found domain.",
      "Confirm the recruiter's identity through the employer's published switchboard or HR contact.",
      ...(categoryScores.payment
        ? [
            "Do not pay or transfer money until the request is independently verified in writing.",
          ]
        : []),
      ...(categoryScores.document
        ? [
            "Do not send identity or financial documents through chat, personal email, or unverified forms.",
          ]
        : []),
      "Ask your college placement cell or TPO to validate the opportunity before proceeding.",
    ],
    limitations: [
      "This is a transparent rule-based signal assessment, not a trained fraud classifier or legal determination.",
      evidenceList.length
        ? "Flags describe patterns in the submitted evidence; they do not establish intent or wrongdoing."
        : "No matched signal proves legitimacy. Important context may be missing.",
    ],
    reportingLinks: [
      {
        label: "National Cyber Crime Reporting Portal",
        href: "https://cybercrime.gov.in/",
        description:
          "India's official portal for reporting suspected cybercrime.",
      },
      {
        label: "Contact your placement cell / TPO",
        href: "/contact#placement-cell",
        description: "Share the source and report with your institution.",
      },
      {
        label: "Report on the listing platform",
        href: "/contact#platform-report",
        description:
          "Use the platform's official safety channel when applicable.",
      },
    ],
  };
}
export const heuristicEngine = { analyze: analyzeHeuristically };
