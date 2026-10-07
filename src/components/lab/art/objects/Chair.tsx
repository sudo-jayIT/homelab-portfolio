/**
 * Office chair facing the desk, backrest toward the viewer (spec 04 section
 * 9.1 step 25): five-star base with casters, gas lift, seat, tall back with a
 * faint cushion sheen.
 */

import { faceLeft, faceTop, r2 } from "@/lib/iso";
import { FloorShadow, IsoBox } from "../primitives";
import { CHAIR, TONES } from "../config";

export function Chair() {
  const { x, y } = CHAIR;
  const spokes = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    return [r2(24 + 21 * Math.cos(a)), r2(24 + 21 * Math.sin(a))] as const;
  });
  return (
    <g data-chair="" style={{ transformBox: "view-box" }}>
      <FloorShadow x={x - 20} y={y - 20} w={40} d={40} spread={10} />
      <g transform={faceTop(x - 24, y - 24, 3)}>
        {spokes.map(([ex, ey], i) => (
          <g key={i}>
            <line x1={24} y1={24} x2={ex} y2={ey} stroke="#2a2f35" strokeWidth={2.6} strokeLinecap="round" />
            <circle cx={ex} cy={ey} r={2} fill="#0d0f11" />
          </g>
        ))}
      </g>
      <IsoBox x={x - 2} y={y - 2} z={4} w={4} d={4} h={38} tone={TONES.metal} rim={false} />
      <IsoBox x={x - 18} y={y - 18} z={42} w={36} d={36} h={7} tone={TONES.fabric} rim={false} />
      <IsoBox x={x - 17} y={y + 13} z={49} w={34} d={5} h={48} tone={TONES.fabric} rim={false} />
      {/* Armrests and the olive knitted throw visible in the room photo. */}
      {[x - 23, x + 19].map((ax) => <g key={ax}><IsoBox x={ax} y={y - 9} z={44} w={3} d={3} h={14} tone={TONES.metal} rim={false} /><IsoBox x={ax - 2} y={y - 13} z={58} w={7} d={30} h={3} tone={TONES.fabric} rim={false} /></g>)}
      <g transform={faceLeft(x - 17, y + 18.1, 97)}>
        <path d="M1 15Q7 10 12 17T23 15T33 18V41Q26 46 19 41T1 43Z" fill="#717058" />
        {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${3 + i * 3} 18q-2 3 0 5t0 5t0 5t0 5`} fill="none" stroke={i % 2 ? "#95907a" : "#565740"} strokeWidth={1.3} />)}
      </g>
      <g transform={faceLeft(x - 17, y + 18, 97)}>
        <rect x={3} y={4} width={28} height={40} rx={4} fill="rgba(255,255,255,0.025)" />
      </g>
    </g>
  );
}
