/**
 * Rack geometry and device faces (spec 07 section 3.4, spec 04 step 24,
 * spec 05 section 2.5). Owned by the rack area.
 *
 * The owner's 12U 10-inch rack, drawn in a local box W x H x D
 * (76 x 145 x 50 units): x to the right, y down from the top of the frame,
 * d from the front face toward the back. One rack unit is U = 11 units.
 *
 * RACK_SLOTS is the single table of what sits where (top to bottom). Reorder
 * it, change a slot's height or move a device to another shelf and every
 * view follows: the homelab section diagram (flat LED halos, seeded 2026),
 * the room art (front face scaled 0.9, gradient halos), the room hotspots and
 * tags, and the rack inspector's CSS-3D models (gradient halos, seeded 97).
 *
 * Every device face is an original drawing: recognisable shapes (port
 * clusters, vent fields, drive bays, outlets) with no logos. The only words
 * drawn are generic ("5-PORT") or the owner's own host names on label-maker
 * stickers ("pve1").
 *
 * Server compatible (no hooks, no "use client") and deterministic.
 */

import type { ReactNode } from "react";
import {
  RACK_DEVICE_IDS,
  RACK_PART_IDS,
  type BlinkKind,
  type LedColor,
  type PartBox,
  type RackDeviceId,
  type RackPartId,
} from "@/components/lab/contracts";
import { Led } from "@/components/ui/Led";
import { HOMELAB } from "@/content";
import { seededPairs } from "@/lib/rng";

/* ------------------------------------------------------------------------ */
/* Frame constants                                                           */
/* ------------------------------------------------------------------------ */

export type Range = readonly [number, number];

/** Rack outer width (a 10-inch rack). */
export const W = 76;
/** One rack unit. */
export const U = 11;
/** Rack height in units. */
export const RACK_U = 12;
/** Top frame band height. */
export const TF = 8;
/** Bottom frame band height. */
export const BF = 5;
/** Rack outer height: 145. */
export const H = TF + RACK_U * U + BF;
/** Rack depth (3D views and the room's side panel). */
export const D = 50;
/** Post width. */
export const P = 7;
/** Shelf ear rails either side of a shelf, left and right (x ranges). */
export const RAIL_L: Range = [4.8, 8];
export const RAIL_R: Range = [W - 8, W - 4.8];
/** Thickness of a shelf's front lip. */
export const LIP_H = 1;
/** Gap between devices sharing a shelf. */
const GAP = 2;

/* ------------------------------------------------------------------------ */
/* The rack layout (edit here)                                               */
/* ------------------------------------------------------------------------ */

export interface RackSlot {
  /** Devices in this slot, left to right. */
  parts: readonly RackDeviceId[];
  /** Height in rack units. */
  units: number;
}

/**
 * What sits where, top to bottom. Provisional order: change it freely. Slots
 * may add up to fewer than RACK_U units; the rest is drawn as blank panels at
 * the bottom.
 */
export const RACK_SLOTS: readonly RackSlot[] = [
  { parts: ["switch-5"], units: 1 },
  { parts: ["switch-8"], units: 1 },
  { parts: ["pve1"], units: 1 },
  { parts: ["pve2"], units: 1 },
  { parts: ["pve3"], units: 1 },
  { parts: ["pi", "pve4"], units: 1 },
  { parts: ["zima"], units: 1 },
  { parts: ["nas"], units: 4 },
  { parts: ["pdu"], units: 1 },
];

/** How each device is built: front face w x h, depth d (local units). */
export interface DeviceShape {
  w: number;
  h: number;
  d: number;
  /** "shelf": sits on a cantilever shelf; "ears": screwed to the rails (full width). */
  mount: "shelf" | "ears";
  /** Number of blinking LEDs (seeded timing pairs it consumes). */
  blinks: number;
  /** Host name sticker on the face, if any. */
  sticker?: string;
}

/** Approximate proportions of the real hardware, scaled about 4 mm per unit. */
export const DEVICE: Record<RackDeviceId, DeviceShape> = {
  "switch-5": { w: 28, h: 7, d: 26, mount: "shelf", blinks: 5 },
  "switch-8": { w: 42, h: 7.4, d: 26, mount: "shelf", blinks: 8 },
  pve1: { w: 44, h: 8.6, d: 44, mount: "shelf", blinks: 1, sticker: "pve1" },
  pve2: { w: 44, h: 8.6, d: 44, mount: "shelf", blinks: 1, sticker: "pve2" },
  pve3: { w: 44, h: 8.6, d: 44, mount: "shelf", blinks: 1, sticker: "pve3" },
  pve4: { w: 30, h: 9.6, d: 30, mount: "shelf", blinks: 1, sticker: "pve4" },
  pi: { w: 16, h: 6, d: 22, mount: "shelf", blinks: 1 },
  zima: { w: 41, h: 7.6, d: 34, mount: "shelf", blinks: 2 },
  nas: { w: 34, h: 41, d: 46, mount: "shelf", blinks: 3, sticker: "nas" },
  pdu: { w: 64, h: 9, d: 11, mount: "ears", blinks: 0 },
};

