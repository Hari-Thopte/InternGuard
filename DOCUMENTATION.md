# InternGuard Risk Intelligence Platform — Complete System Documentation

> **Project Group**: Cipher  
> **Team Leader**: Harshika Thopte  
> **Team Members**: Ishan Sonawane, Aisha Shaikh  

InternGuard is a transparent, explainable internship risk-intelligence platform designed to help students, career applicants, and college Training and Placement Offices (TPOs) evaluate pasted recruiter messages, offer screenshots, public job listing URLs, and uploaded certificates or offer letters.

---

## 1. Executive Summary & Core Philosophy

### 1.1 Purpose
Internship fraud and recruitment scams exploit students through fake selection processes, candidate-facing fees, fake offer letters, and credential harvesting. InternGuard provides immediate, transparent risk signals without requiring accounts, subscriptions, or invasive data collection.

### 1.2 Core Trust Principles
1. **Explainable Rule-Based Engine**: InternGuard uses explicit, transparent heuristic rules—not a trained black-box machine learning classifier.
2. **Zero False Certainty**: InternGuard **never** declares any company, recruiter, or document fraudulent, nor does it guarantee an opportunity is authentic.
3. **Strict Phrasing Taxonomy**:
   - **High Risk**: `High Risk — Verify Before Proceeding`
   - **Caution**: `Caution — Independent Verification Needed`
   - **Low Detected Risk**: `Low Detected Risk — Not Proof of Legitimacy`
4. **Mandatory Reporting & Action Paths**: Every report surfaces concrete verification steps and official escalation channels (e.g., National Cyber Crime Reporting Portal `cybercrime.gov.in`, institutional TPO / placement cell contact).

---

## 2. System Architecture & Technology Stack

```
+-----------------------------------------------------------------------------------+
|                                  NEXT.JS 16 APP ROUTER                            |
|                                                                                   |
|   +--------------------------+   +----------------------+   +------------------+  |
|   |    React UI Components   |   |   Heuristic Engine   |   | Document Engine  |  |
|   | Space Grotesk / Inter    |   | (Text / Screenshot)  |   |   (PDF / Image)  |  |
|   +------------+-------------+   +----------+-----------+   +--------+---------+  |
|                |                            |                        |            |
|                v                            v                        v            |
|   +--------------------------+   +----------------------+   +------------------+  |
|   |      Browser History     |   | Safe URL Fetcher     |   | Python Subprocess|  |
|   |  (Local Storage Capped 6)|   | (SSRF Guard & DNS)   |   | (PyMuPDF/Tess/CV)|  |
|   +--------------------------+   +----------------------+   +------------------+  |
+-----------------------------------------------------------------------------------+
```

### 2.1 Technology Stack Matrix
| Layer                  | Technology                                    | Purpose                                                                                                   |
| :--------------------- | :-------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Framework**          | Next.js 16.3.2 (App Router, Node.js runtime)  | Page routing, SSR, and API route handlers                                                                 |
| **Language**           | TypeScript 5.7.2                              | Type-safe contracts across UI, engines, and APIs                                                          |
| **UI & Styling**        | React 19, Tailwind CSS 3.4, Lucide Icons      | Fully responsive security console UI with expanded full-width Forensic Telemetry & Signal Spectrum Graph for document scanning checks |
| **Typography**         | `next/font` (Space Grotesk & Inter)           | Technical display headlines and readable interface text                                                   |
| **Animations**         | Framer Motion 11 (`motion.dev`), GSAP | All 6 Motion transition categories + Continuous 3D Device Flip & Chip Pipeline (`ChipVerificationAnimation.tsx`) + AI Shield Architecture (`LovableShieldAnimation.tsx`) + Animated Forensic Signal Spectrum Equalizer & Telemetry Ticker (`ForensicTelemetryWidget.tsx`) |
| **Data Visualization** | Recharts 2.15, SVG Vector Engine               | Score gauges, severity distribution, Category Risk Distribution Graph (`CategoryRiskGraph.tsx`) with full container width, zero empty gaps, and printable PDF vector charts |
| **Python Worker**      | Python 3.11+, PyMuPDF 1.24+, OpenCV 4.x, NumPy, ZipFile | PDF page parsing, DOCX document inspection, metadata extraction, QR code decoding |
| **OCR Engine**         | Windows Native WinRT OCR (`windows_ocr.ps1`), Tesseract OCR | Zero-dependency Windows Native WinRT OCR engine + Tesseract fallback for instant screenshot image text extraction |
| **Validation & Test**   | Zod 3.24, Vitest 2.1                          | API payload schema validation and heuristic unit tests                                                    |

