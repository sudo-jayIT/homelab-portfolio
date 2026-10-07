import type { CSSProperties } from "react";
import { BLINK_RANGE, LED, type BlinkKind, type LedColor } from "@/components/lab/contracts";

interface LedProps {
  cx: number;
  cy: number;
  color: LedColor;
  /** Core radius in user units. */
  r?: number;
  /** Halo radius as a multiple of r; 0 draws the core only. */
  glow?: number;
  /**
   * "gradient": halo filled with url(#lab-glow-{color}) (room scene; the art
   * defines the gradients). "flat": halo is the LED colour at 20% opacity
   * (homelab front diagram, which has no <defs>).
   */
  halo?: "gradient" | "flat";
  /** Blink class lab-led-{blink}; omit for a steady LED. */
  blink?: BlinkKind;
  /** Seeded pair [a, b] in [0,1): duration = min + a*(max-min), delay = -b*duration. */
  r2?: readonly [number, number];
  className?: string;
}

/** Inline animation timing for a seeded LED (strings fixed to 2 decimals so SSR and CSR match). */
export function ledTiming(kind: BlinkKind, pair: readonly [number, number]): CSSProperties {
  const [min, max] = BLINK_RANGE[kind];
  const duration = min + pair[0] * (max - min);
  return {
    animationDuration: `${duration.toFixed(2)}s`,
    animationDelay: `${(-pair[1] * duration).toFixed(2)}s`,
  };
}

/**
 * SVG LED: an optional halo under a solid core, wrapped in a <g> that carries
 * the blink class and seeded timing so both blink together (specs 04 4.2, 07 4.2).
 * Server component; deterministic output.
 */
export function Led({ cx, cy, color, r = 0.8, glow = 3.4, halo = "gradient", blink, r2, className }: LedProps) {
  const style = blink && r2 ? ledTiming(blink, r2) : undefined;
  const cls = [blink ? `lab-led-${blink}` : null, className].filter(Boolean).join(" ") || undefined;
  return (
    <g className={cls} style={style}>
      {glow > 0 ? (
        halo === "gradient" ? (
          <circle cx={cx} cy={cy} r={r * glow} fill={`url(#lab-glow-${color})`} />
        ) : (
          <circle cx={cx} cy={cy} r={r * glow} fill={LED[color]} opacity={0.2} />
        )
      ) : null}
      <circle cx={cx} cy={cy} r={r} fill={LED[color]} />
    </g>
  );
}