/** Width of one ZimaBoard inside the "zima" part (two boards side by side). */
export const ZIMA_BOARD_W = (DEVICE.zima.w - 2) / 2;

/** One slot after layout: its band on the front face and the U numbers it covers. */
export interface SlotBand {
  parts: readonly RackDeviceId[];
  units: number;
  /** Top and bottom of the band (local v). */
  v: Range;
  /** True when any device in it sits on a shelf. */
  shelf: boolean;
  /** Highest and lowest U number covered (U1 is the bottom unit). */
  uTop: number;
  uBottom: number;
}

/** Part boxes in rack-local units: x range u, y range v, depth range d. */
export interface PartLocal {
  u: Range;
  v: Range;
  d: Range;
}

function layout() {
  const bands: SlotBand[] = [];
  const parts = {} as Record<RackDeviceId, PartLocal>;
  let used = 0;
  for (const slot of RACK_SLOTS) {
    const v: Range = [TF + used * U, TF + (used + slot.units) * U];
    const shelf = slot.parts.some((id) => DEVICE[id].mount === "shelf");
    bands.push({
      parts: slot.parts,
      units: slot.units,
      v,
      shelf,
      uTop: RACK_U - used,
      uBottom: RACK_U - used - slot.units + 1,
    });
    const total = slot.parts.reduce((s, id) => s + DEVICE[id].w, 0) + GAP * (slot.parts.length - 1);
    let x = W / 2 - total / 2;
    for (const id of slot.parts) {
      const dev = DEVICE[id];
      const bottom = dev.mount === "shelf" ? v[1] - LIP_H - 0.2 : (v[0] + v[1]) / 2 + dev.h / 2;
      const d0 = dev.mount === "shelf" ? 0.5 : 0;
      parts[id] = { u: [x, x + dev.w], v: [bottom - dev.h, bottom], d: [d0, Math.min(D - 1, d0 + dev.d)] };
      x += dev.w + GAP;
    }
    used += slot.units;
  }
  return { bands, parts, used };
}

const LAYOUT = layout();

/** Slot bands top to bottom. */
export const SLOT_BANDS: readonly SlotBand[] = LAYOUT.bands;

/** Empty units left at the bottom (drawn as blank panels). */
export const SPARE_U = Math.max(0, RACK_U - LAYOUT.used);

export const PART_LOCAL: Record<RackPartId, PartLocal> = {
  rack: { u: [0, W], v: [0, H], d: [0, D] },
  ...LAYOUT.parts,
};

/** The slot a device sits in. */
export function bandOf(id: RackDeviceId): SlotBand {
  return SLOT_BANDS.find((b) => b.parts.includes(id))!;
}

/**
 * The clickable front area of a device: its slot band, split between devices
 * that share a slot (at the midpoint of the gap between them).
 */
export function hitArea(id: RackDeviceId): { u: Range; v: Range } {
  const band = bandOf(id);
  const i = band.parts.indexOf(id);
  const left = i === 0 ? 2 : (PART_LOCAL[band.parts[i - 1]].u[1] + PART_LOCAL[id].u[0]) / 2;
  const right =
    i === band.parts.length - 1 ? W - 2 : (PART_LOCAL[id].u[1] + PART_LOCAL[band.parts[i + 1]].u[0]) / 2;
  return { u: [left, right], v: band.v };
}

/** "U12" or "U2–U5": the rack units a part occupies. */
export function unitLabel(id: RackPartId): string {
  if (id === "rack") return `${RACK_U}U`;
  const b = bandOf(id);
  return b.uTop === b.uBottom ? `U${b.uTop}` : `U${b.uBottom}–U${b.uTop}`;
}

/** Inspector tab order (same as the hotspot ids: the rack, then devices top to bottom). */
export const PART_ORDER: readonly RackPartId[] = RACK_PART_IDS;

/** Hardware descriptions (kicker, title, specs, links, tab, tip). */
export const PARTS = HOMELAB.parts;

export const isPart = (id: string | null | undefined): id is RackPartId =>
  !!id && (RACK_PART_IDS as readonly string[]).includes(id);

export function partSize(id: RackPartId): { w: number; h: number; d: number } {
  const p = PART_LOCAL[id];
  return { w: p.u[1] - p.u[0], h: p.v[1] - p.v[0], d: p.d[1] - p.d[0] };
}

/**
 * World box of a part for a rack whose left/back/bottom world corner is
 * `origin` and whose local units are scaled by `scale` (the room uses 0.9).
 * Room x grows with u, room y grows toward the front (d = 0 is the front),
 * room z grows upward (v = 0 is the top).
 */
