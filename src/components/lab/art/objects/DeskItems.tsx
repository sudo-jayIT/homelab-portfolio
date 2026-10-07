/**
 * Small things on the desk (spec 04 section 9.1 step 18): the resume pages,
 * the work badge with its lanyard, the phone and the PS5. The lit
 * layer adds the phone's glowing lock screen.
 */

import { faceLeft, faceRight, faceTop, r2 } from "@/lib/iso";
import { IsoBox } from "../primitives";
import { BADGE, DESK, PHONE, RESUME, TONES } from "../config";

const Z = DESK.z;

function Resume() {
  const { x, y, w, d, rot } = RESUME;
  const lines = Array.from({ length: 8 }, (_, t) => (
    <rect key={t} x={4} y={r2(11 + 3.1 * t)} width={t % 3 === 2 ? 14 : 22} height={0.8} fill="#b8b4ab" />
  ));
  return (
    <g transform={faceTop(x, y, Z + 0.2)}>
      <rect x={2} y={-1.5} width={w} height={d} fill="#d9d6cf" />
      <g transform={`rotate(${rot} ${w / 2} ${d / 2})`}>
        <rect width={w} height={d} fill="#f1efe9" />
        <rect x={4} y={4} width={16} height={2} fill="#1f2328" />
        <rect x={4} y={7.6} width={10} height={0.9} fill="#8a8f96" />
        {lines}
      </g>
    </g>
  );
}

function Badge() {
  const { x, y, w, d } = BADGE;
  return (
    <g transform={faceTop(x, y, Z + 0.3)}>
      {/* lanyard loop lying on the desk behind the card */}
      <path d="M4.5 0C-6 -10 30 -14 8.5 0" fill="none" stroke="#1d4ed8" strokeWidth={1.2} />
      <rect width={w} height={d} rx={1} fill="#f1f5f9" />
      <rect width={w} height={4} rx={1} fill="#1e3a8a" />
      <rect x={2} y={6} width={5} height={6} fill="#94a3b8" />
      <rect x={8} y={7} width={3.5} height={0.8} fill="#475569" />
      <rect x={8} y={9} width={3} height={0.8} fill="#94a3b8" />
    </g>
  );
}

function Phone() {
  const { x, y, w, d, h } = PHONE;
  return <IsoBox x={x} y={y} z={Z} w={w} d={d} h={h} tone={TONES.phone} rim={false} />;
}

/** Upright PS5 with curved white panels and a dark central vent. */
function Ps5() {
  const x = 780, y = 484, h = 32, w = 12, d = 23;
  return (
    <g data-object="ps5">
      <title>PlayStation 5</title>
      <IsoBox x={x - 2} y={y - 1} z={Z} w={w + 4} d={d + 2} h={1.2} tone={TONES.plastic} rim={false} />
      <IsoBox x={x + 2} y={y} z={Z + 1} w={w - 4} d={d} h={h - 3} tone={TONES.chassis} rim={false} />
      <g transform={faceRight(x + w, y + d, Z + h)}>
        <path d={`M0 0Q11 3 ${d} 0L${d - 1} ${h}Q11 ${h - 3} 1 ${h}Z`} fill="#c8ced8" stroke="#a3abb9" strokeWidth={0.4} />
      </g>
      <g transform={faceLeft(x, y + d, Z + h)}>
        <path d={`M0 0Q2 5 2 16L1 ${h}H4Q6 18 4 2Z`} fill="#f4f5f8" />
        <path d={`M${w} -1Q${w - 4} 10 ${w - 3} 21L${w - 1} ${h}H${w - 4}Q${w - 6} 15 ${w - 4} 1Z`} fill="#f0f2f6" />
        <path d={`M4 3Q6 15 4 ${h - 3}`} stroke="#5fa1ff" strokeWidth={0.8} fill="none" />
        <path d={`M7 23v5`} stroke="#8c929d" strokeWidth={0.7} />
        <text x={7} y={8} fill="#1c2431" fontSize={2.8} transform="rotate(90 7 8)">PS5</text>
      </g>
    </g>
  );
}

export function DeskItemsBase() {
  return (
    <g>
      <Resume />
      <Badge />
      <Phone />
      <Ps5 />
    </g>
  );
}

/** Lit layer: the phone's lock screen with one notification. */
export function DeskItemsLights() {
  const { x, y, h } = PHONE;
  return (
    <g transform={faceTop(x, y, Z + h + 0.05)}>
      <rect x={0.9} y={1.2} width={9.2} height={17.6} rx={1.2} fill="#0f172a" />
      <rect x={1.8} y={3} width={7.4} height={3.2} rx={0.8} fill="#e2e8f0" opacity={0.85} />
      <rect x={2.4} y={3.9} width={4} height={0.6} fill="#334155" />
    </g>
  );
}
