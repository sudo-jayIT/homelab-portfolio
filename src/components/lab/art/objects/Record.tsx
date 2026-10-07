/**
 * Record cabinet and turntable at the right end of wall A (spec 04 section
 * 9.1 steps 20, 21 and 30). The base shows the cabinet, the sleeves on the
 * open shelf and the empty deck; the lit layer adds the spinning vinyl
 * ([data-vinyl], rotation on an inner .lab-spin group), the tonearm, the amber
 * LED and the three music notes that animate under html[data-lab-music].
 */

import { LED } from "@/components/lab/contracts";
import { ROOM_CONTENT } from "@/content";
import { faceLeft, faceTop, iso, r2 } from "@/lib/iso";
import { FloorShadow, IsoBox } from "../primitives";
import { DECK_Z, PLATTER, PLINTH, PUTTY, RECORD_CAB, TONES } from "../config";

/** Sleeve spine colours on the open shelf (14, spec 04 section 9.1 step 20). */
const SPINES = [
  "#7a2f22",
  "#2d4b6e",
  "#c9a14a",
  "#3c5d3a",
  "#8b5a2b",
  "#1f1f22",
  "#6b3a6b",
  "#a8432c",
  "#d6cfbf",
  "#2c6f73",
  "#4a4a52",
  "#b8862f",
  "#5a2a2a",
  "#7c8a99",
];
/** Spine heights cycle 23, 26, 25, 24 (bottom-aligned on the shelf). */
const spineH = (t: number) => 23 + ((3 * t) % 4);

export function RecordBase() {
  const c = RECORD_CAB;
  // Feet inset 3 from each corner.
  const feet: [number, number][] = [
    [c.x + 3, c.y + 3],
    [c.x + c.w - 6, c.y + 3],
    [c.x + 3, c.y + c.d - 6],
    [c.x + c.w - 6, c.y + c.d - 6],
  ];
  const p = PLINTH;
  return (
    <g>
      <FloorShadow x={c.x} y={c.y} w={c.w} d={c.d} spread={12} />
      {feet.map(([fx, fy], i) => (
        <IsoBox key={i} x={fx} y={fy} z={0} w={3} d={3} h={c.feet} tone={TONES.recordWood} rim={false} />
      ))}
      <IsoBox x={c.x} y={c.y} z={c.z} w={c.w} d={c.d} h={c.h} tone={TONES.recordWood} rim={false} />
      <g transform={faceLeft(c.x, c.y + c.d, c.z + c.h)}>
        <rect x={3} y={4} width={25} height={26} fill="#120d09" />
        {SPINES.map((fill, t) => (
          <rect key={t} x={r2(4 + 1.7 * t)} y={30 - spineH(t)} width={1.4} height={spineH(t)} fill={fill} />
        ))}
        <rect x={31} y={4} width={22} height={26} fill="#30231a" stroke="rgba(0,0,0,0.35)" strokeWidth={0.4} />
        <rect x={33} y={14} width={0.9} height={6} rx={0.45} fill="#c9a14a" />
      </g>
      <IsoBox x={p.x} y={p.y} z={p.z} w={p.w} d={p.d} h={p.h} tone={TONES.plinth} rim={false} />
      <g transform={faceTop(p.x, p.y, DECK_Z)}>
        <rect x={0.8} y={0.8} width={44.4} height={31.4} fill="#1d1e21" stroke="rgba(255,255,255,0.06)" strokeWidth={0.3} />
        <circle cx={PLATTER.u} cy={PLATTER.v} r={PLATTER.r} fill="#8b9096" />
        <circle cx={4} cy={29} r={1.4} fill="#2b2d31" stroke="#6b7076" strokeWidth={0.3} />
        <rect x={7.5} y={28} width={4} height={1.6} rx={0.4} fill="#2b2d31" />
        <text x={42} y={30.6} fontSize={1.6} fill="rgba(255,255,255,0.35)" textAnchor="end" className="lab-mono">
          33 · 45
        </text>
      </g>
    </g>
  );
}

