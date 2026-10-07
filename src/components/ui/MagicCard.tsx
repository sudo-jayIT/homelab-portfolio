"use client";

import { useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface MagicCardProps {
  children?: ReactNode;
  className?: string;
}

/** Glass surface (docs/theme/b.md 3.4): 80% opaque card over an 8px backdrop blur. */
const SURFACE = "var(--card-glass)";

/**
 * Spotlight card (spec 02 section 3.6, spec 06 section 4.2). On hover the
 * border turns --sec at 40% and a 350px radial spotlight of --sec at 8%
 * follows the mouse (mint is brighter than the old accents, so 8% reads like
 * the old 10%). The surface is glass with a hairline border and a faint top
 * highlight. Mouse events only (a tap fires emulated mouse events, so
 * touch gets the original's sticky hover). The pointer position is written to
 * CSS variables instead of React state, which renders the identical gradient
 * without a re-render per mousemove.
 */
export function MagicCard({ children, className }: MagicCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const move = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const style: CSSProperties = {
    background: hovered
      ? `radial-gradient(350px circle at var(--mx, 0px) var(--my, 0px), color-mix(in srgb, var(--sec, #3dfc9a) 8%, transparent), transparent 70%), ${SURFACE}`
      : SURFACE,
  };

  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseEnter={(e) => {
        move(e);
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-xl border border-line-strong p-6 shadow-[inset_0_1px_0_rgba(214,255,233,0.035)] backdrop-blur-[8px] transition-colors duration-300",
        hovered && "border-sec/40",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