export function rackPartBox(id: RackPartId, origin: { x: number; y: number; z: number }, scale = 0.9): PartBox {
  const p = PART_LOCAL[id];
  return {
    x: origin.x + scale * p.u[0],
    y: origin.y + scale * D - scale * p.d[1],
    z: origin.z + scale * H - scale * p.v[1],
    w: scale * (p.u[1] - p.u[0]),
    d: scale * (p.d[1] - p.d[0]),
    h: scale * (p.v[1] - p.v[0]),
  };
}

/** Generic wordmark text on the frame (no maker names). */
export const RACK_LABELS = {
  /** Small mono line on the top band, then the bold word. */
  rackSmall: "10in",
  rackBold: `${RACK_U}U`,
} as const;

/** White used for plugs and cords. */
export const CORD = "#eef1f3";
/** Light frame grey of the posts and bottom band. */
export const FRAME = "#333940";

/* ------------------------------------------------------------------------ */
/* LED timing                                                                */
/* ------------------------------------------------------------------------ */

type Pair = readonly [number, number];

/** First seeded pair of each device (devices in RACK_DEVICE_IDS order). */
const LED_OFFSET = (() => {
  const out = {} as Record<RackDeviceId, number>;
  let n = 0;
  for (const id of RACK_DEVICE_IDS) {
    out[id] = n;
    n += DEVICE[id].blinks;
  }
  return out;
})();

/** Total blinking LEDs in the rack. */
export const LED_COUNT = RACK_DEVICE_IDS.reduce((s, id) => s + DEVICE[id].blinks, 0);

/** The slice of seeded pairs that belongs to a device. */
export function ledPairs(pairs: readonly Pair[], id: RackDeviceId): readonly Pair[] {
  return pairs.slice(LED_OFFSET[id], LED_OFFSET[id] + DEVICE[id].blinks);
}

/** Seeded LED pairs for the homelab section diagram (spec 07 4.2). */
export const SECTION_LED_PAIRS: readonly Pair[] = seededPairs(2026, LED_COUNT);
/** Seeded LED pairs for the rack inspector models. */
export const INSPECTOR_LED_PAIRS: readonly Pair[] = seededPairs(97, LED_COUNT);

/* ------------------------------------------------------------------------ */
/* LEDs                                                                      */
/* ------------------------------------------------------------------------ */

export interface DeviceLedProps {
  /** "gradient" (room and inspector, needs the lab-glow-* defs) or "flat" (section diagram). */
  halo?: "gradient" | "flat";
  /** Override every LED's halo multiplier (the section diagram uses 3). */
  glow?: number;
}

function led(
  key: string | number,
  cx: number,
  cy: number,
  color: LedColor,
  r: number,
  glow: number,
  opts: DeviceLedProps,
  blink?: BlinkKind,
  r2?: Pair,
): ReactNode {
  return (
    <Led
      key={key}
      cx={cx}
      cy={cy}
      r={r}
      color={color}
      glow={opts.glow ?? glow}
      halo={opts.halo ?? "gradient"}
      blink={blink}
      r2={r2}
    />
  );
}

/** LEDs of one ZimaBoard (board-local units): link activity and power. */
export function ZimaBoardLeds({ pair, ...opts }: DeviceLedProps & { pair: Pair }) {
  return (
    <>
      {led("act", 4.1, 3.35, "green", 0.3, 3.2, opts, "act", pair)}
      {led("pwr", ZIMA_BOARD_W - 1.1, 3.3, "cyan", 0.3, 3.4, opts)}
    </>
  );
}

/** Port x of switch port i (device-local). */
const sw5X = (i: number) => 7.6 + 4 * i;
const sw8X = (i: number) => 8.2 + 4.1 * i;

