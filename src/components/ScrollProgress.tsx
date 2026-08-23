"use client";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

export function ScrollProgress() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 40,
    restDelta: 0.001,
  });

  if (reduced) return null;

  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-accent shadow-[0_0_12px_rgb(var(--accent))]"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}

