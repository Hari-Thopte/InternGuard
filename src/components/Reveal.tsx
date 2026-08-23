"use client";
import { motion, useReducedMotion } from "framer-motion";

export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  scale = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  scale?: boolean;
}) {
  const reduced = useReducedMotion();

  const getInitial = () => {
    if (reduced) return false;
    const initialObj: { opacity: number; y?: number; x?: number; scale?: number } = {
      opacity: 0,
    };
    if (direction === "up") initialObj.y = 24;
    if (direction === "down") initialObj.y = -24;
    if (direction === "left") initialObj.x = 24;
    if (direction === "right") initialObj.x = -24;
    if (scale) initialObj.scale = 0.94;
    return initialObj;
  };

  return (
    <motion.div
      className={className}
      initial={getInitial()}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.55,
        delay: reduced ? 0 : delay,
        ease: [0.215, 0.61, 0.355, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