/** Port and power LEDs of a device, in device-local units. `r2` holds its seeded pairs. */
export function DeviceLeds({ id, r2, ...opts }: DeviceLedProps & { id: RackDeviceId; r2: readonly Pair[] }) {
  switch (id) {
    case "switch-5":
      return (
        <>
          {Array.from({ length: 5 }, (_, i) => led(i, sw5X(i) + 1.7, 2.35, "green", 0.42, 3.2, opts, "act", r2[i]))}
          {led("pwr", 2.4, 4.9, "green", 0.45, 3, opts)}
        </>
      );
    case "switch-8":
      return (
        <>
          {Array.from({ length: 8 }, (_, i) => led(i, sw8X(i) + 1.7, 2.45, "green", 0.42, 3.2, opts, "act", r2[i]))}
          {led("pwr", 2.4, 5.1, "green", 0.45, 3, opts)}
        </>
      );
    case "pve1":
    case "pve2":
    case "pve3":
      return (
        <>
          {led("pwr", 40.6, 4.4, "white", 0.55, 4, opts)}
          {led("disk", 37.2, 2.2, "amber", 0.32, 3, opts, "disk", r2[0])}
        </>
      );
    case "pve4":
      return (
        <>
          {led("pwr", 26.2, 5.9, "blue", 0.5, 4, opts)}
          {led("disk", 26.2, 2.7, "amber", 0.3, 3, opts, "disk", r2[0])}
        </>
      );
    case "pi":
      return (
        <>
          {led("link", 1.5, 1.75, "amber", 0.32, 3, opts)}
          {led("act", 4.3, 1.75, "green", 0.32, 3.2, opts, "act", r2[0])}
        </>
      );
    case "zima":
      return (
        <>
          {[0, 1].map((b) => (
            <g key={b} transform={`translate(${b * (ZIMA_BOARD_W + 2)} 0)`}>
              <ZimaBoardLeds pair={r2[b]} {...opts} />
            </g>
          ))}
        </>
      );
    case "nas":
      return (
        <>
          {led("pwr", 29.6, 3.7, "white", 0.55, 4, opts)}
          {led("net", 3.4, 3.7, "green", 0.36, 3.2, opts, "act", r2[0])}
          {led("d1", 2.6 + 12, 10.5, "blue", 0.34, 3.4, opts, "disk", r2[1])}
          {led("d2", 17.8 + 12, 10.5, "blue", 0.34, 3.4, opts, "disk", r2[2])}
        </>
      );
    case "pdu":
      return (
        <>
          <rect x={5.5} y={2} width={4.6} height={5} rx={0.5} fill="#fb923c" />
          {led("pwr", 7.8, 4.5, "amber", 1.2, 3.5, opts)}
        </>
      );
  }
}

/* ------------------------------------------------------------------------ */
/* Device faces (front views, device-local units, origin top-left)          */
/* ------------------------------------------------------------------------ */

/** Label-maker strip with a host name. */
export function Sticker({ x, y, text, w = 6.4 }: { x: number; y: number; text: string; w?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={1.9} rx={0.2} fill="#eeece4" />
      <text x={x + w / 2} y={y + 1.43} fontSize={1.3} fontWeight={700} fill="#d4d9dc" textAnchor="middle" className="lab-mono">
        {text}
      </text>
    </g>
  );
}

/** RJ45 socket: dark opening with a latch notch. */
function Rj45({ x, y, w = 3.4, h = 2.9, plug = false }: { x: number; y: number; w?: number; h?: number; plug?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#060708" />
      <rect x={x + w * 0.32} y={y + h - 0.6} width={w * 0.36} height={0.6} fill="#1a1c1f" />
      {plug ? <rect x={x + 0.3} y={y + 0.2} width={w - 0.6} height={h - 0.4} fill={CORD} /> : null}
    </g>
  );
}

/** USB-A port: metal surround with a coloured tongue. */
function UsbA({ x, y, w = 2.8, h = 1.2, tongue = "#0b0c0e" }: { x: number; y: number; w?: number; h?: number; tongue?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={0.15} fill="#050607" stroke="#5b6167" strokeWidth={0.15} />
      <rect x={x + 0.35} y={y + 0.3} width={w - 0.7} height={h * 0.32} fill={tongue} />
    </g>
  );
}

/** Unmanaged 5-port desktop switch, 28 x 7. */
function Switch5Front({ plugs }: { plugs: readonly number[] }) {
  return (
    <>
      <rect width={28} height={7} rx={0.5} fill="#2b2f34" stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />
      <rect x={0.4} y={0.3} width={27.2} height={0.6} rx={0.3} fill="rgba(255,255,255,0.07)" />
      <text x={1.2} y={2.5} fontSize={1.05} fill="rgba(255,255,255,0.5)" className="lab-mono">
        5-PORT
      </text>
      <circle cx={2.4} cy={4.9} r={0.5} fill="#0a0b0c" />
      {Array.from({ length: 5 }, (_, i) => (
        <Rj45 key={i} x={sw5X(i)} y={3.3} plug={plugs.includes(i)} />
      ))}
    </>
  );
}

/** Managed 8-port desktop switch, 42 x 7.4. */
function Switch8Front({ plugs }: { plugs: readonly number[] }) {
  return (
    <>
      <rect width={42} height={7.4} rx={0.5} fill="#24282c" stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />
      <rect x={0.4} y={0.3} width={41.2} height={0.6} rx={0.3} fill="rgba(255,255,255,0.07)" />
      <text x={1.2} y={2.6} fontSize={1.05} fill="rgba(255,255,255,0.5)" className="lab-mono">
        8-PORT
      </text>
      <text x={1.2} y={3.9} fontSize={0.75} fill="rgba(255,255,255,0.32)" className="lab-mono">
        MANAGED
      </text>
      <circle cx={2.4} cy={5.1} r={0.5} fill="#0a0b0c" />
      {Array.from({ length: 8 }, (_, i) => (
        <Rj45 key={i} x={sw8X(i)} y={3.5} plug={plugs.includes(i)} />
      ))}
    </>
  );
}

