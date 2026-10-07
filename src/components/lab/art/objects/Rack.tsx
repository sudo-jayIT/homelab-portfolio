/**
 * The homelab corner (spec 04 section 9.1 steps 22 to 24, 31 and 32): a
 * wall spotlight and the owner's 12U 10-inch rack standing on four feet,
 * with its devices seen through the tinted side panel. Faces are authored in
 * the 76 x 50 x 145 local box of src/lib/rack.tsx and scaled 0.9 into place.
 *
 * The front face is the shared RackFront (the same drawing as the homelab
 * section diagram and the inspector models) inside the faceLeft transform,
 * and the lit layer uses the shared DeviceLeds. Both follow RACK_SLOTS, so
 * the hotspots, the inspector poses and the callout tags line up with
 * whatever order the rack is in.
 *
 * The lit layer fades in each device separately ([data-unit][data-part]) and
 * carries the spotlight beam; the callout tags only show during the power-up.
 */

import { RACK_DEVICE_IDS, isBootPart, type BootPartId, type Vec3 } from "@/components/lab/contracts";
import { labBox, labLeft, labTop } from "@/lib/lab-placement";
import { HOMELAB } from "@/content";
import { faceLeft, iso, r2 } from "@/lib/iso";
import { BF, DeviceLeds, LED_COUNT, PART_LOCAL, RackFront, TF, ledPairs } from "@/lib/rack";
import { seededPairs } from "@/lib/rng";
import { FloorShadow, IsoBox } from "../primitives";
import {
  RACK,
  RACK_FEET,
  RACK_LOCAL,
  SEEDS,
  SPOT,
  TAG_FILL,
  TAG_LINE,
  TAG_TEXT,
  TONES,
  rackFront,
} from "../config";

const placed = labBox(RACK);
const S = RACK_LOCAL.S;
const FRONT_T = `${labLeft(RACK.x, RACK.y + RACK.d, RACK.top)} scale(${S})`;
const SIDE_T = `${faceLeft(placed.x, placed.y + placed.d, RACK.top)} scale(${S})`;
const TOP_T = `${labTop(RACK.x, RACK.y, RACK.top)} scale(${S})`;

/* ------------------------------------------------------------------------ */
/* Base                                                                      */
/* ------------------------------------------------------------------------ */

function Spotlight() {
  const [bx, by, bz, bw, bd, bh] = SPOT.bracket;
  const [hx, hy, hz, hw, hd, hh] = SPOT.head;
  return (
    <g>
      <IsoBox x={bx} y={by} z={bz} w={bw} d={bd} h={bh} tone={TONES.spotBracket} rim={false} />
      <IsoBox x={hx} y={hy} z={hz} w={hw} d={hd} h={hh} tone={TONES.spotHead} rim={false} />
    </g>
  );
}

/** Four rubber feet under the frame corners, painted back to front. */
function Feet() {
  const f = 5;
  const corners: [number, number][] = [
    [placed.x + 0.5, placed.y + 0.5],
    [placed.x + placed.w - f - 0.5, placed.y + 0.5],
    [placed.x + 0.5, placed.y + placed.d - f - 0.5],
    [placed.x + placed.w - f - 0.5, placed.y + placed.d - f - 0.5],
  ];
  return (
    <g>
      <FloorShadow x={placed.x} y={placed.y} w={placed.w} d={placed.d} spread={12} />
      {corners
        .sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
        .map(([x, y]) => (
          <IsoBox key={`${x}-${y}`} x={x} y={y} z={RACK.z - RACK_FEET} w={f} d={f} h={RACK_FEET} tone={TONES.rackFoot} rim={false} />
        ))}
    </g>
  );
}

function SidePanel() {
  const { D, H } = RACK_LOCAL;
  return (
    <g transform={SIDE_T}>
      <rect width={D} height={H} fill="#21252b" />
      {[TF + 5, H - BF - 16].map((v) => (
        <g key={v}>
          {Array.from({ length: 22 }, (_, i) => <rect key={i} x={4 + i * 1.9} y={v} width={1} height={10} rx={0.4} fill="#090c10" />)}
        </g>
      ))}
      <g fill="#343b43">
        <rect width={3} height={H} />
        <rect x={D - 3} width={3} height={H} />
        <rect width={D} height={TF - 2} />
        <rect y={H - BF + 1} width={D} height={BF - 1} />
      </g>
    </g>
  );
}

