import { Analyzer } from "@/components/Analyzer";
export const metadata = { title: "Analyze an opportunity" };
export default function Analyze() {
  return (
    <main id="main" className="section">
      <div className="shell">
        <div className="mb-10 max-w-3xl">
          <p className="eyebrow">Investigation workspace</p>
          <h1 className="title mt-4">Trace the risk. Keep the evidence.</h1>
          <p className="mt-4 leading-7 text-muted">
            Submit one source at a time. Check messages, screenshots, webpages,
            certificates, and letters without turning a signal into a fraud
            declaration.
          </p>
        </div>
        <Analyzer />
      </div>
    </main>
  );
}
