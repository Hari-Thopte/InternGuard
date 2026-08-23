"use client";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";
export function CountUp({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const count = useMotionValue(reduced ? value : 0);
  const rounded = useTransform(count, (v) => Math.round(v));
  useEffect(() => {
    if (reduced) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [count, reduced, value]);
  return <motion.span>{rounded}</motion.span>;
}
