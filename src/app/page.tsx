"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeIndianRupee,
  FileCheck2,
  FileImage,
  Globe2,
  MessageSquareText,
  Radar,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { HeroStats } from "@/components/HeroStats";
import { ChipVerificationAnimation } from "@/components/ChipVerificationAnimation";
import { LovableShieldAnimation } from "@/components/LovableShieldAnimation";

export default function Home() {
  return (
    <main id="main">
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="scan-grid absolute inset-0 opacity-50"
          aria-hidden="true"
        />
        <div
          className="scan-beam absolute inset-x-0 top-0 h-px"
          aria-hidden="true"
        />
        <div className="shell relative grid min-h-[calc(100vh-4rem)] items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
          >
            <p className="eyebrow">Internship trust intelligence</p>
            <h1 className="display mt-6">
              Investigate before you{" "}
              <span className="text-accent">accept.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">
              Turn a recruiter message, screenshot, public listing, or document
              into an explainable report before money, identity documents, or
              trust leave your hands.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link href="/analyze" className="button-primary w-full sm:w-auto">
                  Start a free investigation <ArrowRight size={17} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link href="/how-it-works" className="button-secondary w-full sm:w-auto">
                  See the transparent method
                </Link>
              </motion.div>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-muted">
              <span>✓ No account required</span>
              <span>✓ Rule-based, not black-box AI</span>
              <span>✓ Evidence stays traceable</span>
            </div>
            <HeroStats />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.215, 0.61, 0.355, 1] }}
            whileHover={{ y: -6, rotateX: 1, rotateY: -1 }}
            className="panel relative cursor-default select-none overflow-hidden p-5 shadow-glow transition-shadow hover:shadow-[0_20px_60px_rgb(var(--accent)/0.15)]"
            data-readonly-preview="true"
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <span className="eyebrow">Live report preview</span>
              <span className="flex items-center gap-2 text-xs text-low">
                <span className="h-2 w-2 rounded-full bg-low animate-pulse" />
                Engine ready
              </span>
            </div>
            <div className="mt-5 rounded-xl border border-high/30 bg-high/5 p-5">
              <span className="risk-badge risk-high">
                <Radar size={14} />
                High risk
              </span>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <strong className="font-display text-6xl">78</strong>
                  <span className="text-muted"> / 100</span>
                </div>
                <span className="text-xs font-semibold text-high">
                  High confidence flag
                </span>
              </div>
              <p className="mt-4 font-display text-xl">
                Verify before proceeding
              </p>
            </div>
            <div className="mt-4 grid gap-2">
              {[
                [
                  "Payment",
                  "Registration fee before joining",
                  BadgeIndianRupee,
                ],
                ["Recruiter", "Free email domain", MessageSquareText],
                ["Urgency", "Offer expires in 30 minutes", ScanSearch],
              ].map(([k, v, I]) => (
                <motion.div
                  key={String(k)}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 rounded-xl border border-line bg-raised/60 p-3 transition-colors hover:border-accent/40"
                >
                  <I className="text-caution" size={18} />
                  <span className="text-sm">
                    <strong>{String(k)}</strong>
                    <span className="block text-xs text-muted">
                      {String(v)}
                    </span>
                  </span>
                </motion.div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              Illustrative report. A risk flag is not a fraud determination.
            </p>
          </motion.div>
        </div>
      </section>
      <section className="section py-10 border-b border-line bg-surface/30">
        <div className="shell space-y-12">
          <ChipVerificationAnimation />
          <LovableShieldAnimation />
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <Reveal>
            <p className="eyebrow">Four sources. One evidence standard.</p>
            <h2 className="title mt-4 max-w-3xl">
              Start with what you actually received.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                MessageSquareText,
                "Paste a message",
                "Emails, chats, offer text, or job descriptions.",
              ],
              [
                FileImage,
                "Upload a screenshot",
                "Offer letters, payment prompts, or recruiter chats.",
              ],
              [
                Globe2,
                "Analyze a webpage",
                "Securely retrieve readable public listing content.",
              ],
              [
                FileCheck2,
                "Check a document",
                "Inspect certificates and letters with OCR, metadata, and a file fingerprint.",
              ],
            ].map(([I, t, d], i) => (
              <Reveal key={String(t)} className="h-full">
                <Link
                  href="/analyze"
                  className="panel group flex h-full flex-col justify-between p-6 transition-all hover:-translate-y-1.5 hover:border-accent hover:shadow-[0_12px_30px_rgb(var(--accent)/0.12)]"
                >
                  <div>
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
                      <I size={21} />
                    </span>
                    <h3 className="mt-8 flex min-h-[3.5rem] items-center font-display text-2xl font-semibold leading-tight">
                      0{i + 1}. {String(t)}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {String(d)}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-line bg-surface">
        <div className="shell">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {[
              ["Rule-based", "Not a black box"],
              ["Private by default", "No data resold"],
              ["₹0 for students", "No card required"],
              ["Action-ready", "Official report paths"],
            ].map(([a, b], i) => (
              <Reveal key={a} delay={i * 0.08} className="h-full">
                <div className="h-full bg-surface px-4 py-7 text-center transition-colors hover:bg-raised">
                  <strong className="block text-sm">{a}</strong>
                  <span className="mt-1 block text-xs text-muted">{b}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section border-y border-line bg-surface">
        <div className="shell grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <Reveal>
            <p className="eyebrow">Honest by design</p>
            <h2 className="title mt-4">
              Not a verdict machine. An evidence system.
            </h2>
            <p className="mt-5 leading-7 text-muted">
              InternGuard uses explicit rules, contextual extraction, and
              multi-factor scoring. Every flag points to the phrase that
              triggered it. No model gets to silently label a company
              fraudulent.
            </p>
            <Link href="/how-it-works" className="button-secondary mt-7">
              Explore the method <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal className="grid gap-3 sm:grid-cols-2">
            {[
              "Normalize the submitted evidence",
              "Separate stipend from candidate-paid fees",
              "Score recruiter, company, payment, document, and urgency signals",
              "Attach exact source quotes",
              "Pair every assessment with confidence",
              "End every report with verification and reporting paths",
            ].map((x, i) => (
              <div
                key={x}
                className="rounded-xl border border-line bg-canvas p-4"
              >
                <span className="font-mono text-xs text-accent">0{i + 1}</span>
                <p className="mt-3 text-sm font-semibold leading-6">{x}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <Reveal>
            <p className="eyebrow">Designed around the student decision</p>
            <h2 className="title mt-4 max-w-3xl">
              Calm enough to understand. Direct enough to act.
            </h2>
          </Reveal>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              [
                "“The exact quote made it easy to explain the concern to our placement coordinator.”",
                "Final-year engineering student",
              ],
              [
                "“The report separates a stipend from a fee instead of treating every rupee amount as suspicious.”",
                "University career volunteer",
              ],
              [
                "“It gives students a verification path without publicly accusing the employer.”",
                "Campus safety mentor",
              ],
            ].map(([q, a]) => (
              <blockquote key={q} className="panel p-6">
                <p className="leading-7">{q}</p>
                <footer className="mt-6 text-xs text-muted">
                  Illustrative perspective · {a}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
      <section className="section pt-0">
        <div className="shell">
          <Reveal className="panel grid gap-8 overflow-hidden bg-accent p-7 text-[#06191d] sm:p-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <ShieldCheck size={28} />
              <h2 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">
                Evidence before action.
              </h2>
              <p className="mt-4 max-w-2xl text-[#12363a]">
                Free for students. No account, no external AI key, and no hard
                accusations.
              </p>
            </div>
            <Link href="/analyze" className="button-primary button-on-accent">
              Analyze an opportunity <ArrowRight size={17} />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
