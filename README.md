# InternGuard

InternGuard is a transparent internship risk-intelligence product for pasted messages, screenshots, public listing URLs, and uploaded certificates or letters. It uses explainable heuristic engines—not a trained fraud classifier—and never declares a company, recruiter, or document fraudulent.

Every hard load or refresh shows a 2.8-second skippable brand reveal. It does not replay during client-side navigation and automatically switches to a sub-second static fade when reduced motion is preferred.

## Windows setup

Requirements:

* Node.js 20.9 or newer
* npm
* Python 3.11 or newer with PyMuPDF
* Tesseract OCR installed at `C:\\\\Program Files\\\\Tesseract-OCR\\\\tesseract.exe` for screenshot and scanned-document analysis

On Linux or macOS, install Tesseract so the `tesseract` command is available on `PATH`. `TESSERACT\\\_COMMAND` can override the executable location on any platform.

```powershell
cd C:\\\\Users\\\\Ishan\\\\InternGuard11
npm install
python -m pip install -r requirements.txt
npm run dev
```

Open `http://localhost:3000`.

After the one-time dependency setup, `npm run dev` starts the Next.js frontend and both analysis APIs. No account, API key, database, or environment file is required. If Tesseract is installed elsewhere, set `TESSERACT\\\_COMMAND` before starting:

```powershell
$env:TESSERACT\\\_COMMAND='C:\\\\path\\\\to\\\\tesseract.exe'
npm run dev
```

## Quality checks

```powershell
cd C:\\\\Users\\\\Ishan\\\\InternGuard11
npm test
npm run lint
npm run build
npm audit --omit=dev
```

## Routes

* `/` — landing and report preview
* `/analyze` — text, screenshot/OCR, public URL, and document investigation
* `/dashboard` — unified browser-local opportunity and document trends, filters, context, and recent reports
* `/report/\\\[id]` — full saved report restored from local browser history
* `/document-report/\\\[id]` — full saved document report restored from local browser history
* `/how-it-works` — transparent detection pipeline
* `/red-flags` — searchable educational library
* `/about` — methodology, limitations, and trust principles
* `/free-for-students` — access and included capabilities
* `/contact` — official reporting and evidence-preservation guidance
* `/api/analyze` — stable JSON/multipart analysis contract
* `/api/analyze-document` — bounded PDF/image document inspection contract

## Security and integrity

* Public URL retrieval accepts only HTTP(S), resolves and rejects private/reserved destinations, revalidates redirects, limits redirects, time, content type, response size, and extracted text.
* Public URL requests are pinned to their validated DNS result to prevent a second resolution from switching to a private address.
* Analysis requests use a bounded in-memory per-client throttle; production deployments with multiple instances should replace it with a shared rate-limit store.
* Screenshot intake accepts PNG/JPEG/WebP up to 5 MB and bounds OCR execution time/output.
* Document intake validates file signatures, accepts PDF/PNG/JPEG/WebP up to 10 MB, limits PDFs to 12 pages, creates a SHA-256 fingerprint, and deletes temporary files after inspection.
* Document reports separate issuer, content, metadata, integrity, and verification-path signals. They do not claim authenticity, validate signature trust chains, or perform visual tamper detection.
* Candidate-paid fees and compensation are contextually distinct; “₹4,000 stipend” does not trigger the payment rule.
* Scores are backend-owned category contributions. The UI renders the returned report and never invents a second verdict.
* Recent reports remain in browser local storage.
* Stored reports are schema-validated and migrated to a versioned key before rendering.
* Dashboard data access is isolated behind `historyStore.ts`, keeping a future database migration separate from UI code.
* Every report includes confidence, limitations, verification actions, and official reporting paths.

## Important limitation

InternGuard surfaces risk signals. It cannot authenticate an employer, establish intent, provide legal advice, or confirm fraud. Low detected risk is not proof of legitimacy.