---

## 3. Analysis Pipelines & Heuristic Engines

### 3.1 Text & Opportunity Heuristic Engine (`src/lib/heuristicEngine.ts`)

#### Heuristic Rule Dictionary
The heuristic engine evaluates normalized text against 14 named rules categorized into 5 dimensions:

| Rule ID | Category | Weight | Severity | Trigger Pattern Summary |
| :--- | :--- | :---: | :---: | :--- |
| `upfront-payment` | Payment | 38 | High | Requests for registration, training, security, or application fees |
| `interview-fee` | Payment | 38 | High | Charging candidates to interview or participate in screening |
| `unofficial-payment` | Payment | 34 | High | Payment via UPI, personal accounts, crypto, wallets, or QR codes |
| `required-equipment-purchase` | Payment | 34 | High | Vendor-directed laptop/device purchase with reimbursement promises |
| `mandatory-paid-training` | Payment | 30 | High | Compulsory paid courses or certification fees prior to onboarding |
| `artificial-urgency` | Urgency | 24 | Caution | High-pressure timers ("act within 30 mins", "today only", "offer expires") |
| `sensitive-documents` | Document | 28 | High | Premature requests for Aadhaar, PAN card, passport, bank OTP/CVV |
| `credential-request` | Document | 36 | High | Asking for passwords, login OTPs, screen sharing, or remote access |
| `software-download` | Document | 28 | High | Instructions to install APKs, `.exe` files, AnyDesk, or TeamViewer |
| `generic-recruiter-email` | Recruiter | 18 | Caution | Recruiter contact using free mailboxes (@gmail, @yahoo, @outlook) |
| `chat-only-recruitment` | Recruiter | 16 | Caution | Screening conducted solely through WhatsApp or Telegram |
| `unrealistic-compensation` | Company | 22 | Caution | Suspiciously high stipend/salary claims (e.g. ₹1 Lakh/week for interns) |
| `guaranteed-selection` | Company | 18 | Caution | Claims of "100% placement", "no interview needed", "guaranteed job" |
| `shortened-link` | Company | 16 | Caution | Obfuscated destination links (`bit.ly`, `tinyurl.com`, `t.co`, etc.) |

#### Negation & Context Logic
To prevent false positives, `negatesRule()` checks sentence structure for explicit negative qualifiers (e.g., *"No registration fee required"*, *"Equipment is provided free of charge"*).

`isCompensationStatement()` separates legitimate employer stipend statements (*"We pay a stipend of ₹15,000/month"*) from candidate fee requests (*"Candidate must deposit ₹15,000"*).

#### Category Scoring Math
Each triggered rule contributes to its category score (`0 - 100`). The overall score combines the single highest category peak with a weighted sum of all category scores:

$$\text{Overall Score} = \operatorname{clamp}\left( \left\lceil \max(\text{CategoryScores}) \times 0.55 + \sum(\text{CategoryScores}) \times 0.12 \right\rceil \right)$$

- **Overall Score $\ge 55$**: `high` (`High Risk — Verify Before Proceeding`)
- **Overall Score $22 - 54$**: `caution` (`Caution — Independent Verification Needed`)
- **Overall Score $< 22$**: `low` (`Low Detected Risk — Not Proof of Legitimacy`)

---

### 3.2 Document Inspection Engine (`src/lib/documentEngine.ts` & `scripts/document_analyzer.py`)

#### Pipeline Stages
```
  [ Upload PDF / Image ] 
            │
            ▼
  [ Magic Bytes Validation ] (PDF %PDF-, PNG, JPEG, WebP | Max 10MB, Max 12 PDF pages)
            │
            ▼
  [ Temporary File Creation ] -> [ Python Worker Execution (PyMuPDF / OpenCV / Tesseract) ]
            │                                     │
            ▼                                     ▼
  [ SHA-256 Hash Generation ]        [ Text Extraction + Metadata + QR Codes + Signature Fields ]
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
                   [ Domain Alignment Check ] (Email Domain vs Web Domain)
                               │
                               ▼
                [ Composite Findings & Scoring ] -> [ Clean Up Temp Directory ]
```