/** Small-form-factor office mini PC (ProDesk-style), 44 x 8.6: vent field, front I/O, power ring. */
function MiniFront({ sticker }: { sticker: string }) {
  return (
    <>
      <rect width={44} height={8.6} rx={0.6} fill="#b5b7b8" stroke="rgba(255,255,255,0.09)" strokeWidth={0.3} />
      <rect x={0.5} y={0.3} width={43} height={0.5} rx={0.25} fill="rgba(255,255,255,0.05)" />
      <rect x={0.5} y={0.5} width={29} height={7.5} rx={0.5} fill="#2a2e33" />
      {Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 17 }, (_, i) => (
          <circle key={`${row}-${i}`} cx={9.4 + 1.3 * i + (row % 2) * 0.65} cy={3 + 1.55 * row} r={0.33} fill="#050607" />
        )),
      )}
      <Sticker x={1.3} y={1} text={sticker} />
      <circle cx={33.3} cy={5.4} r={0.55} fill="#050607" stroke="#3a3f45" strokeWidth={0.15} />
      <UsbA x={34.6} y={4.8} tongue="#1d4ed8" />
      <rect x={34.9} y={2.7} width={1.9} height={0.8} rx={0.4} fill="#050607" stroke="#3a3f45" strokeWidth={0.15} />
      <circle cx={40.6} cy={4.4} r={1.5} fill="#0c0d0f" stroke="#5b6167" strokeWidth={0.3} />
    </>
  );
}

/** Compact square mini PC (the fourth node), 30 x 9.6: gunmetal shell, side vents, front I/O. */
function CubeFront({ sticker }: { sticker: string }) {
  return (
    <>
      <rect width={30} height={9.6} rx={1.2} fill="#30353b" stroke="rgba(255,255,255,0.12)" strokeWidth={0.3} />
      <rect x={0.8} y={0.45} width={28.4} height={0.7} rx={0.35} fill="rgba(255,255,255,0.08)" />
      <Sticker x={1.4} y={1.6} text={sticker} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={10.6 + 1.5 * i} y={2.2} width={0.6} height={4.2} rx={0.3} fill="#16191c" />
      ))}
      <UsbA x={1.6} y={6.3} tongue="#1d4ed8" />
      <UsbA x={4.9} y={6.3} tongue="#1d4ed8" />
      <rect x={8.3} y={6.5} width={2} height={0.8} rx={0.4} fill="#050607" stroke="#5b6167" strokeWidth={0.15} />
      <circle cx={12} cy={6.9} r={0.5} fill="#050607" stroke="#5b6167" strokeWidth={0.12} />
      <circle cx={26.2} cy={5.9} r={1.25} fill="#15181b" stroke="#6b7178" strokeWidth={0.3} />
    </>
  );
}

/** Single-board computer seen from its port end, 16 x 6: Ethernet jack, two USB stacks, green board. */
function PiFront() {
  const stack = (x: number, insert: string, key: string) => (
    <g key={key}>
      <rect x={x} y={0.4} width={4.6} height={4.8} rx={0.2} fill="#b9bec4" />
      <rect x={x + 0.45} y={0.9} width={3.7} height={1.6} fill="#08090a" />
      <rect x={x + 0.45} y={3.1} width={3.7} height={1.6} fill="#08090a" />
      <rect x={x + 0.85} y={1.15} width={2.9} height={0.6} fill={insert} />
      <rect x={x + 0.85} y={3.35} width={2.9} height={0.6} fill={insert} />
    </g>
  );
  return (
    <>
      <rect y={5.1} width={16} height={0.9} fill="#1f7a3e" />
      <rect y={5.1} width={16} height={0.25} fill="#c8a24a" opacity={0.5} />
      <rect x={0.2} y={1.1} width={5.2} height={4.1} rx={0.2} fill="#aeb3b9" />
      <rect x={0.75} y={2.2} width={4.1} height={2.7} fill="#08090a" />
      <rect x={2.05} y={4.4} width={1.5} height={0.5} fill="#2a2d31" />
      {stack(5.8, "#2563eb", "u3")}
      {stack(10.9, "#0b0c0e", "u2")}
    </>
  );
}

