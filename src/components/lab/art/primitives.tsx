/**
 * Drawing primitives for the room art (spec 04 section 2.2). Server-compatible:
 * plain functions of their props, no hooks, deterministic output.
 */

import { ART_IDS } from "@/components/lab/contracts";
import { faceTop, pts, r2 } from "@/lib/iso";
import { RIM, type Tone } from "./config";

interface BoxProps {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  tone: Tone;
  /** Faint mint edge highlight (default on). */
  rim?: boolean;
  fillOpacity?: number;
}

/**
 * Projected box: the +y face ("left"), the +x face ("right"), then the top,
 * in that paint order.
 */
export function IsoBox({ x, y, z, w, d, h, tone, rim = true, fillOpacity }: BoxProps) {
  const side = rim ? { stroke: RIM.side, strokeWidth: RIM.width, strokeLinejoin: "round" as const } : null;
  const top = rim ? { stroke: RIM.top, strokeWidth: RIM.width, strokeLinejoin: "round" as const } : null;
  return (
    <g fillOpacity={fillOpacity}>
      <polygon
        points={pts([
          [x, y + d, z + h],
          [x + w, y + d, z + h],
          [x + w, y + d, z],
          [x, y + d, z],
        ])}
        fill={tone.left}
        {...side}
      />
      <polygon
        points={pts([
          [x + w, y, z + h],
          [x + w, y + d, z + h],
          [x + w, y + d, z],
          [x + w, y, z],
        ])}
        fill={tone.right}
        {...side}
      />
      <polygon
        points={pts([
          [x, y, z + h],
          [x + w, y, z + h],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ])}
        fill={tone.top}
        {...top}
      />
    </g>
  );
}

/** Tuple form used by the config tables: [x, y, z, w, d, h]. */
export function Box6({ b, tone, rim }: { b: readonly number[]; tone: Tone; rim?: boolean }) {
  const [x, y, z, w, d, h] = b;
  return <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone={tone} rim={rim} />;
}

/** Soft contact shadow under furniture: a rounded floor rect filled with #lab-shadow. */
export function FloorShadow({ x, y, w, d, spread = 16 }: { x: number; y: number; w: number; d: number; spread?: number }) {
  const s = spread;
  return (
    <g transform={faceTop(x - s, y - s, 0)}>
      <rect width={w + 2 * s} height={d + 2 * s} rx={s} fill={`url(#${ART_IDS.shadow})`} />
    </g>
  );
}

/** Screen ellipse radii of a horizontal world circle of radius r. */
export function flatRadii(r: number): { rx: number; ry: number } {
  return { rx: r2(1.2247 * r * 1.32), ry: r2(0.7071 * r * 1.32) };
}
