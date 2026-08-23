import type {
  DocumentCategory,
  DocumentFinding,
  DocumentReport,
  RiskLevel,
} from "./types";
import { analyzeHeuristically } from "./heuristicEngine";
import { normalizeMonetaryMentions } from "./amounts";
import {
  flattenEvidenceText,
  normalizeEvidenceText,
} from "./textNormalization";

export type DocumentWorkerResult = {
  text: string;
  pageCount: number;
  metadata: Record<string, string>;
  signatureFields: number;
  usedOcr: boolean;
  qrCodes: string[];
};

type DocumentInput = DocumentWorkerResult & {
  fileName: string;
  mimeType: string;
  sha256: string;
};

const NOT_DETECTED = "Not confidently detected";
const freeMail =
  /@(gmail|yahoo|outlook|hotmail|protonmail|icloud)\.[a-z]{2,}$/i;

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()))];
}

function cleanValue(value?: string) {
  if (!value) return NOT_DETECTED;
  const firstField = value
    .split(
      /\.\s+(?=(?:pay|please|send|submit|candidates?|applicants?|contact|visit)\b)/i,
    )[0]
    .split(/\.\s+(?=[A-Z][A-Za-z ]{1,32}\s*[:#-])/)[0];
  const cleaned = firstField
    .replace(/^[\s:;,#|•-]+|[\s:;,#|•-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length >= 2 ? cleaned.slice(0, 120) : NOT_DETECTED;
}

function labelledValue(text: string, labels: string) {
  const pattern = new RegExp(
    "(?:" + labels + ")\\s*[:#-]\\s*([^\\n;|]{2,120})",
    "i",
  );
  return cleanValue(pattern.exec(text)?.[1]);
}

function organizationValue(text: string, metadata: Record<string, string>) {
  const labelled = labelledValue(
    text,
    "company(?: name)?|organization|institution|university|issued by|employer|issuer",
  );
  if (labelled !== NOT_DETECTED) return labelled;
  const sentence = text.match(
    /(?:on behalf of|issued by|from)\s+([A-Z][A-Za-z0-9&'., -]{2,80})(?=\n|$)/,
  )?.[1];
  if (sentence) return cleanValue(sentence);
  const author = metadata.author ?? metadata.subject;
  return author && !/microsoft|google|adobe|mozilla/i.test(author)
    ? cleanValue(author)
    : NOT_DETECTED;
}

function candidateValue(text: string) {
  const labelled = labelledValue(
    text,
    "candidate(?: name)?|student(?: name)?|recipient(?: name)?|employee(?: name)?",
  );
  if (labelled !== NOT_DETECTED) return labelled;
  const standaloneName = cleanValue(
    text.match(/(?:^|\n)\s*name\s*[:#-]\s*([^\n;|]{2,120})/im)?.[1],
  );
  if (standaloneName !== NOT_DETECTED) return standaloneName;
  const contextual =
    text.match(
      /(?:awarded|presented|issued|granted)[ \t]+to[ \t]+([A-Z][A-Za-z.'-]+(?:[ \t]+[A-Z][A-Za-z.'-]+){1,4})(?=[ \t]*(?:\n|,|\.|for\b|has\b))/i,
    )?.[1] ??
    text.match(
      /(?:this is to certify that|dear)[ \t]+([A-Z][A-Za-z.'-]+(?:[ \t]+[A-Z][A-Za-z.'-]+){1,4})(?=[ \t]*(?:\n|,|\.|has\b|is\b|for\b))/i,
    )?.[1];
  return cleanValue(contextual);
}

function classifyDocument(text: string) {
  if (/\bcertificate of|\bthis is to certify|\bcertificate\b/i.test(text))
    return "Certificate";
  if (
    /\boffer letter|\boffer of (?:employment|internship)|\bwe are pleased to offer/i.test(
      text,
    )
  )
    return "Offer letter";
  if (/\bappointment letter|\bappointed as/i.test(text))
    return "Appointment letter";
  if (/\bexperience letter|\bworked (?:with|at)\b/i.test(text))
    return "Experience letter";
  return "Unclassified document";
}

function pdfDate(value?: string) {
  const match = value?.match(/D:(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
}

function hostname(value: string) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function analyzeDocument(input: DocumentInput): DocumentReport {
  const structuredText = normalizeEvidenceText(input.text);
  const text = flattenEvidenceText(structuredText);
  const qrCodes = unique(input.qrCodes.filter(Boolean));
  const emails = unique(
    [...text.matchAll(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi)].map(
      (match) => match[0],
    ),
  );
  const textUrls = unique(
    [...text.matchAll(/https?:\/\/[^\s)\]}>]+/gi)].map((match) =>
      match[0].replace(/[.,;]+$/, ""),
    ),
  );
  const qrUrls = qrCodes.filter((value) => /^https?:\/\//i.test(value));
  const urls = unique([...textUrls, ...qrUrls]);
  const dates = unique([
    ...[...text.matchAll(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g)].map(
      (match) => match[0],
    ),
    ...[
      ...text.matchAll(
        /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/gi,
      ),
    ].map((match) => match[0]),
    ...[
      ...text.matchAll(
        /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi,
      ),
    ].map((match) => match[0]),
    ...[...text.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g)].map((match) => match[0]),
  ]);
  const documentId =
    text.match(
      /(?:reference(?:\s*(?:id|no\.?|number|code))?|(?:certificate|document|registration|offer|credential)\s*(?:id|no\.?|number|code))\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]{3,})/i,
    )?.[1] ?? NOT_DETECTED;
  const organization = organizationValue(structuredText, input.metadata);
  const candidateName = candidateValue(structuredText);
  const documentType = classifyDocument(text);
  const amounts = normalizeMonetaryMentions(text).filter(
    (amount) => amount !== "None detected",
  );
  const categoryScores: Record<DocumentCategory, number> = {
    issuer: 0,
    content: 0,
    metadata: 0,
    integrity: 0,
    verification: 0,
  };
  const findings: DocumentFinding[] = [];
  const add = (finding: Omit<DocumentFinding, "id">) => {
    categoryScores[finding.category] = Math.min(
      100,
      categoryScores[finding.category] + finding.weight,
    );
    findings.push({ ...finding, id: "df-" + (findings.length + 1) });
  };

  const opportunityReport =
    text.length >= 20
      ? analyzeHeuristically(text, "text", input.fileName)
      : null;

  add({
    title: "Digital fingerprint created",
    explanation:
      "A SHA-256 fingerprint identifies this exact file. A changed file will normally produce a different hash.",
    source: "file",
    category: "integrity",
    status: "pass",
    weight: 0,
    evidence: input.sha256,
  });

  if (text.length < 100)
    add({
      title: "Limited readable content",
      explanation:
        "Too little text was available for strong internal consistency checks.",
      source: "ocr",
      category: "content",
      status: "warning",
      weight: 15,
      evidence: String(text.length) + " readable characters",
    });
  else
    add({
      title: "Readable content extracted",
      explanation:
        "Text was extracted across " +
        input.pageCount +
        " page" +
        (input.pageCount === 1 ? "" : "s") +
        ".",
      source: "ocr",
      category: "content",
      status: "pass",
      weight: 0,
      evidence: input.usedOcr
        ? "OCR was required"
        : "Embedded PDF text was available",
    });

  if (organization === NOT_DETECTED)
    add({
      title: "Issuer name not confidently detected",
      explanation:
        "The document does not expose a clearly labelled company, institution, or issuer.",
      source: "content",
      category: "issuer",
      status: "warning",
      weight: 12,
    });

  const freeEmails = emails.filter((email) => freeMail.test(email));
  if (freeEmails.length)
    add({
      title: "Free-mail contact requires verification",
      explanation:
        "A public mailbox does not prove manipulation, but it should be confirmed through an independently located issuer channel.",
      source: "content",
      category: "issuer",
      status: "warning",
      weight: 18,
      evidence: freeEmails.join(", "),
    });
  else if (emails.length)
    add({
      title: "Organization-domain contact found",
      explanation:
        "A non-free email domain is present. Domain ownership still needs independent verification.",
      source: "content",
      category: "issuer",
      status: "info",
      weight: 0,
      evidence: emails.join(", "),
    });

  const emailDomains = Array.from(
    new Set(emails.map((email) => email.split("@")[1].toLowerCase())),
  );
  const businessDomains = emails
    .filter((email) => !freeMail.test(email))
    .map((email) => email.split("@")[1].toLowerCase());
  const verificationUrls = urls.filter((url) =>
    /verify|verification|validate|certificate|credential/i.test(url),
  );
  const labelledWebsiteUrls = Array.from(
    structuredText.matchAll(
      /(?:website(?:\s+(?:listed|shown|provided|in|the|document)){0,5}|official (?:site|website)|verification (?:url|link)|verify (?:at|here))\s*[:#-]?\s*(https?:\/\/[^\s)\]}>]+)/gi,
    ),
    (match) => match[1],
  );
  const comparisonUrls = Array.from(
    new Set([...labelledWebsiteUrls, ...verificationUrls, ...qrCodes]),
  ).filter((value) => /^https?:\/\//i.test(value));
  const urlDomains = Array.from(
    new Set(comparisonUrls.map(hostname).filter(Boolean)),
  );
  const domainsAlign = businessDomains.some((emailDomain) =>
    urlDomains.some(
      (urlDomain) =>
        urlDomain === emailDomain ||
        urlDomain.endsWith("." + emailDomain) ||
        emailDomain.endsWith("." + urlDomain),
    ),
  );
  const domainComparison: DocumentReport["domainComparison"] =
    businessDomains.length && urlDomains.length
      ? domainsAlign
        ? {
            emailDomains,
            websiteDomains: urlDomains,
            status: "aligned",
            explanation:
              "The organization email and supplied website use the same domain family. Ownership still needs independent verification.",
          }
        : {
            emailDomains,
            websiteDomains: urlDomains,
            status: "mismatch",
            explanation:
              "The organization email and supplied website domains do not align. Confirm both through a separately located official source.",
          }
      : {
          emailDomains,
          websiteDomains: urlDomains,
          status: "unverifiable",
          explanation: freeEmails.length
            ? "Only a free-mail contact was found, so domain ownership cannot be compared reliably."
            : "Both an organization email domain and a supplied website are needed for a domain comparison.",
        };
  if (domainComparison.status === "mismatch")
    add({
      title: "Contact and website domains differ",
      explanation:
        "The document's email and web domains do not align. Verify both using the issuer's independently located website.",
      source: "verification",
      category: "issuer",
      status: "warning",
      weight: 16,
      evidence: businessDomains.join(", ") + " vs " + urlDomains.join(", "),
    });
  else if (domainComparison.status === "aligned")
    add({
      title: "Contact and website domains align",
      explanation: domainComparison.explanation,
      source: "verification",
      category: "issuer",
      status: "pass",
      weight: 0,
      evidence: businessDomains.join(", ") + " and " + urlDomains.join(", "),
    });

  if (documentId === NOT_DETECTED)
    add({
      title: "Document identifier not detected",
      explanation:
        "No clearly labelled certificate, document, registration, or reference number was found.",
      source: "content",
      category: "verification",
      status: "warning",
      weight: 6,
    });
  else
    add({
      title: "Document identifier found",
      explanation:
        "Use this identifier only on an official issuer verification channel.",
      source: "content",
      category: "verification",
      status: "pass",
      weight: 0,
      evidence: documentId,
    });

  add({
    title: verificationUrls.length
      ? "Possible verification link found"
      : "No verification link detected",
    explanation: verificationUrls.length
      ? "Open it only after independently confirming that the domain belongs to the claimed issuer."
      : "Many legitimate documents lack a link, so this is informational rather than proof of risk.",
    source: "verification",
    category: "verification",
    status: "info",
    weight: 0,
    ...(verificationUrls.length
      ? { evidence: verificationUrls.join(", ") }
      : {}),
  });

  if (qrCodes.length)
    add({
      title: "QR code content extracted",
      explanation:
        "The embedded value is shown as evidence only. Confirm a destination domain before opening it or entering personal information.",
      source: "verification",
      category: "verification",
      status: "info",
      weight: 0,
      evidence: qrCodes.join(", "),
    });

  add({
    title:
      input.signatureFields > 0
        ? "PDF signature field detected"
        : "No PDF signature field detected",
    explanation:
      input.signatureFields > 0
        ? "A signature field exists, but its cryptographic trust chain has not been independently validated."
        : "Unsigned PDFs can still be legitimate. This does not add risk points.",
    source: "metadata",
    category: "integrity",
    status: "info",
    weight: 0,
    ...(input.signatureFields > 0
      ? { evidence: String(input.signatureFields) + " signature field(s)" }
      : {}),
  });

  const software =
    (input.metadata.creator ?? "") + " " + (input.metadata.producer ?? "");
  if (/photoshop|illustrator|canva|gimp|image editor/i.test(software))
    add({
      title: "Editing software appears in metadata",
      explanation:
        "Design software may be legitimate, but the file should be checked against an issuer-provided original.",
      source: "metadata",
      category: "metadata",
      status: "warning",
      weight: 10,
      evidence: software.trim(),
    });

  const created = pdfDate(input.metadata.creationDate);
  const modified = pdfDate(input.metadata.modDate);
  if (created && modified && modified.getTime() - created.getTime() > 86400000)
    add({
      title: "PDF was modified after creation",
      explanation:
        "A later modification date is supporting context only and does not establish tampering.",
      source: "metadata",
      category: "metadata",
      status: "info",
      weight: 0,
      evidence: input.metadata.creationDate + " to " + input.metadata.modDate,
    });

  const currentYear = new Date().getUTCFullYear();
  const futureDate = dates.find((date) => {
    const year = Number(date.match(/\d{4}/)?.[0] ?? 0);
    return year > currentYear + 1;
  });
  if (futureDate)
    add({
      title: "Unexpected future date",
      explanation:
        "A date substantially beyond the current year requires confirmation from the issuer.",
      source: "content",
      category: "content",
      status: "warning",
      weight: 14,
      evidence: futureDate,
    });

  const documentTrustScore = Math.min(
    100,
    Object.values(categoryScores).reduce((sum, score) => sum + score, 0),
  );
  if (opportunityReport) {
    categoryScores.content = Math.max(
      categoryScores.content,
      opportunityReport.overallScore,
    );
    for (const evidence of opportunityReport.evidenceList) {
      if (evidence.flagType === "generic-recruiter-email") continue;
      findings.push({
        id: "df-" + (findings.length + 1),
        title: evidence.flagType
          .split("-")
          .map((part) => part[0].toUpperCase() + part.slice(1))
          .join(" "),
        explanation: evidence.explanation,
        source: "content",
        category: "content",
        status: "warning",
        weight: evidence.ruleWeight ?? 0,
        evidence: evidence.sourceQuote,
      });
    }
  }
  const overallScore = Math.max(
    documentTrustScore,
    opportunityReport?.overallScore ?? 0,
  );
  const riskLevel: RiskLevel =
    overallScore > 50 ? "high" : overallScore > 20 ? "caution" : "low";
  return {
    kind: "document-report",
    id: "DOC-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
    createdAt: new Date().toISOString(),
    fileName: input.fileName,
    mimeType: input.mimeType,
    sha256: input.sha256,
    pageCount: input.pageCount,
    documentType,
    riskLevel,
    overallScore,
    verdict:
      riskLevel === "high"
        ? "High concern - issuer verification required"
        : riskLevel === "caution"
          ? "Needs review - verify before relying on it"
          : "Low detected concern - still verify the issuer",
    categoryScores,
    extracted: {
      organization,
      candidateName,
      documentId,
      amounts,
      dates,
      emails,
      urls,
      qrCodes,
    },
    domainComparison,
    metadata: input.metadata,
    signatureStatus:
      input.signatureFields > 0 ? "present-unverified" : "not-detected",
    findings,
    recommendations: [
      "Verify the document through contact details found independently on the issuer's official website.",
      ...(documentId !== NOT_DETECTED
        ? [
            "Ask the issuer to confirm document ID " +
              documentId +
              " through an official channel.",
          ]
        : []),
      "Compare the SHA-256 fingerprint only with a fingerprint supplied by a trusted issuer.",
      ...(freeEmails.length
        ? ["Do not rely on the free-mail contact as proof of issuer identity."]
        : []),
      ...(opportunityReport?.categoryScores.payment
        ? [
            "Do not pay any candidate-facing fee or deposit until the request is independently verified.",
          ]
        : []),
      ...(opportunityReport?.categoryScores.document
        ? [
            "Do not share identity, banking, or account credentials through an unverified recruitment channel.",
          ]
        : []),
    ],
    limitations: [
      "This analysis cannot establish authenticity or issuer intent.",
      "Metadata can be missing or legitimately changed, and signature presence is not the same as cryptographic validation.",
      "QR destinations are decoded but are not opened or treated as proof of ownership.",
      "Visual tampering detection and issuer-database verification are not included.",
    ],
  };
}
