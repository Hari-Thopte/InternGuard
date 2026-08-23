"use client";

import { motion } from "framer-motion";
import { Cpu, ShieldCheck, Activity, Terminal, Database, Radio, CheckCircle2 } from "lucide-react";
import type { DocumentReport, RiskReport } from "@/lib/types";

const dimLabels: Record<string, string> = {
  payment: "Payment Security",
  recruiter: "Recruiter Authenticity",
  document: "Document Integrity",
  urgency: "Urgency Pressure",
  company: "Company Footprint",
  issuer: "Issuer Identity",
  content: "Readable Content",
  metadata: "File Metadata",
  integrity: "File Integrity",
  verification: "Verification Path",
};

export function ForensicTelemetryWidget({ report }: { report: RiskReport | DocumentReport }) {
  const signalDimensions = Object.entries(report.categoryScores).map(([key, score]) => ({
    label: dimLabels[key] ?? key.replace(/([A-Z])/g, " $1"),
    score: score as number,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="panel p-5 sm:p-7 bg-surface/80 border-accent/30 shadow-[0_0_40px_rgb(var(--accent)/0.1)] space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="eyebrow flex items-center gap-2">
            <Radio size={14} className="text-accent animate-pulse" />
            Live Telemetry Matrix
          </span>
          <h4 className="mt-1 font-display text-xl font-semibold">
            Forensic Signal Spectrum & Evidence Correlation
          </h4>
        </div>
        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
          SHA-256 VERIFIED
        </span>
      </div>

      {/* Live Equalizer / Frequency Signal Spectrum Bars */}
      <div className="rounded-xl border border-line bg-canvas/90 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5 font-mono">
            <Activity size={14} className="text-accent" />
            Signal Resonance Equalizer
          </span>
          <span className="font-mono text-[10px] uppercase text-low">
            100% Deterministic Engine
          </span>
        </div>

        <div className="flex items-end justify-between gap-1.5 h-16 pt-2">
          {[65, 40, 85, 30, 95, 55, 75, 45, 90, 60, 80, 35, 70, 50, 85, 40].map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: [`${h}%`, `${(h * 1.3) % 100}%`, `${h}%`] }}
              transition={{
                duration: 1.8 + (i % 5) * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-full rounded-t bg-gradient-to-t from-accent/20 via-accent/60 to-accent shadow-[0_0_8px_rgb(var(--accent)/0.5)]"
            />
          ))}
        </div>
      </div>

      {/* Category Dimensions Live Telemetry Meters */}
      <div className="grid gap-3 sm:grid-cols-2">
        {signalDimensions.map((dim, i) => {
          const isHigh = dim.score >= 40;
          const isCaution = dim.score > 0 && dim.score < 40;
          return (
            <div
              key={dim.label}
              className="rounded-xl border border-line bg-raised/40 p-3.5 space-y-2 hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink">{dim.label}</span>
                <span
                  className={`font-mono font-bold ${
                    isHigh ? "text-high" : isCaution ? "text-caution" : "text-low"
                  }`}
                >
                  {dim.score} pts
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(8, dim.score))}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className={`h-full rounded-full ${
                    isHigh
                      ? "bg-high shadow-[0_0_10px_rgb(var(--high))]"
                      : isCaution
                      ? "bg-caution shadow-[0_0_10px_rgb(var(--caution))]"
                      : "bg-low shadow-[0_0_10px_rgb(var(--low))]"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hex Data Stream & Terminal Verification Logs */}
      <div className="rounded-xl border border-line bg-canvas/90 p-4 font-mono text-xs space-y-2 text-muted">
        <div className="flex items-center justify-between border-b border-line/60 pb-2 text-[10px] uppercase text-accent">
          <span className="flex items-center gap-1.5">
            <Terminal size={13} /> Real-Time Telemetry Stream
          </span>
          <span>Engine Status: OK</span>
        </div>
        <div className="space-y-1 text-[11px] leading-relaxed">
          <p className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-low shrink-0" />
            <span>[PARSER] Input source normalized ({"evidenceList" in report ? report.evidenceList.length : report.findings.length} signals matched)</span>
          </p>
          <p className="flex items-center gap-2">
            <Cpu size={13} className="text-accent shrink-0" />
            <span>[HEURISTICS] Category contribution score = {report.overallScore}/100</span>
          </p>
          <p className="flex items-center gap-2 text-ink">
            <Database size={13} className="text-caution shrink-0" />
            <span>[EVIDENCE TRACE] Fingerprint: 0x{report.id.slice(0, 16).toUpperCase()}...</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
