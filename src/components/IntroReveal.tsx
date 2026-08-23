"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Award,
  BriefcaseBusiness,
  FileSearch,
  Handshake,
  Laptop,
  MessageSquareText,
  ScanSearch,
} from "lucide-react";
import { Logo } from "./Logo";

const orbitIcons = [
  BriefcaseBusiness,
  FileSearch,
  Laptop,
  Handshake,
  Award,
  MessageSquareText,
  ScanSearch,
];

export function IntroReveal() {
  const reducedMotion = useReducedMotion();
  // The opaque cover is present in the server HTML, preventing the page from
  // painting before the client animation starts.
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"orbit" | "resolve">("orbit");
  const [canSkip, setCanSkip] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    document.documentElement.classList.add("intro-seen");
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    dialog.current?.focus();
    const skipTimer = window.setTimeout(
      () => setCanSkip(true),
      reducedMotion ? 200 : 1000,
    );
    const resolveTimer = window.setTimeout(
      () => setPhase("resolve"),
      reducedMotion ? 100 : 1450,
    );
    const closeTimer = window.setTimeout(close, reducedMotion ? 850 : 2800);
    return () => {
      window.clearTimeout(skipTimer);
      window.clearTimeout(resolveTimer);
      window.clearTimeout(closeTimer);
    };
  }, [close, reducedMotion, visible]);

  if (!visible) return null;

  return (
    <motion.div
      className="intro-cover fixed inset-0 z-[120] grid place-items-center overflow-hidden bg-[#06171c] text-[#eef7f4]"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.12 : 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label="InternGuard introduction"
      tabIndex={-1}
      ref={dialog}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          close();
          return;
        }
        if (event.key !== "Tab") return;
        event.preventDefault();
        if (canSkip) skipButton.current?.focus();
        else dialog.current?.focus();
      }}
    >
      <div
        className="scan-grid absolute inset-0 opacity-20"
        aria-hidden="true"
      />
      <motion.div
        className="absolute h-[28rem] w-[28rem] rounded-full border border-[#49e1d2]/15"
        animate={reducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />
      {!reducedMotion &&
        orbitIcons.map((Icon, index) => {
          const angle = (index / orbitIcons.length) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * 172;
          const y = Math.sin(angle) * 172;
          return (
            <motion.span
              key={Icon.displayName ?? index}
              className="absolute grid h-12 w-12 place-items-center rounded-xl border border-[#446269] bg-[#0b2228] text-[#9bb5b5] shadow-lg"
              initial={{ x, y, opacity: 0, scale: 0.7 }}
              animate={
                phase === "orbit"
                  ? { x, y, opacity: 1, scale: 1, rotate: [0, 5, 0] }
                  : { x: 0, y: 0, opacity: 0, scale: 0.15, rotate: 90 }
              }
              transition={
                phase === "orbit"
                  ? { delay: index * 0.06, duration: 0.45 }
                  : {
                      delay: index * 0.025,
                      duration: 0.48,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
              aria-hidden="true"
            >
              <Icon size={20} />
            </motion.span>
          );
        })}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, scale: 0.82 }}
        animate={
          phase === "resolve" || reducedMotion
            ? { opacity: 1, scale: 1 }
            : { opacity: 0.22, scale: 0.84 }
        }
        transition={{
          duration: reducedMotion ? 0.25 : 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="inline-flex scale-125">
          <Logo compact />
        </div>
        <motion.p
          className="mt-7 font-display text-xl font-medium tracking-[-.02em]"
          initial={{ opacity: 0, y: 8 }}
          animate={
            phase === "resolve" || reducedMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 8 }
          }
          transition={{ delay: reducedMotion ? 0.12 : 0.28, duration: 0.35 }}
        >
          Verify before you trust.
        </motion.p>
        <motion.p
          className="mt-2 font-mono text-[9px] uppercase tracking-[.24em] text-[#92aeae]"
          animate={
            phase === "resolve" || reducedMotion
              ? { opacity: 1 }
              : { opacity: 0 }
          }
        >
          Evidence resolves uncertainty
        </motion.p>
      </motion.div>
      {canSkip && (
        <motion.button
          ref={skipButton}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={close}
          className="absolute bottom-8 right-8 min-h-11 rounded-full border border-[#446269] px-5 text-xs font-semibold text-[#c5d8d5] hover:border-[#49e1d2] hover:text-white"
        >
          Skip intro
        </motion.button>
      )}
    </motion.div>
  );
}