/** One fanless single-board server, w x 7.6: finned aluminium heatsink over a port panel. */
export function ZimaBoardFront({ x = 0 }: { x?: number }) {
  const w = ZIMA_BOARD_W;
  const fins = Math.floor((w - 0.6) / 1.45);
  return (
    <g transform={`translate(${x} 0)`}>
      {Array.from({ length: fins }, (_, i) => (
        <rect key={i} x={0.5 + 1.45 * i} y={0} width={0.85} height={2.4} fill="#b7bcc1" />
      ))}
      <rect y={1.9} width={w} height={5.7} rx={0.5} fill="#a2a8ae" />
      <rect x={0.7} y={2.7} width={w - 1.4} height={4.2} rx={0.3} fill="#25282c" />
      <Rj45 x={1.2} y={3.6} w={3} h={2.6} />
      <Rj45 x={4.6} y={3.6} w={3} h={2.6} />
      <UsbA x={8.3} y={3.6} w={2.4} h={1.1} tongue="#2563eb" />
      <UsbA x={8.3} y={5.2} w={2.4} h={1.1} tongue="#2563eb" />
      <path d={`M${11.6} ${4.2}h2.2l-0.3 1.1h-1.6z`} fill="#050607" stroke="#5b6167" strokeWidth={0.12} />
      <circle cx={w - 3.2} cy={5.4} r={0.6} fill="#050607" stroke="#5b6167" strokeWidth={0.15} />
    </g>
  );
}

function ZimaFront() {
  return (
    <>
      <ZimaBoardFront x={0} />
      <ZimaBoardFront x={ZIMA_BOARD_W + 2} />
    </>
  );
}

/** Two-bay NAS, 34 x 41: top control strip, two horizontal drive trays. */
function NasFront({ sticker }: { sticker: string }) {
  const bay = (y: number, key: string) => (
    <g key={key}>
      <rect x={3} y={y} width={28} height={14.8} rx={0.8} fill="#292c32" stroke="#50535b" strokeWidth={0.45} />
      <rect x={4.2} y={y + 1.2} width={5} height={12.4} rx={0.8} fill="#363942" />
      <path d={`M6.7 ${y + 5}v4`} stroke="#111418" strokeWidth={1.2} strokeLinecap="round" />
      <text x={24} y={y + 9} fontSize={4.5} fill="#101216" className="lab-mono">{key === "b1" ? "01" : "02"}</text>
    </g>
  );
  return (
    <>
      <rect width={34} height={41} rx={1.6} fill="#1c1f23" stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />
      <rect x={0.6} y={0.4} width={32.8} height={0.7} rx={0.35} fill="rgba(255,255,255,0.06)" />
      <circle cx={3.4} cy={3.7} r={0.5} fill="#08090a" />
      <circle cx={5.6} cy={3.7} r={0.5} fill="#08090a" />
      <Sticker x={8.6} y={2.75} text={sticker} w={5.4} />
      <rect x={17.4} y={3.25} width={2.3} height={0.9} rx={0.45} fill="#050607" stroke="#5b6167" strokeWidth={0.15} />
      <UsbA x={21.2} y={3.1} tongue="#1d4ed8" />
      <circle cx={29.6} cy={3.7} r={1.55} fill="#0c0d0f" stroke="#5b6167" strokeWidth={0.3} />
      {bay(8, "b1")}
      {bay(24, "b2")}
    </>
  );
}

/** 1U rack power strip, 72 x 9: ears, lit rocker, breaker, eight outlets. */
function PduFront() {
  const w = DEVICE.pdu.w;
  return (
    <>
      <rect width={w} height={9} fill="#121315" stroke="rgba(255,255,255,0.08)" strokeWidth={0.3} />
      {[0, w - 3.6].map((x) => (
        <g key={x}>
          <rect x={x} width={3.6} height={9} fill="#1b1d20" />
          <rect x={x + 1} y={1.6} width={1.6} height={1.2} rx={0.6} fill="#050607" />
          <rect x={x + 1} y={6.2} width={1.6} height={1.2} rx={0.6} fill="#050607" />
        </g>
      ))}
      <rect x={5} y={1.5} width={5.6} height={6} rx={0.6} fill="#3b1d08" stroke="#5b3413" strokeWidth={0.3} />
      <circle cx={12.2} cy={4.5} r={0.65} fill="#2a2d31" stroke="#4a4f55" strokeWidth={0.2} />
      {Array.from({ length: 8 }, (_, i) => {
        const x = 14 + 5.8 * i;
        return (
          <g key={i}>
            <rect x={x} y={1.3} width={4.9} height={6.4} rx={1} fill="#1d1f22" stroke="#2c2f33" strokeWidth={0.25} />
            <rect x={x + 1.2} y={2.3} width={0.65} height={2} rx={0.2} fill="#050607" />
            <rect x={x + 3.05} y={2.3} width={0.65} height={2.3} rx={0.2} fill="#050607" />
            <path d={`M${x + 1.85} 6.4 a0.6 0.6 0 0 1 1.2 0 v0.2 h-1.2 z`} fill="#050607" />
          </g>
        );
      })}
    </>
  );
}

