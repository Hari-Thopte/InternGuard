"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const flags = [
  [
    "Payment",
    "Registration or application fee",
    "“Pay ₹2,500 before your offer letter is released.”",
    "Recruitment should not depend on an unverified candidate payment.",
  ],
  [
    "Payment",
    "Personal payment channel",
    "“Scan this personal UPI QR to reserve your seat.”",
    "Personal payment destinations reduce accountability and traceability.",
  ],
  [
    "Urgency",
    "Artificial deadline",
    "“Reply within 30 minutes or the offer expires.”",
    "Pressure can be used to prevent independent verification.",
  ],
  [
    "Recruiter",
    "Generic email domain",
    "“hiringteam@gmail.com” claiming to represent a named employer.",
    "A free mailbox is not proof of abuse, but the relationship needs confirmation.",
  ],
  [
    "Documents",
    "Sensitive identity request",
    "“Send Aadhaar, PAN, passport, and bank statement on WhatsApp.”",
    "Identity data should only be collected when necessary through verified systems.",
  ],
  [
    "Company",
    "Guaranteed outcome",
    "“100% selection, no interview required.”",
    "Guaranteed claims can conflict with a legitimate evaluation process.",
  ],
  [
    "Company",
    "Exceptional compensation",
    "“Earn ₹2 lakh per month as a first-week intern.”",
    "Unusually high claims should be confirmed on the official careers channel.",
  ],
  [
    "Recruiter",
    "Isolation language",
    "“Do not contact the company directly; this process is confidential.”",
    "Blocking verification is itself a material risk signal.",
  ],
];

export function RedFlagLibrary() {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All");
  const categories = ["All", ...Array.from(new Set(flags.map((f) => f[0])))];
  const visible = useMemo(
    () =>
      flags.filter(
        (f) =>
          (filter === "All" || f[0] === filter) &&
          f.join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [query, filter],
  );

  return (
    <>
      <div className="panel mt-10 p-4">
        <label className="flex items-center gap-3">
          <Search className="text-accent" />
          <span className="sr-only">Search red flags</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search payment, documents, recruiter…"
            className="h-11 flex-1 bg-transparent outline-none"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`relative rounded-full px-4 py-2 text-xs font-semibold transition-colors ${filter === c ? "text-[#06191d]" : "bg-raised text-muted hover:text-ink"}`}
            >
              {filter === c && (
                <motion.span
                  layoutId="activeFilterTagPill"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}
              <span className="relative z-10">{c}</span>
            </button>
          ))}
        </div>
      </div>
      <motion.div layout className="mt-6 grid gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {visible.map(([c, t, e, w]) => (
            <motion.article
              key={t}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="panel p-6"
            >
              <span className="eyebrow">{c}</span>
              <h2 className="mt-3 text-2xl font-semibold">{t}</h2>
              <blockquote className="mt-5 border-l-2 border-caution pl-4 text-sm leading-6">
                {e}
              </blockquote>
              <p className="mt-4 text-sm leading-6 text-muted">{w}</p>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
      {!visible.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="panel mt-6 p-8 text-center text-muted"
        >
          No patterns match that search.
        </motion.div>
      )}
    </>
  );
}
