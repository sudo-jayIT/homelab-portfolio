/** Standing desk and ultrawide display; deterministic SVG shared by the live room and still. */
import { ROOM_CONTENT } from "@/content";
import { faceLeft, faceTop, r2 } from "@/lib/iso";
import { mulberry32 } from "@/lib/rng";
import { Led } from "@/components/ui/Led";
import { Box6, FloorShadow, IsoBox } from "../primitives";
import { CRT, CRT_FACE, CUBE, DESK, KEYBOARD, PHOSPHOR, PHOSPHOR_DIM, SEEDS, TONES } from "../config";
import { DeskDrawer, DeskSetup } from "./Setup";
import { Pc } from "./Pc";
import { Plant } from "./Plant";

const SCREEN = { u: 2, v: 2, w: 68, h: 49 };
const crtFace = `${faceLeft(CRT_FACE.x, CRT_FACE.y, CRT_FACE.z)} scale(${CRT_FACE.w / 72} ${CRT_FACE.h / 62})`;
const rand = mulberry32(SEEDS.desk);
const BARS = Array.from({ length: 12 }, () => r2(5 + rand() * 18));

function DeskBody() {
  const { x, y, w, d, legH, top } = DESK;
  return (
    <g>
      <FloorShadow x={x} y={y} w={w} d={d} spread={18} />
      {/* Two telescoping lifting columns on wide T-feet. */}
      {[x + 50, x + w - 65].map((lx) => (
        <g key={lx}>
          <IsoBox x={lx - 4} y={y + 5} z={0} w={14} d={d - 9} h={4} tone={TONES.metal} rim={false} />
          <IsoBox x={lx} y={y + 36} z={4} w={8} d={11} h={30} tone={TONES.chassis} rim={false} />
          <IsoBox x={lx + 1} y={y + 37} z={34} w={6} d={9} h={legH - 34} tone={TONES.metal} rim={false} />
        </g>
      ))}
      <Pc />
      <DeskDrawer />
      <IsoBox x={x} y={y} z={legH} w={w} d={d} h={top} tone={TONES.wood} />
      <IsoBox x={x + w - 67} y={y + d - 1} z={legH - 4} w={22} d={4} h={4} tone={TONES.plastic} rim={false} />
      <g transform={faceLeft(x + w - 67, y + d + 3, legH)}><text x={2} y={2.8} fontSize={2.1} fill="#bed9e3" className="lab-mono">65.0  1 2 3 ↑↓</text></g>
    </g>
  );
}

function Monitor() {
  return (
    <g>
      <Box6 b={CRT.riser} tone={TONES.chassis} rim={false} />
      <Box6 b={CRT.rear} tone={TONES.chassis} rim={false} />
      <Box6 b={CRT.bezel} tone={TONES.chassis} rim={false} />
      <g transform={crtFace}>
        <rect x={SCREEN.u} y={SCREEN.v} width={SCREEN.w} height={SCREEN.h} rx={2} fill="#0b1018" />
        <text x={9} y={55} fontSize={2.6} fill="#87949e" letterSpacing={0.3} className="lab-mono">{ROOM_CONTENT.crt.modelBadge}</text>
        <rect x={57} y={52} width={6} height={3.6} rx={0.6} fill="#363f48" />
      </g>
    </g>
  );
}

function Keyboard() {
  const { x, y, z, w, d, h } = KEYBOARD;
  return (
    <g>
      <IsoBox {...KEYBOARD} tone={TONES.chassis} rim={false} />
      <g transform={faceTop(x, y, z + h)}>
        {Array.from({ length: 4 }, (_, row) => Array.from({ length: 15 }, (_, col) => <rect key={`${row}-${col}`} x={r2(2.4 + 3.6 * col)} y={r2(2.2 + 3.8 * row)} width={2.9} height={2.9} rx={0.4} fill={row === 3 && col >= 4 && col <= 10 ? "#49505a" : "#313844"} />))}
        <rect x={1} y={d - 1} width={w - 2} height={0.3} fill="#5475b7" />
      </g>
    </g>
  );
}

export function DeskBase() {
  return <g><DeskBody /><Plant /><DeskSetup /><Monitor /><Keyboard /><IsoBox {...CUBE} tone={TONES.metal} rim={false} /></g>;
}

export const STILL_BAR_SCALE = [0.48, 0.88, 0.41, 0.69, 0.66, 0.91, 0.34, 0.65, 0.6, 0.84, 0.32, 0.65] as const;

export function DeskLights({ counter = "0", barScale }: { counter?: string; barScale?: readonly number[] }) {
  const { crt } = ROOM_CONTENT;
  const s = SCREEN;
  return (
    <g>
      <g data-screen="" transform={crtFace}>
        <rect x={s.u} y={s.v} width={s.w} height={s.h} rx={2.6} fill="#101b2b" />
        <rect x={s.u} y={s.v} width={s.w} height={s.h} rx={2.6} fill="url(#lab-crt-glow)" />
        <g className="lab-mono" fontSize={2.5} fill={PHOSPHOR}>
          <text x={12} y={11}>{`${crt.promptPrefix} ${crt.listCommand}`}</text>
          {crt.listing.map((line, i) => <text key={i} x={12} y={r2(15.2 + 3.4 * i)} fill={PHOSPHOR_DIM}>{line}</text>)}
          <text x={12} y={30.4}>{`${crt.promptPrefix} ${crt.counterCommand}`}</text>
          <text x={12} y={38} fontSize={6} data-blocked-count="">{counter}</text>
          <text x={12} y={43}>{crt.promptPrefix}<tspan className="lab-caret">█</tspan></text>
          <text x={39} y={11} fontSize={2.2} fill={PHOSPHOR_DIM}>{crt.barsLabel}</text>
        </g>
        <line x1={39} y1={40} x2={60} y2={40} stroke={PHOSPHOR_DIM} strokeWidth={0.3} />
        {BARS.map((full, i) => { const h = barScale ? r2(full * (barScale[i] ?? 1)) : full; return <rect key={i} data-bar="" x={r2(39.4 + 1.75 * i)} y={r2(40 - h)} width={1.1} height={h} fill={PHOSPHOR} opacity={0.7} />; })}
        <rect x={s.u} y={s.v} width={s.w} height={s.h} rx={2.6} fill="url(#lab-scan)" />
      </g>
      <g transform={crtFace}><Led cx={60} cy={53.8} color="green" r={0.7} glow={4} /></g>
    </g>
  );
}