/** Arc path on a circle (degrees, SVG angle direction). */
function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p = (a: number) => [r2(cx + r * Math.cos((a * Math.PI) / 180)), r2(cy + r * Math.sin((a * Math.PI) / 180))];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`;
}

function Vinyl() {
  const { u: cx, v: cy } = PLATTER;
  const { artist, title } = ROOM_CONTENT.record;
  const grooves = Array.from({ length: 6 }, (_, i) => r2(12.6 - 1.2 * i));
  return (
    <g data-vinyl="">
      <g className="lab-spin">
        <circle cx={cx} cy={cy} r={13.5} fill="#0b0b0c" />
        {grooves.map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#1d1d20" strokeWidth={0.35} />
        ))}
        <path d={arc(cx, cy, 11.8, 20, 70)} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={0.5} />
        <path d={arc(cx, cy, 8.6, 200, 245)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.45} />
        <circle cx={cx} cy={cy} r={4.6} fill="#c2c6cb" />
        <path d={`M${cx - 4.6} ${cy}A4.6 4.6 0 0 0 ${cx + 4.6} ${cy}Z`} fill="#8f959c" />
        <text x={cx} y={r2(cy - 1.4)} fontSize={1.25} fontWeight={700} fill="#15171a" textAnchor="middle">
          {artist}
        </text>
        <text x={cx} y={r2(cy + 2.6)} fontSize={0.95} fill="#101214" textAnchor="middle">
          {title}
        </text>
        <circle cx={cx} cy={cy} r={0.5} fill="#cfd3d8" />
      </g>
      <circle cx={cx} cy={cy} r={13.5} fill="url(#lab-vinyl-sheen)" />
    </g>
  );
}

function Tonearm() {
  const pivot = { x: 39, y: 6 };
  const head = { x: 25, y: 22 };
  const angle = (Math.atan2(head.y - pivot.y, head.x - pivot.x) * 180) / Math.PI;
  return (
    <g transform={faceTop(PLINTH.x, PLINTH.y, DECK_Z + 2.6)}>
      <circle cx={pivot.x} cy={pivot.y} r={2.6} fill="#9aa0a6" />
      <circle cx={pivot.x} cy={pivot.y} r={1.2} fill="#5b6167" />
      <circle cx={42.5} cy={2} r={1.7} fill="#4b5056" stroke="#9aa0a6" strokeWidth={0.3} />
      <path d={`M${pivot.x} ${pivot.y} L${head.x} ${head.y}`} stroke="#c9ced3" strokeWidth={0.8} strokeLinecap="round" />
      <rect
        x={head.x - 1.6}
        y={head.y - 0.9}
        width={3.2}
        height={1.8}
        rx={0.4}
        fill="#2a2d31"
        transform={`rotate(${r2(angle)} ${head.x} ${head.y})`}
      />
    </g>
  );
}

const NOTES = ["♪", "♫", "♪"];

/** Lit layer: vinyl, tonearm, amber LED, music notes. */
export function RecordLights() {
  const [nx, ny] = iso(PLINTH.x + PLATTER.u, PLINTH.y + PLATTER.v, 56);
  return (
    <g>
      <g transform={faceTop(PLINTH.x, PLINTH.y, DECK_Z + 0.6)}>
        <Vinyl />
      </g>
      <Tonearm />
      <g transform={faceLeft(PLINTH.x, PLINTH.y + PLINTH.d, DECK_Z)}>
        <circle cx={43} cy={3} r={0.55} fill={LED.amber} />
      </g>
      {NOTES.map((n, i) => (
        <text
          key={i}
          x={r2(nx - 6 + 7 * i)}
          y={r2(ny)}
          fontSize={9}
          fill={PUTTY}
          className="lab-note"
          style={{ animationDelay: `${(0.85 * i).toFixed(2)}s` }}
        >
          {n}
        </text>
      ))}
    </g>
  );
}
