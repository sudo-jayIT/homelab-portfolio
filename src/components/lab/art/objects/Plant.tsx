/**
 * Potted plant on the back-left corner of the standing desk:
 * a square wooden pot, dark soil and nine lens-shaped leaves fanned in screen
 * space from the soil centre.
 */

import { faceTop, iso, r2 } from "@/lib/iso";
import { IsoBox } from "../primitives";
import { PLANT, TONES } from "../config";

/** [rotation deg, length, half width, colour] (spec 04 section 9.1 step 11). */
const LEAVES: [number, number, number, string][] = [
  [-24, 30, 5, "#1d3a28"],
  [22, 32, 5, "#1a3424"],
  [-8, 40, 5.5, "#24452f"],
  [8, 38, 5, "#21402c"],
  [-38, 22, 4.5, "#18301f"],
  [36, 24, 4.5, "#1a3424"],
  [0, 44, 5, "#2a5036"],
  [-16, 26, 4, "#2a5036"],
  [16, 26, 4, "#24452f"],
];

/**
 * A lens-shaped leaf pointing up from (0, 0): two mirrored cubic curves
 * (widest about 1.4 x the half width at 35% of the length) and a midrib to 92%.
 */
function Leaf({ len, hw, color }: { len: number; hw: number; color: string }) {
  const w = r2(hw * 1.4);
  const y35 = r2(-len * 0.35);
  const y85 = r2(-len * 0.85);
  return (
    <>
      <path d={`M0 0C${-w} ${y35} ${-hw} ${y85} 0 ${-len}C${hw} ${y85} ${w} ${y35} 0 0Z`} fill={color} />
      <path d={`M0 0L0 ${r2(-len * 0.92)}`} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
    </>
  );
}

export function Plant() {
  const { x, y, z, w, d, h } = PLANT;
  const [ax, ay] = iso(x + w / 2, y + d / 2, z + h);
  return (
    <g>
      <g transform={faceTop(x - 2, y - 2, z + 0.05)}>
        <ellipse cx={w / 2 + 2} cy={d / 2 + 2} rx={w / 2 + 4} ry={d / 2 + 4} fill="#000" opacity={0.18} />
      </g>
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone={TONES.pot} rim={false} />
      <g transform={faceTop(x + 2, y + 2, z + h)}>
        <rect width={w - 4} height={d - 4} fill="#120d0a" />
      </g>
      <g>
        {LEAVES.map(([rot, len, hw, color], i) => (
          <g key={i} transform={`translate(${r2(ax)} ${r2(ay - 2)}) rotate(${rot})`}>
            <Leaf len={len} hw={hw} color={color} />
          </g>
        ))}
      </g>
    </g>
  );
}
