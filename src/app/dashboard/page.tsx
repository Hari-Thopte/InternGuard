import { Dashboard } from "@/components/Dashboard";
export const metadata = { title: "Dashboard" };
export default function DashboardPage() {
  return (
    <main id="main" className="section">
      <div className="shell">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Personal risk desk</p>
            <h1 className="title mt-4">
              Your scan activity, without surveillance.
            </h1>
            <p className="mt-3 max-w-2xl text-muted">
              Trends are calculated from reports stored in this browser. No
              account or remote profile is created.
            </p>
          </div>
        </div>
        <Dashboard />
      </div>
    </main>
  );
}
