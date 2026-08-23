"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Cpu, ShieldCheck, Sparkles, Database, Lock, RefreshCw, Zap } from "lucide-react";

export function ChipVerificationAnimation() {
  const [step, setStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!isPlaying || reduced) return;
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 5);
    }, 3600);
    return () => clearInterval(interval);
  }, [isPlaying, reduced]);

  const stepLabels = [
    "360° Device Flip",
    "Security Chip Emerge",
    "Camera Zoom",
    "Circuit Signal Pulse",
    "Blockchain Verification",
  ];

  return (
    <div className="panel relative overflow-hidden p-6 sm:p-8 border border-line bg-surface/90 shadow-2xl">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="eyebrow flex items-center gap-2">
            <Zap size={14} className="text-accent animate-pulse" />
            3D Security Sequence
          </span>
          <h3 className="mt-1 font-display text-xl font-semibold">
            Digital Verification & Blockchain Pipeline
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setStep(0);
              setIsPlaying(true);
            }}
            className="button-secondary text-xs flex items-center gap-1.5 px-3 py-1.5 cursor-pointer"
            title="Replay 3D Sequence"
          >
            <RefreshCw size={14} className={isPlaying ? "animate-spin" : ""} />
            Replay
          </button>
        </div>
      </div>

      {/* Progress step indicators with continuous progress bar */}
      <div className="relative mt-4">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {stepLabels.map((label, index) => (
            <button
              key={label}
              onClick={() => {
                setStep(index);
                setIsPlaying(false);
              }}
              className={`group relative overflow-hidden rounded-lg p-2.5 text-left transition-all duration-500 cursor-pointer ${
                step === index
                  ? "border border-accent bg-accent/20 text-accent shadow-[0_0_24px_rgb(var(--accent)/0.25)] scale-[1.02]"
                  : index < step
                  ? "border border-line bg-raised/70 text-ink"
                  : "border border-line/40 bg-canvas/30 text-muted hover:border-line"
              }`}
            >
              <span className="block font-mono text-[9px] uppercase tracking-wider opacity-90 font-bold">
                0{index + 1}
              </span>
              <span className="mt-1 hidden sm:block truncate text-xs font-semibold">
                {label}
              </span>

              {/* Continuous active stage progress bar */}
              {step === index && (
                <motion.div
                  layoutId="activeStageProgress"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3.6, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-0.5 bg-accent shadow-[0_0_8px_rgb(var(--accent))]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Animation Arena */}
      <div className="relative mt-6 flex min-h-[340px] sm:min-h-[400px] items-center justify-center overflow-hidden rounded-2xl border border-line/80 bg-canvas/90 p-6 shadow-inner [perspective:1200px]">
        {/* Ambient Grid Background */}
        <div className="scan-grid absolute inset-0 opacity-30" />

        <AnimatePresence>
          {/* STAGE 0: Phone 360° Flip */}
          {step === 0 && (
            <motion.div
              key="stage-0"
              initial={{ opacity: 0, rotateY: -180, scale: 0.85 }}
              animate={{ opacity: 1, rotateY: 360, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, rotateY: 360, transition: { duration: 0.5, ease: "easeInOut" } }}
              transition={{ duration: 3.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute flex h-64 w-36 sm:h-72 sm:w-40 flex-col items-center justify-between rounded-[2.5rem] border-4 border-accent/40 bg-surface p-4 shadow-[0_0_50px_rgb(var(--accent)/0.2)] [transform-style:preserve-3d]"
            >
              <div className="h-3 w-16 rounded-full bg-line" />
              <div className="flex flex-col items-center text-center">
                <Cpu className="text-accent animate-pulse" size={36} />
                <span className="mt-2 font-mono text-[10px] uppercase tracking-wider text-accent font-bold">
                  Authenticity Device
                </span>
                <span className="mt-1 text-xs text-muted">Continuous 360° Verification</span>
              </div>
              <div className="h-8 w-8 rounded-full border border-line grid place-items-center">
                <div className="h-3 w-3 rounded-full bg-accent/60" />
              </div>
            </motion.div>
          )}

          {/* STAGE 1: Chip Emerging from Device */}
          {step === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.25, transition: { duration: 0.5 } }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute flex flex-col items-center justify-center"
            >
              {/* Device Silhouette in Background */}
              <div className="absolute h-64 w-36 rounded-[2.5rem] border-2 border-dashed border-line/40 opacity-40" />

              {/* Emerging Chip */}
              <motion.div
                initial={{ z: -100, scale: 0.5, y: 30, opacity: 0 }}
                animate={{ z: 60, scale: 1.2, y: 0, opacity: 1 }}
                transition={{ duration: 2.8, type: "spring", stiffness: 80, damping: 18 }}
                className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-2xl border-2 border-accent bg-surface p-4 shadow-[0_0_50px_rgb(var(--accent)/0.45)]"
              >
                <div className="absolute -top-2 left-1/2 h-2 w-12 -translate-x-1/2 bg-accent/80 rounded-t" />
                <Cpu className="text-accent" size={44} />
                <span className="mt-2 font-mono text-xs font-bold text-accent tracking-wider">
                  IG-SEC-CHIP
                </span>
                <span className="font-mono text-[9px] text-muted">EMERGING...</span>
              </motion.div>
            </motion.div>
          )}

          {/* STAGE 2: Camera Zoom in on Chip */}
          {step === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1.6 }}
              exit={{ opacity: 0, scale: 2.1, transition: { duration: 0.5 } }}
              transition={{ duration: 3.0, ease: [0.25, 1, 0.5, 1] }}
              className="absolute flex flex-col items-center justify-center"
            >
              <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-2xl border-2 border-accent bg-surface p-4 shadow-[0_0_70px_rgb(var(--accent)/0.6)]">
                <Cpu className="text-accent animate-bounce" size={48} />
                <span className="mt-2 font-mono text-xs font-bold text-accent tracking-wider">
                  MACRO ZOOM
                </span>
                <span className="font-mono text-[9px] text-high tracking-wide font-semibold">HARDWARE ANCHOR</span>
              </div>
            </motion.div>
          )}

          {/* STAGE 3: Technical Circuit Signal Pulse & Photonic Laser Ring Ignition */}
          {step === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1.35 }}
              exit={{ opacity: 0, scale: 1.5, transition: { duration: 0.5 } }}
              transition={{ duration: 3.0, ease: [0.22, 1, 0.36, 1] }}
              className="absolute flex flex-col items-center justify-center"
            >
              {/* Photonic Laser Pulse Wave Expansion */}
              <motion.div
                animate={{ scale: [0.8, 1.9, 2.6], opacity: [0.9, 0.3, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                className="absolute h-48 w-48 rounded-full border-2 border-accent/80 shadow-[0_0_40px_rgb(var(--accent))]"
              />
              <motion.div
                animate={{ scale: [0.6, 1.5, 2.2], opacity: [0.8, 0.25, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 0.6, ease: "easeOut" }}
                className="absolute h-48 w-48 rounded-full border border-dashed border-accent/60"
              />

              {/* HUD Crosshairs */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-accent/40" />
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-accent/40" />

              {/* Hexadecimal Memory Data Streams */}
              {[
                { txt: "0x7F92...C14A", pos: "-top-14 -left-20" },
                { txt: "256-BIT SYNC", pos: "-top-14 -right-20" },
                { txt: "BUS_ACTIVE: 1", pos: "-bottom-14 -left-20" },
                { txt: "NODES_ALIGNED", pos: "-bottom-14 -right-20" },
              ].map((item) => (
                <motion.div
                  key={item.txt}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: [0.4, 1, 0.4], y: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className={`absolute ${item.pos} font-mono text-[9px] uppercase tracking-wider text-accent bg-canvas/90 border border-accent/40 rounded px-2 py-0.5 shadow-lg backdrop-blur-md`}
                >
                  {item.txt}
                </motion.div>
              ))}

              <div className="relative z-10 flex h-36 w-36 flex-col items-center justify-center rounded-2xl border-2 border-accent bg-surface/90 p-4 shadow-[0_0_90px_rgb(var(--accent)/0.75)]">
                <Cpu className="text-accent animate-pulse" size={52} />
                <span className="mt-2 font-mono text-xs font-bold tracking-wider text-accent">
                  CIRCUIT IGNITION
                </span>
                <span className="font-mono text-[8px] text-muted">PHOTONIC PULSE</span>
              </div>
            </motion.div>
          )}

          {/* STAGE 4: Blockchain Concept Emergence */}
          {step === 4 && (
            <motion.div
              key="stage-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.5 } }}
              transition={{ duration: 2.4, type: "spring", stiffness: 100, damping: 22 }}
              className="absolute flex flex-col items-center justify-center w-full max-w-lg"
            >
              {/* Central Chip */}
              <div className="relative z-10 flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-accent bg-surface shadow-[0_0_35px_rgb(var(--accent)/0.5)]">
                <Cpu className="text-accent" size={28} />
                <span className="font-mono text-[8px] text-accent font-bold">CHIP SEED</span>
              </div>

              {/* Connecting Pulse Lines & Blockchain Nodes */}
              <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 w-full">
                {[
                  { icon: Database, label: "SHA-256 Block", val: "0x8F92...C1A" },
                  { icon: Lock, label: "Immutable Chain", val: "Verified" },
                  { icon: ShieldCheck, label: "Trust Consensus", val: "100% Valid" },
                ].map((node, i) => (
                  <motion.div
                    key={node.label}
                    initial={{ opacity: 0, y: 24, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.2, duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
                    className="flex flex-col items-center rounded-xl border border-accent/40 bg-surface/90 p-3 text-center shadow-lg hover:border-accent"
                  >
                    <node.icon size={20} className="text-low" />
                    <strong className="mt-2 text-xs font-semibold">{node.label}</strong>
                    <span className="mt-1 font-mono text-[9px] text-muted">{node.val}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Description banner */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>
          Current stage: <strong className="text-accent">{stepLabels[step]}</strong>
        </span>
        <span>Futuristic Verification Pipeline</span>
      </div>
    </div>
  );
}
