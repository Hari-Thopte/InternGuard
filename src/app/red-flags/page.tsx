import { RedFlagLibrary } from "@/components/RedFlagLibrary";
export const metadata = { title: "Red Flags Library" };
export default function RedFlags() {
  return (
    <main id="main" className="section">
      <div className="shell">
        <div className="max-w-4xl">
          <p className="eyebrow">Student safety library</p>
          <h1 className="display mt-5">
            Learn the pattern before it creates pressure.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Examples are educational signals, not proof that any individual
            recruiter or company is fraudulent.
          </p>
        </div>
        <RedFlagLibrary />
      </div>
    </main>
  );
}
