"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Shield,
  Radar,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Search,
  Banknote,
  Building2,
  Mail,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function LovableShieldAnimation() {
  const [scanning, setScanning] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const reduced = useReducedMotion();

  // Auto-advance scanning stages
  useEffect(() => {
    if (reduced) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3200);
    return () => clearInterval(interval);
  }, [reduced]);

  const pipelineSteps = [
    {
      num: "01",
      title: "Ingest & Normalize",
      desc: "Listing text, recruiter contacts, and metadata parsed into structured records.",
      icon: Search,
      tag: "Raw Ingestion",
    },
    {
      num: "02",
      title: "Deterministic Rules",
      desc: "Hard rules catch known payment requests & fee patterns with zero guesswork.",
      icon: Lock,
      tag: "Rule Engine",
    },
    {
      num: "03",
      title: "Context Layer",
      desc: "Deep analysis reads sentence context, stipend vs fee, and urgency intent.",
      icon: Sparkles,
      tag: "Context Engine",
    },
    {
      num: "04",
      title: "Explainable Verdict",
      desc: "Merges all signals into an overall score with exact evidence quotes attached.",
      icon: CheckCircle2,
      tag: "Auditable Report",
    },
  ];

  const signalCards = [
    {
      title: "Payment Requests",
      icon: Banknote,
      badge: "High Risk Signal",
      color: "text-high border-high/30 bg-high/10",
      quote: "“Pay ₹2,500 registration fee before your offer letter is released.”",
      explanation: "Upfront fees for training or equipment are flagged and traced back to the exact line.",
    },
    {
      title: "Unrealistic Salaries",
      icon: Zap,
      badge: "Caution Signal",
      color: "text-caution border-caution/30 bg-caution/10",
      quote: "“Earn ₹1,500,000 per month as a first-week remote intern.”",
      explanation: "Offered pay is compared against role baselines to surface implausible compensation.",
    },
    {
      title: "Fake Company Info",
      icon: Building2,
      badge: "Integrity Flag",
      color: "text-accent border-accent/30 bg-accent/10",
      quote: "Company domain age < 7 days; missing official corporate registry.",
      explanation: "Entity registration and public footprints are cross-checked for verification.",
    },
    {
      title: "Suspicious Contacts",
      icon: Mail,
      badge: "Recruiter Flag",
      color: "text-low border-low/30 bg-low/10",
      quote: "Recruiter contact: hiringteam_internship@gmail.com on Telegram only.",
      explanation: "Free mailboxes, mismatched domain pairs, and chat-only hiring flows are scored.",
    },
  ];

  return (
    <section className="relative overflow-hidden py-12">
      {/* Background Radial Glow & Radar Sweep */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="scan-grid absolute inset-0 opacity-20" />
      </div>

      <div className="shell relative z-10 space-y-12">
        {/* Main Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent shadow-[0_0_20px_rgb(var(--accent)/0.2)]"
          >
            <Shield size={14} className="animate-pulse" />
            AI Shield Architecture
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-6xl font-bold tracking-tight"
          >
            Fraud detection for internships that{" "}
            <span className="text-accent underline decoration-accent/40 decoration-wavy underline-offset-8">
              shows its evidence.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted text-base sm:text-lg leading-relaxed"
          >
            InterGuard detects suspicious internship patterns — payment requests, unrealistic salaries, fake companies — with explainable, traceable evidence behind every risk flag.
          </motion.p>
        </div>

        {/* Interactive Holographic Radar Shield & Live Scanner Hero Showcase */}
        <div className="grid gap-8 lg:grid-cols-12 items-center">
          {/* Left: 3D Holographic Radar Shield Component */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 panel relative overflow-hidden p-8 flex flex-col items-center justify-center min-h-[420px] bg-canvas/80 border-accent/30 shadow-[0_0_50px_rgb(var(--accent)/0.12)] text-center group"
          >
            {/* Animated Rotating Radar Sweep Ring */}
            <div className="relative flex items-center justify-center h-56 w-56 sm:h-64 sm:w-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-accent/40"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border border-accent/20"
              />
              <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-10 rounded-full bg-accent/10 blur-md"
              />

              {/* Central Glowing Shield Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotateY: 15 }}
                className="relative z-10 flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-accent bg-surface shadow-[0_0_60px_rgb(var(--accent)/0.5)] cursor-pointer"
              >
                <Shield size={56} className="text-accent" />
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-3xl border border-accent/60"
                />
              </motion.div>

              {/* Orbiting Security Nodes */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-surface border border-accent flex items-center justify-center shadow-[0_0_15px_rgb(var(--accent))]">
                  <Lock size={14} className="text-accent" />
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-8 w-8 rounded-full bg-surface border border-low flex items-center justify-center shadow-[0_0_15px_rgb(var(--low))]">
                  <CheckCircle2 size={14} className="text-low" />
                </div>
              </motion.div>
            </div>

            <div className="mt-6 space-y-2">
              <span className="risk-badge risk-low inline-flex items-center gap-1.5">
                <Radar size={13} className="animate-spin" /> Engine Active & Scanning
              </span>
              <h3 className="font-display text-2xl font-semibold">AI Shield Core</h3>
              <p className="text-xs text-muted max-w-xs">
                Deterministic rules combined with contextual extraction catch scams reproducibly.
              </p>
            </div>
          </motion.div>

          {/* Right: Interactive Pipeline Step Display */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="eyebrow">How the engine works</span>
              <span className="text-xs font-mono text-accent">Stage 0{activeStep + 1} / 04</span>
            </div>

            <div className="grid gap-3">
              {pipelineSteps.map((s, idx) => {
                const Icon = s.icon;
                const isActive = activeStep === idx;
                return (
                  <motion.div
                    key={s.num}
                    onClick={() => setActiveStep(idx)}
                    whileHover={{ x: 4 }}
                    className={`panel p-4 cursor-pointer transition-all ${
                      isActive
                        ? "border-accent bg-accent/10 shadow-[0_0_25px_rgb(var(--accent)/0.15)]"
                        : "border-line/70 bg-raised/40 hover:border-line hover:bg-raised/70"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold ${
                          isActive
                            ? "bg-accent text-[#06191d]"
                            : "bg-surface border border-line text-muted"
                        }`}
                      >
                        {s.num}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-base flex items-center gap-2">
                            {s.title}
                            {isActive && <Sparkles size={14} className="text-accent animate-pulse" />}
                          </h4>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-accent border border-accent/30 rounded-full px-2 py-0.5">
                            {s.tag}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 Signals We Detect Grid (Matching Lovable.app Layout) */}
        <div className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Signals we detect</p>
              <h3 className="font-display text-2xl sm:text-3xl font-bold mt-1">
                Every flag is tied to concrete evidence
              </h3>
            </div>
            <p className="text-xs text-muted max-w-md">
              Extracted directly from the submitted listing text, screenshot, or document file.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {signalCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onHoverStart={() => setHoveredCard(idx)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="panel p-5 flex flex-col justify-between h-full bg-raised/30 border-line hover:border-accent hover:shadow-[0_15px_40px_rgb(var(--accent)/0.12)] transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <Icon size={22} />
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${card.color}`}>
                        {card.badge}
                      </span>
                    </div>

                    <h4 className="font-display text-xl font-semibold">{card.title}</h4>
                    <p className="text-xs text-muted leading-relaxed">{card.explanation}</p>
                  </div>

                  <div className="mt-5 border-t border-line/60 pt-3">
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-accent">
                      Triggered Evidence Quote
                    </span>
                    <blockquote className="mt-1 border-l-2 border-caution pl-2.5 text-xs text-ink italic leading-snug">
                      {card.quote}
                    </blockquote>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