function Top() {
  return (
    <g transform={TOP_T}>
      <rect width={RACK_LOCAL.W} height={RACK_LOCAL.D} fill="#1c1f22" stroke="rgba(255,255,255,0.14)" strokeWidth={0.5} />
      <rect x={4} y={4} width={RACK_LOCAL.W - 8} height={RACK_LOCAL.D - 8} fill="url(#lab-perf)" />
    </g>
  );
}

/** The shared rack front (spec 04 step 24, spec 07 section 3.4) on the front face. */
function Front() {
  return (
    <g transform={FRONT_T}>
      <RackFront />
    </g>
  );
}

export function RackBase() {
  return (
    <g>
      <Spotlight />
      <Feet />
      <SidePanel />
      <Top />
      <Front />

    </g>
  );
}

/* ------------------------------------------------------------------------ */
/* Lights                                                                    */
/* ------------------------------------------------------------------------ */

const LED_PAIRS = seededPairs(SEEDS.rack, LED_COUNT);

function Beam() {
  const y = placed.y + placed.d / 2;
  // Point order as in the reference: the two spot points cross the far edges,
  // so the polygon is a bow tie (a small sliver at the lamp, then the cone).
  const p = [
    iso(437, y - 3, 160),
    iso(437, y + 3, 160),
    iso(placed.x + placed.w + 8, placed.y - 6, 0),
    iso(placed.x - 6, placed.y + placed.d + 8, 0),
  ];
  const [lx, ly] = iso(...SPOT.lens);
  return (
    <>
      <polygon points={p.map(([x, yy]) => `${r2(x)},${r2(yy)}`).join(" ")} fill="url(#lab-beam)" />
      <circle cx={r2(lx)} cy={r2(ly + 1)} r={10} fill="url(#lab-glow-white)" opacity={0.8} />
    </>
  );
}

export function RackLights({ lit }: { lit: boolean }) {
  const o = lit ? 1 : 0;
  return (
    <g data-lights="myrack">
      <g data-unit="" data-part="spot" opacity={o}>
        <Beam />
      </g>
      {RACK_DEVICE_IDS.map((id) => (
        <g key={id} data-unit="" data-part={id} opacity={o} transform={FRONT_T}>
          <g transform={`translate(${PART_LOCAL[id].u[0]} ${PART_LOCAL[id].v[0]})`}>
            <DeviceLeds id={id} r2={ledPairs(LED_PAIRS, id)} />
          </g>
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------------ */
/* Power-up callout tags                                                     */
/* ------------------------------------------------------------------------ */

/** Leader end: a point just inside the left end of the device's face. */
function anchorOf(id: BootPartId): Vec3 {
  const p = PART_LOCAL[id];
  return rackFront(p.u[0] + 2.5, (p.v[0] + p.v[1]) / 2);
}

/** Minimum vertical distance between two tags (SVG user units). */
const TAG_GAP = 20;

/** Tagged devices top to bottom, each tag level with its device (pushed down to keep TAG_GAP). */
const TAG_ROWS = (() => {
  let last = -Infinity;
  return RACK_DEVICE_IDS.filter(isBootPart).map((id) => {
    const [ax, ay] = iso(...anchorOf(id)).map(r2);
    const y = r2(Math.max(ay - 6, last + TAG_GAP));
    last = y;
    return { id, ax, ay, y };
  });
})();

export function RackTags() {
  const [cx] = iso(RACK.x, RACK.y + RACK.d, RACK.top);
  const right = r2(cx - 30);
  return (
    <g>
      {TAG_ROWS.map(({ id, ax, ay, y }) => {
        const text = HOMELAB.rackTags[id];
        const w = r2(5.9 * text.length + 14);
        return (
          <g key={id} data-tag={id} opacity={0}>
            <polyline
              points={`${right},${y} ${r2(right + 10)},${y} ${ax},${ay}`}
              fill="none"
              stroke={TAG_LINE}
              strokeOpacity={0.6}
              strokeWidth={0.8}
            />
            <circle cx={ax} cy={ay} r={1.8} fill={TAG_LINE} />
            <rect
              x={r2(right - w)}
              y={r2(y - 8)}
              width={w}
              height={16}
              rx={3}
              fill={TAG_FILL}
              stroke={TAG_LINE}
              strokeOpacity={0.45}
              strokeWidth={0.8}
            />
            <text x={r2(right - w + 7)} y={r2(y + 3.4)} fontSize={9.8} fill={TAG_TEXT} className="lab-mono">
              {text}
            </text>
          </g>
        );
      })}
    </g>
  );
}
