import { SavedDocumentReport } from "@/components/SavedDocumentReport";

export const metadata = { title: "Saved document report" };

export default function SavedDocumentReportPage() {
  return (
    <main id="main" className="section">
      <div className="shell">
        <SavedDocumentReport />
      </div>
    </main>
  );
}
