# InternGuard design and engineering decisions

## Product integrity

- The strongest verdict is **“High Risk — Verify Before Proceeding.”** `RiskLevel` permits only `low`, `caution`, or `high`; there is no confirmed-fraud state.
- Every report carries `low`, `medium`, or `high` confidence and explicit limitations.
- The engine is named `heuristicEngine` in code and described as rule-based throughout the interface. No copy claims trained-AI certainty.
- No-signal reports say **“Low Detected Risk — Not Proof of Legitimacy.”**
- Every report ends with the National Cyber Crime Reporting Portal, placement-cell/TPO guidance, and platform reporting.

## Architecture

- Next.js 16.3.2 App Router with TypeScript provides the UI and one Node API route, allowing a single `npm run dev` command. This satisfies the requested Next.js 14+ stack while removing audited Next 14 production vulnerabilities.
- `src/lib/heuristicEngine.ts` owns normalization, extraction, named rules, category scoring, confidence, evidence, actions, and the stable `RiskReport` contract. It can be replaced behind `heuristicEngine.analyze` without changing UI code.
- Zod validates text and URL requests. Multipart image validation is performed before local Tesseract OCR.
- Public URL retrieval uses DNS validation plus redirect, timeout, MIME, byte, and text bounds. Private and reserved network targets are rejected to reduce SSRF risk.
- Scan history is capped at six reports and stored only in local storage. No account or database was introduced.
- Recharts renders the score gauge. Framer Motion handles entry/report transitions. GSAP ScrollTrigger powers the global scroll-progress trace. Motion is disabled or simplified under `prefers-reduced-motion`.

## Visual system

- Primary theme: dark security-console canvas with mineral surfaces rather than generic blue/purple SaaS gradients.
- Fonts: **Space Grotesk** for display/headlines and **Inter** for body/interface text, loaded with `next/font`.
- Dark palette: canvas `#071419`, surface `#0B1D23`, raised `#11282E`, text `#EEF7F4`, muted `#97AEAD`, forensic teal `#49E1D2`.
- Risk tokens: low `#50C790`, caution `#F4B84A`, high `#F4695C`. Labels and icons accompany color everywhere.
- Light palette uses mineral white and dark teal with the same semantic structure.
- Radius is restrained at 20px for primary panels and 12px for internal evidence units. Thin technical borders and quiet grid traces create depth without glass-heavy decoration.
- The original SVG logo combines a shield, check, and horizontal scan trace. It is theme-aware and reused as the favicon.
- No custom cursor was added; native pointer feedback is more accessible and precise.

## UX and performance

- Source selection is a keyboard-operable tablist with text, screenshot, and URL panels.
- Analysis stages are explicitly labeled as presentation sequencing, not backend telemetry.
- Inputs remain visible during errors; failures never fall back to fabricated sample reports.
- Report relationships are ordered as signal → exact quote → explanation → action.
- Blob screenshot previews use `next/image` in unoptimized local-preview mode; no user image is sent to an image optimization service.
- Background effects use CSS gradients and transform/opacity animation only. No WebGL payload was justified.
- Dark mode is the default; a visible light-mode toggle updates semantic tokens.
- Screenshots larger than 800 KB are resized client-side to a maximum 1600px edge and JPEG quality 0.84 before upload, reducing OCR latency while retaining readable text.
- `IntroReveal.tsx` provides the first-session brand reveal as a root-layout overlay. Seven internship/verification line icons converge into the shield, then reveal “Verify before you trust.” The session is marked immediately in `sessionStorage`, Skip appears after one second, and the overlay self-dismisses at 2.8 seconds.
- Reduced-motion users receive only a static shield/tagline fade lasting under 0.9 seconds; orbital and convergence motion is omitted. The site renders beneath the overlay throughout, so the reveal is not an asset-loading gate.

## Reference-specific decisions

- **Aura cyber-security template:** used only for the Results and Dashboard structural language—dark layered panels, compact severity tags, a radar-style category plot, and bounded data regions. Its branding and page composition were not copied.
- **TrustChecker / ScamAdviser:** used only for report information architecture and cautious score phrasing. InternGuard separates assessment, key extracted facts, evidence/reasoning, recommendations, and reporting paths; it does not inherit consumer-review claims or community verdicts.
- **Blackbird IT:** used only for landing-page pacing: decisive hero, a horizontal capability/trust row, spaced capability sections, perspectives, and a focused closing CTA. The content remains student safety rather than IT services.
- **Wiz:** used only for calm security-product tone and severity restraint. Risk color appears in badges, charts, and key borders rather than flooding the interface.
- **Prove:** used only for action design. Verification steps are concrete, single-purpose instructions and the reporting block keeps one clear next action per row.
- **Looper / Outcrowd:** used only for whitespace discipline, asymmetric hero balance, restrained radii, and consistent card rhythm. No aviation imagery, 3D objects, or procurement content was reused.

## Dashboard

- The Dashboard reads through `historyStore.ts`, not directly from component-specific storage calls, so a remote repository can replace local storage later.
- Summary cards count total scans, high-risk flags, low-detected-risk reports, and average risk score. “Verified safe” was intentionally rejected because InternGuard cannot verify legitimacy.
- The trend chart uses assessment scores over time; the radar chart averages the five backend-owned signal dimensions.
- Filters cover risk, source, and 7/30/90-day ranges. Desktop uses a table-like grid; the same rows naturally collapse into mobile cards.
- Saved reports use `/report/[id]` and remain device-local. The empty state explains this boundary and leads directly to analysis.

## Testing

- Vitest covers fee-versus-stipend context, non-conclusive low results, and the prohibition on confirmed-fraud language.
- ESLint and strict TypeScript run as part of validation.
- Production build and production dependency audit must pass before release.
- Interactive browser control was unavailable in the build session; localhost routes and the live text-analysis API were smoke-tested directly. This limitation is recorded rather than overstating visual QA.