/** Front face of a device in device-local units. `cabled` draws plugs in the PLUGGED switch ports. */
export function DeviceFront({ id, cabled = false }: { id: RackDeviceId; cabled?: boolean }) {
  const sticker = DEVICE[id].sticker ?? id;
  const plugs = cabled ? (PLUGGED[id] ?? []) : [];
  switch (id) {
    case "switch-5":
      return <Switch5Front plugs={plugs} />;
    case "switch-8":
      return <Switch8Front plugs={plugs} />;
    case "pve1":
    case "pve2":
    case "pve3":
      return <MiniFront sticker={sticker} />;
    case "pve4":
      return <CubeFront sticker={sticker} />;
    case "pi":
      return <PiFront />;
    case "zima":
      return <ZimaFront />;
    case "nas":
      return <NasFront sticker={sticker} />;
    case "pdu":
      return <PduFront />;
  }
}

/* ------------------------------------------------------------------------ */
/* Frame pieces                                                              */
/* ------------------------------------------------------------------------ */

/** U numbers (12 at the top) and rail holes on one post, centred at x. */
export function UMarks({ x, numbers = true }: { x: number; numbers?: boolean }) {
  return (
    <>
      {Array.from({ length: RACK_U }, (_, r) => (
        <g key={r}>
          <circle cx={x} cy={TF + U * r + 6.2} r={0.75} fill="#7d8489" />
          {numbers ? (
            <text x={x} y={TF + U * r + 3} fontSize={1.5} fill="#7d8489" textAnchor="middle" className="lab-mono">
              {String(RACK_U - r).padStart(2, "0")}
            </text>
          ) : null}
        </g>
      ))}
    </>
  );
}

/** The two-line wordmark on the top band: a small mono word, then the bold word centred at cx. */
export function RackWordmark({ cx = W / 2 }: { cx?: number }) {
  return (
    <>
      <text x={cx - 3.5} y={3} fontSize={1.8} fill="#d4d9dc" className="lab-mono">
        {RACK_LABELS.rackSmall}
      </text>
      <text x={cx} y={6.6} fontSize={3.8} fontWeight={700} fill="#d4d9dc" textAnchor="middle" letterSpacing={0.2}>
        {RACK_LABELS.rackBold}
      </text>
    </>
  );
}

const RAIL = "#121416";
const LIP = "#1d2023";

/** Shelf ears either side of a slot band, with two screws each. */
function ShelfEars({ v }: { v: Range }) {
  const h = v[1] - v[0] - 1;
  return (
    <>
      {[RAIL_L, RAIL_R].map(([x0, x1]) => (
        <g key={x0}>
          <rect x={x0} y={v[0] + 0.5} width={x1 - x0} height={h} fill={RAIL} />
          <circle cx={(x0 + x1) / 2} cy={v[0] + 2.2} r={0.45} fill="#454b50" />
          <circle cx={(x0 + x1) / 2} cy={v[1] - 2.2} r={0.45} fill="#454b50" />
        </g>
      ))}
    </>
  );
}

/** Blank 1U filler panel starting at y. */
function BlankPanel({ y }: { y: number }) {
  return (
    <g>
      <rect x={2} y={y + 0.3} width={72} height={U - 0.6} fill="#0e1012" stroke="rgba(255,255,255,0.06)" strokeWidth={0.3} />
      {[4, 72].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={y + 2.6} r={0.8} fill="#454b50" />
          <circle cx={cx} cy={y + U - 2.6} r={0.8} fill="#454b50" />
        </g>
      ))}
    </g>
  );
}

/** Switch ports with a cable plugged in (port index from the left). */
export const PLUGGED: Partial<Record<RackDeviceId, readonly number[]>> = {
  "switch-5": [2, 3, 4],
  "switch-8": [3, 4, 5, 6, 7],
};

/** Port centre x and bottom y of a switch port (device-local). */
function portAt(id: RackDeviceId, i: number): [number, number] {
  return id === "switch-5" ? [sw5X(i) + 1.7, 6.1] : [sw8X(i) + 1.7, 6.3];
}

/**
 * White cords from the plugged switch ports, dressed along each shelf lip to
 * right and down a bundle beside the devices (front view, rack-local
 * units). The upper switch takes the outer lanes so no two cords cross; the
 * bundle turns into the right rail above the first slot whose devices reach
 * the lanes (inner lanes turn lowest, so the tails stay parallel).
 */