#### Document Category Dimensions
1. **Issuer**: Evaluates issuer name presence, free-mail domain risk, and organization domain matching.
2. **Content**: Analyzes text density, classification (Certificate, Offer Letter, Appointment Letter, Experience Letter), monetary mentions, and future dates.
3. **Metadata**: Inspects PDF creation/modification date deltas and editing software traces (Photoshop, Canva, Illustrator).
4. **Integrity**: Generates SHA-256 fingerprint and detects PDF digital signature form fields.
5. **Verification**: Detects document reference IDs, verification URLs, and decoded QR code destinations.

#### Domain Alignment Status
- **`aligned`**: Email domain and website domain match or belong to the same parent domain.
- **`mismatch`**: Recruiter/issuer email domain conflicts with the document's listed web domain.
- **`unverifiable`**: Free-mail address used or missing official website comparison domain.

---

## 4. Security, Privacy & Infrastructure Safeguards

### 4.1 Server-Side Request Forgery (SSRF) Prevention (`src/lib/safeUrl.ts`)

Public job listing URLs undergo strict validation before fetching:
1. **Protocol Restriction**: Only HTTP and HTTPS protocols are accepted.
2. **DNS Pre-Validation**: Hostnames are resolved to IP addresses before sending HTTP requests. Rejects:
   - Loopback (`127.0.0.0/8`, `::1`)
   - Private IPv4 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
   - Link-local (`169.254.0.0/16`, `fe80::/10`)
   - Carrier-grade NAT (`100.64.0.0/10`)
   - Multicast & Reserved IP blocks
3. **Redirect Tracking & DNS Pinning**: Redirects are re-validated against IP blocklists. Requests are pinned to the pre-validated IP to prevent **DNS Rebinding** attacks.
4. **Fetch Bounds**: 10-second timeout, 2 MB response size limit, text content capped at 20,000 characters.

### 4.2 Rate Limiting
API routes enforce sliding-window in-memory rate limiting per client IP:
- `POST /api/analyze` (Text/URL): 12 requests/minute.
- `POST /api/analyze` (Screenshot OCR): 4 requests/minute.
- `POST /api/analyze-document` (PDF/Image): 4 requests/minute.

### 4.3 Data Privacy & Zero-Knowledge Architecture
- **No User Accounts or DB**: All report history remains strictly in `window.localStorage`.
- **History Isolation**: Accessible only through `historyStore.ts` and `documentHistoryStore.ts`. Scan history is automatically capped at the 6 most recent reports.
- **Immediate Worker Cleanup**: Temporary document files in Node.js/Python processing are deleted in `finally` execution blocks regardless of success or error.

---

## 5. UI System & Application Routes

### 5.1 Design Tokens & Visual Language
- **Theme**: Security console aesthetic with mineral surfaces.
- **Palette**:
  - Dark Canvas: `#071419`
  - Dark Surface: `#0B1D23`
  - Raised Panel: `#11282E`
  - Technical Teal: `#49E1D2`
  - Text Primary: `#EEF7F4`
  - Muted Text: `#97AEAD`
- **Risk Severity Badges**:
  - Low Risk: `#50C790` (Emerald)
  - Caution: `#F4B84A` (Amber)
  - High Risk: `#F4695C` (Coral Red)

### 5.2 Application Sitemap
- `/` — Landing page with interactive hero, capability showcases, methodology summary, and quick scan entry.
- `/analyze` — Multi-panel analysis workspace (Text, Screenshot/OCR, Public URL, PDF Document upload).
- `/dashboard` — Unified scan statistics, risk trend chart, radar category plot, and filterable history log.
- `/report/[id]` — Saved opportunity report view restored from local browser storage.
- `/document-report/[id]` — Saved document inspection report view.
- `/how-it-works` — Interactive, transparent 5-stage detection pipeline explanation.
- `/red-flags` — Searchable educational library of common internship scam tactics and red flags.
- `/about` — Platform philosophy, engine boundaries, and trust commitments.
- `/free-for-students` — Institutional access details and student guarantee.
- `/contact` — Step-by-step reporting guide for students, TPOs, and victims of cyber fraud.
- `/print-preview` — Clean, printer-friendly preview designed for physical submit-to-TPO documentation.

---

## 6. API Specifications & Data Schemas

### 6.1 `POST /api/analyze`

#### JSON Request (Text or URL)
```json
{
  "sourceType": "text",
  "content": "Selected for Python Intern role! Pay registration fee of Rs. 2,500 to UPI account intern@upi within 2 hours to confirm seat."
}
```

