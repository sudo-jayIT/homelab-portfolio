/**
 * Floor lamp in the back corner (spec 04 section 9.1 step 13): square base
 * plate, thin pole and a truncated-cone shade drawn in screen space. The lit
 * layer adds the warm glow and the glowing shade mouth (masked by the pole).
 */

import { iso, r2 } from "@/lib/iso";
import { FloorShadow, IsoBox, flatRadii } from "../primitives";
import { LAMP, TONES } from "../config";

const { shade } = LAMP;
const [bx, by] = iso(shade.x, shade.y, shade.z0);
const [tx, ty] = iso(shade.x, shade.y, shade.z1);
const bottom = flatRadii(shade.r0);
const top = flatRadii(shade.r1);

export function LampShadow() {
  return <FloorShadow x={LAMP.x} y={LAMP.y} w={14} d={14} spread={10} />;
}

export function Lamp() {
  const { pole } = LAMP;
  const B = { x: r2(bx), y: r2(by) };
  const T = { x: r2(tx), y: r2(ty) };
  const side = [
    `M${r2(B.x - bottom.rx)} ${B.y}`,
    `A${bottom.rx} ${bottom.ry} 0 0 0 ${r2(B.x + bottom.rx)} ${B.y}`,
    `L${r2(T.x + top.rx)} ${T.y}`,
    `A${top.rx} ${top.ry} 0 0 1 ${r2(T.x - top.rx)} ${T.y}`,
    "Z",
  ].join("");
  return (
    <g>
      <IsoBox x={LAMP.x} y={LAMP.y} z={0} w={14} d={14} h={LAMP.base} tone={TONES.metal} rim={false} />
      <IsoBox
        x={pole.x}
        y={pole.y}
        z={LAMP.base}
        w={pole.w}
        d={pole.w}
        h={pole.top - LAMP.base}
        tone={TONES.metal}
        rim={false}
      />
      {/* opaque bottom disk: caps the shade mouth so the pole can't be seen
          through the opening (the lit layer paints the warm glow over it). */}
      <ellipse cx={B.x} cy={B.y} rx={bottom.rx} ry={bottom.ry} fill="#5c4530" />
      <path d={side} fill="#3b3127" />
      <ellipse cx={T.x} cy={T.y} rx={top.rx} ry={top.ry} fill="#4a3e31" />
    </g>
  );
}

/** Lit layer: warm glow at the shade mouth plus the lit opening. */
export function LampLights() {
  const mouth = flatRadii(11);
  return (
    <g>
      <g data-toggle-light="floor-lamp">
        <ellipse cx={r2(bx)} cy={r2(by)} rx={46} ry={30} fill="url(#lab-glow-warm)" opacity={0.6} />
        <ellipse cx={r2(bx)} cy={r2(by)} rx={mouth.rx} ry={mouth.ry} fill="#fde2b8" opacity={0.6} />
      </g>
    </g>
  );
}
