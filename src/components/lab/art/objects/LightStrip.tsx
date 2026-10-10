/**
 * Govee-style RGB floor light strip in the back corner (replaces the old
 * floor lamp, spec 04 section 9.1 step 13): a round base plate and a thin
 * pale pole drawn in screen space, the same construction the old lamp's
 * shade used (bottom ellipse + side wall + top ellipse), just un-tapered
 * into a short puck. The lit layer adds a rainbow glow cascading up the
 * pole — reuses the rack LED gradient defs (lab-glow-{color}) instead of
 * inventing new ones — behind the same "floor-lamp" toggle as before.
 */

import { iso, r2 } from "@/lib/iso";
import { ART_IDS } from "@/components/lab/contracts";
import { FloorShadow, IsoBox, flatRadii } from "../primitives";
import { LIGHT_STRIP, TONES } from "../config";

/** Pale, slightly cool housing so the strip still reads as a light fixture when unlit. */
const POLE_TONE = { top: "#e7ecf4", left: "#ccd4e0", right: "#aab3c2" } as const;

/** Bottom-to-top color sweep for the ambient glow, reusing the existing LED palette. */
const GLOW_SWEEP = ["red", "amber", "emerald", "cyan", "blue"] as const;

export function LightStripShadow() {
  return <FloorShadow x={LIGHT_STRIP.x} y={LIGHT_STRIP.y} w={LIGHT_STRIP.r * 2} d={LIGHT_STRIP.r * 2} spread={10} />;
}

export function LightStrip() {
  const { r, base, pole } = LIGHT_STRIP;
  // Centre the base disc directly under the pole's centre, so the pole plants
  // INTO the base instead of sitting beside it.
  const cx = pole.x + pole.w / 2;
  const cy = pole.y + pole.w / 2;
  const [bx, by] = iso(cx, cy, 0);
  const [tx, ty] = iso(cx, cy, base);
  const rad = flatRadii(r);
  const side = [
    `M${r2(bx - rad.rx)} ${r2(by)}`,
    `A${rad.rx} ${rad.ry} 0 0 0 ${r2(bx + rad.rx)} ${r2(by)}`,
    `L${r2(tx + rad.rx)} ${r2(ty)}`,
    `A${rad.rx} ${rad.ry} 0 0 1 ${r2(tx - rad.rx)} ${r2(ty)}`,
    "Z",
  ].join("");
  return (
    <g>
      {/* disc: dark underside, side wall, lighter top, then the pole rising from its centre */}
      <ellipse cx={r2(bx)} cy={r2(by)} rx={rad.rx} ry={rad.ry} fill={TONES.plastic.right} />
      <path d={side} fill={TONES.plastic.left} />
      <ellipse cx={r2(tx)} cy={r2(ty)} rx={rad.rx} ry={rad.ry} fill={TONES.plastic.top} />
      <IsoBox x={pole.x} y={pole.y} z={base} w={pole.w} d={pole.w} h={pole.top - base} tone={POLE_TONE} rim={false} />
    </g>
  );
}

/** Lit layer: a rainbow glow cascading up the pole, same floor-lamp toggle as the old lamp. */
export function LightStripLights() {
  const { pole } = LIGHT_STRIP;
  const px = pole.x + pole.w / 2;
  const py = pole.y + pole.w / 2;
  const stops = GLOW_SWEEP.map((c, i) => {
    const z = pole.top * (0.12 + i * 0.19);
    const [x, y] = iso(px, py, z);
    return { c, x: r2(x), y: r2(y) };
  });
  return (
    <g>
      <g data-toggle-light="floor-lamp">
        {stops.map(({ c, x, y }) => (
          <ellipse key={c} cx={x} cy={y} rx={48} ry={34} fill={`url(#${ART_IDS.glow(c)})`} opacity={0.85} />
        ))}
      </g>
    </g>
  );
}