#### Response Contract (`RiskReport`)
```typescript
export interface RiskReport {
  id: string; // e.g. "IG-A8F29C1E"
  createdAt: string; // ISO timestamp
  sourceType: "text" | "image" | "url";
  sourceLabel: string;
  riskLevel: "low" | "caution" | "high";
  verdict: string; // Phrasing taxonomy
  confidence: "low" | "medium" | "high";
  overallScore: number; // 0 - 100
  categoryScores: {
    recruiter: number;
    company: number;
    payment: number;
    document: number;
    urgency: number;
  };
  extracted: {
    recruiterContact: string;
    monetaryMentions: string[];
    links: string[];
  };
  sourceContext?: {
    sourceKind: "pasted text" | "uploaded screenshot" | "public webpage";
    verifiedSource: string;
    organizationClue?: string;
    industry?: string;
    inferenceConfidence?: "low" | "medium";
    basis: string[];
  };
  evidenceList: Array<{
    id: string;
    sourceQuote: string;
    flagType: string;
    category: "recruiter" | "company" | "payment" | "document" | "urgency";
    severity: "low" | "caution" | "high";
    explanation: string;
    ruleWeight?: number;
  }>;
  recommendedActions: string[];
  limitations: string[];
  reportingLinks: Array<{ label: string; href: string; description: string }>;
}
```

---

### 6.2 `POST /api/analyze-document`

#### Multipart Form-Data Request
- `file`: PDF, PNG, JPEG, or WebP file (up to 10 MB).

#### Response Contract (`DocumentReport`)
```typescript
export interface DocumentReport {
  kind: "document-report";
  id: string; // e.g. "DOC-4B91E02F"
  createdAt: string;
  fileName: string;
  mimeType: string;
  sha256: string;
  pageCount: number;
  documentType: "Certificate" | "Offer letter" | "Appointment letter" | "Experience letter" | "Unclassified document";
  riskLevel: "low" | "caution" | "high";
  overallScore: number;
  verdict: string;
  categoryScores: {
    issuer: number;
    content: number;
    metadata: number;
    integrity: number;
    verification: number;
  };
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
  findings: Array<{
    id: string;
    title: string;
    explanation: string;
    source: "file" | "ocr" | "metadata" | "content" | "verification";
    category: "issuer" | "content" | "metadata" | "integrity" | "verification";
    status: "pass" | "info" | "warning";
    weight: number;
    evidence?: string;
  }>;
  recommendations: string[];
  limitations: string[];
}
```

---

## 7. Operational Guide & Commands

### 7.1 Local Development Setup

#### System Prerequisites
- **Node.js**: v20.9.0 or newer
- **Python**: v3.11 or newer
- **Tesseract OCR**: Installed at `C:\Program Files\Tesseract-OCR\tesseract.exe` (Windows) or on `PATH` (Linux/macOS)

#### Installation Commands
```powershell
# 1. Install Node.js dependencies
npm install

# 2. Install Python worker dependencies
python -m pip install -r requirements.txt

# 3. Start development server
npm run dev
```
Open `http://localhost:3000` in browser.

### 7.2 Quality Assurance & Build Commands
```powershell
# Run heuristic & document unit tests
npm test

# Run ESLint validation
npm run lint

# Check TypeScript build
npm run build

# Run production dependency security audit
npm audit --omit=dev
```

---

## 8. Summary of File Artifacts in Workspace

| File Path | Description |
| :--- | :--- |
| [`README.md`](file:///c:/Users/Hari/Desktop/InternGuard11/README.md) | Setup requirements, quickstart, security principles, and route summary |
| [`DECISIONS.md`](file:///c:/Users/Hari/Desktop/InternGuard11/DECISIONS.md) | Architectural choices, design rationale, and reference benchmarking |
| [`DOCUMENTATION.md`](file:///c:/Users/Hari/Desktop/InternGuard11/DOCUMENTATION.md) | **This master documentation document** |
| [`src/lib/heuristicEngine.ts`](file:///c:/Users/Hari/Desktop/InternGuard11/src/lib/heuristicEngine.ts) | Core heuristic analysis engine & rule definitions |
| [`src/lib/documentEngine.ts`](file:///c:/Users/Hari/Desktop/InternGuard11/src/lib/documentEngine.ts) | Document report synthesizer & domain comparison |
| [`scripts/document_analyzer.py`](file:///c:/Users/Hari/Desktop/InternGuard11/scripts/document_analyzer.py) | Python worker for PDF parsing, PyMuPDF, OCR, and QR decoding |
| [`src/lib/safeUrl.ts`](file:///c:/Users/Hari/Desktop/InternGuard11/src/lib/safeUrl.ts) | SSRF security guard, DNS validator, and safe URL retriever |
