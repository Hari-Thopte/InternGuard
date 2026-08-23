"use client";

import { motion } from "framer-motion";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <motion.span
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="inline-flex items-center gap-3 cursor-pointer"
    >
      <motion.svg
        viewBox="0 0 48 48"
        className="h-9 w-9"
        aria-hidden="true"
      >
        <path
          d="M24 3 41 9v13c0 11-6.7 18.6-17 23C13.7 40.6 7 33 7 22V9l17-6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <motion.path
          d="m15 24 6 6 13-14"
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.path
          d="M11 13h26"
          stroke="rgb(var(--accent))"
          opacity=".5"
          animate={{ opacity: [0.3, 0.8, 0.3], x: [-1, 1, -1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
      {!compact && (
        <span>
          <strong className="block font-display text-base tracking-[-.02em]">
            InternGuard
          </strong>
          <span className="block font-mono text-[8px] uppercase tracking-[.22em] text-muted">
            Evidence intelligence
          </span>
        </span>
      )}
    </motion.span>
  );
}