export function PatchCords({ opacity = 0.85 }: { opacity?: number }) {
  const runs = SLOT_BANDS.flatMap((b) => b.parts).filter((id) => PLUGGED[id]?.length);
  if (!runs.length) return null;
  // Lanes from the rail inward: the upper switch takes the outer ones.
  let x = RAIL_R[0] - 0.6;
  const lanesOf = runs.map((id) => {
    const n = PLUGGED[id]!.length;
    const lanes = Array.from({ length: n }, (_, k) => x - 0.75 * (n - 1 - k));
    x -= 0.75 * n + 0.6;
    return lanes;
  });
  const inner = x + 0.6;
  const lowest = Math.max(...runs.map((id) => PART_LOCAL[id].v[1]));
  const stop = SLOT_BANDS.find((b) => b.v[0] >= lowest && b.parts.some((id) => PART_LOCAL[id].u[1] > inner - 0.8));
  const endY = (stop ? stop.v[0] : H - BF) - 0.8;
  const paths: ReactNode[] = [];
  runs.forEach((id, r) => {
    const ports = PLUGGED[id]!;
    const p = PART_LOCAL[id];
    const n = ports.length;
    // Leftmost port: lowest run along the lip and innermost lane.
    const lanes = lanesOf[r];
    ports.forEach((port, k) => {
      const [px, py] = portAt(id, port);
      const sx = p.u[0] + px;
      const sy = p.v[0] + py;
      const y = sy + 0.3 + 0.3 * (n - 1 - k);
      const bx = lanes[k];
      const ty = endY - 0.45 * (bx - inner);
      paths.push(
        <path
          key={`${id}-${port}`}
          d={`M${sx} ${sy} Q${sx} ${y} ${sx + 1} ${y} H${bx - 1} Q${bx} ${y} ${bx} ${y + 1} V${ty - 1} Q${bx} ${ty} ${bx + 1} ${ty} H${RAIL_R[0] + 0.4}`}
        />,
      );
    });
  });
  return (
    <g fill="none" stroke={CORD} strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      {paths}
    </g>
  );
}

/* ------------------------------------------------------------------------ */
/* The full rack front (draw order back to front)                            */
/* ------------------------------------------------------------------------ */

/**
 * Rack front view in rack-local units (0..76 x 0..145), without LEDs,
 * handles, feet or callouts. Used by the section diagram and the room's
 * front face.
 */
export function RackFront() {
  const spareTop = TF + (RACK_U - SPARE_U) * U;
  return (
    <>
      {/* frame */}
      <rect width={W} height={H} fill="#0a0c0e" />
      <rect width={P} height={H} fill={FRAME} />
      <rect x={W - P} width={P} height={H} fill={FRAME} />
      <rect width={W} height={TF} fill={FRAME} />
      <rect y={H - BF} width={W} height={BF} fill={FRAME} />
      <RackWordmark />
      <UMarks x={2.4} />
      <UMarks x={W - 2.4} numbers={false} />
      {/* shelves and devices, top to bottom */}
      {SLOT_BANDS.map((band) => (
        <g key={band.v[0]}>
          {band.shelf ? (
            <>
              <ShelfEars v={band.v} />
              <rect x={P} y={band.v[1] - LIP_H} width={W - 2 * P} height={LIP_H} fill={LIP} />
            </>
          ) : null}
          {band.parts.map((id) => (
            <g key={id} transform={`translate(${PART_LOCAL[id].u[0]} ${PART_LOCAL[id].v[0]})`}>
              <DeviceFront id={id} cabled />
            </g>
          ))}
        </g>
      ))}
      {Array.from({ length: SPARE_U }, (_, i) => (
        <BlankPanel key={i} y={spareTop + i * U} />
      ))}
      <PatchCords />
    </>
  );
}

/** Every front-face LED of the rack in rack-local units. */
export function RackFrontLeds({ pairs, ...opts }: DeviceLedProps & { pairs: readonly Pair[] }) {
  return (
    <>
      {RACK_DEVICE_IDS.map((id) => (
        <g key={id} transform={`translate(${PART_LOCAL[id].u[0]} ${PART_LOCAL[id].v[0]})`}>
          <DeviceLeds id={id} r2={ledPairs(pairs, id)} {...opts} />
        </g>
      ))}
    </>
  );
}

/** Body colour of each device seen from the side (room side panel, 3D side faces). */
export const SIDE_TONE: Record<RackDeviceId, string> = {
  "switch-5": "#22262a",
  "switch-8": "#1f2226",
  pve1: "#141619",
  pve2: "#141619",
  pve3: "#141619",
  pve4: "#2a2e33",
  pi: "#1f6b3a",
  zima: "#8d9399",
  nas: "#181b1e",
  pdu: "#111315",
};

/**
 * Right side of the rack in side-local units (x = depth from the front,
 * 0..D; y = v, 0..H): the device silhouettes and shelf lines seen through
 * the side, without the frame or tint.
 */
export function RackSideDevices() {
  return (
    <>
      {SLOT_BANDS.filter((b) => b.shelf).map((b) => (
        <rect key={b.v[0]} x={1} y={b.v[1] - 0.8} width={D - 4} height={0.8} fill="#202326" />
      ))}
      {RACK_DEVICE_IDS.map((id) => {
        const p = PART_LOCAL[id];
        return (
          <rect
            key={id}
            x={p.d[0]}
            y={p.v[0]}
            width={p.d[1] - p.d[0]}
            height={p.v[1] - p.v[0]}
            rx={id === "pi" ? 0 : 0.6}
            fill={SIDE_TONE[id]}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.3}
          />
        );
      })}
    </>
  );
}
