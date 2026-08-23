"use client";
import { motion } from "framer-motion";
import { CountUp } from "./CountUp";

export function HeroStats() {
  return (
    <dl className="mt-8 grid max-w-xl grid-cols-3 border-y border-line py-4">
      {[
        [4, "source formats"],
        [5, "signal dimensions"],
        [0, "accounts required"],
      ].map(([value, label], i) => (
        <motion.div
          key={String(label)}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
          className={i ? "border-l border-line pl-4" : ""}
        >
          <dd className="font-display text-2xl font-semibold text-accent">
            <CountUp value={Number(value)} />
          </dd>
          <dt className="mt-1 text-[10px] uppercase tracking-[.12em] text-muted">
            {label}
          </dt>
        </motion.div>
      ))}
    </dl>
  );
}

