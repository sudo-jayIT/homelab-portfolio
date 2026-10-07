"use client";

import { motion } from "motion/react";
import { useState, type ReactNode } from "react";

interface BlurFadeProps {
  children?: ReactNode;
  className?: string;
  /** Seconds before the reveal starts once in view. */
  delay?: number;
}

/**
 * Shared scroll reveal (spec 02 section 4.4). Despite the name there is no
 * blur: opacity 0 -> 1 and y 14px -> 0 over 0.5s easeOut, once, when 15% of the
 * element is visible. SSR ships style="opacity:0;transform:translateY(14px)",
 * so content stays hidden until hydrated and in view (original behavior).
 * Reduced motion is read once on mount: the reveal snaps with duration 0.
 */
export function BlurFade({ children, className, delay = 0 }: BlurFadeProps) {
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={reduced ? { duration: 0 } : { duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
