/**
 * Room art configuration (spec 04 sections 3 and 9.1): material tones, object
 * placements in world units, cables, floor pools, packets and the occlusion
 * hulls shared by the lights layer. Everything here is plain data so the art
 * components, the hotspots and the ambient loops agree on one geometry.
 *
 * World units are roughly centimetres (see src/lib/iso.ts). Wall-local
 * coordinates: wall A is the plane y = 440 (u runs +x from 430, v runs down
 * from the top at z = 180); wall B is the plane x = 430 (u runs from y = 790
 * toward the corner at y = 440, v runs down from the top).
 */

import { ROOM_SHELL, type CableId, type LedColor, type PoolGroup, type Vec3 } from "@/components/lab/contracts";
import { labBox, labPoint } from "@/lib/lab-placement";
import { PC_CASE } from "@/lib/pc-geometry";
import { boxHull, onLeft, onRight, screenLength } from "@/lib/iso";
import { D as RACK_D, H as RACK_H, PART_LOCAL, TF as RACK_TF, U as RACK_UNIT, W as RACK_W } from "@/lib/rack";

export type Tone = { top: string; left: string; right: string };

/** IsoBox face tones (spec 04 section 3.2). */
export const TONES = {
  chassis: { top: "#1c232a", left: "#12181e", right: "#0c1014" },
  wood: { top: "#aa8056", left: "#725036", right: "#59402d" },
  metal: { top: "#3b444d", left: "#272e35", right: "#1c2127" },
  plastic: { top: "#191e23", left: "#101418", right: "#0b0e11" },
  putty: { top: "#a39b86", left: "#8a8371", right: "#6c665a" },
  puttyDark: { top: "#8a8371", left: "#736d5e", right: "#5a554a" },
  fabric: { top: "#22262c", left: "#181b20", right: "#121418" },
  slab: { top: "#1a1511", left: "#2a221b", right: "#211a14" },
  wallA: { top: "#8d8b87", left: "#747873", right: "#848881" },
  wallB: { top: "#b7aea1", left: "#a59d91", right: "#8d867e" },
  rackFoot: { top: "#2a2e33", left: "#16181b", right: "#101214" },
  recordWood: { top: "#3a2a1d", left: "#2c2016", right: "#21180f" },
  plinth: { top: "#17181b", left: "#3a2a1d", right: "#2c2016" },
  pot: { top: "#3d2c21", left: "#34251b", right: "#271b14" },
  sill: { top: "#343a41", left: "#22272c", right: "#1b1f23" },
  phone: { top: "#0b0c0d", left: "#1a1c1f", right: "#131517" },
  spotBracket: { top: "#2a2e33", left: "#1a1d20", right: "#131518" },
  spotHead: { top: "#23272b", left: "#15181b", right: "#0e1012" },
} satisfies Record<string, Tone>;

/** Faint mint edge highlight on rimmed boxes. */
export const RIM = { side: "rgba(160,255,230,0.08)", top: "rgba(160,255,230,0.15)", width: 0.6 } as const;

export const PUTTY = "#e6d9b5";
/**
 * Power-up callout tags (RackTags) are a HUD overlay, not part of the scene,
 * so they use the UI accent (mint #3dfc9a, text in mint-head #d4ffe8 on the
 * page base) while the room art keeps its own palette.
 */
export const TAG_LINE = "#3dfc9a";
export const TAG_TEXT = "#d4ffe8";
export const TAG_FILL = "rgba(5,8,7,0.9)";
export const PHOSPHOR = "#ffb347";
export const PHOSPHOR_DIM = "rgba(255,179,71,0.45)";
export const PACKET_CORE = "#ecfdf5";
export const FRAME = "#0c0d0e";

export const SHELL = ROOM_SHELL;

/* ------------------------------------------------------------------------ */
/* Walls and wall-mounted frames                                             */
/* ------------------------------------------------------------------------ */

/** Wall-local to world mappers (same planes as faceLeft/faceRight on the walls). */
export const wallA = onLeft(430, 440, 180);
export const wallB = onRight(430, 790, 180);

export interface Frame {
  u: number;
  v: number;
  w: number;
  h: number;
}

export const PRINT: Frame = { u: 260, v: 27, w: 48, h: 72 };
export const MAP: Frame = { u: 344, v: 36, w: 80, h: 46 };
/** Window opening (the clip box); the recess is 3.5 larger on every side. */
export const WINDOW: Frame = { u: 116, v: 20, w: 132, h: 96 };
export const POSTER: Frame = { u: 22, v: 36, w: 64, h: 64 };
export const OUTLET: Frame = { u: 40, v: 156, w: 9, h: 11 };
/** Four certificate frames on wall B, in wall order (cert-1..cert-4). */
export const CERT_U = [182, 224, 266, 308] as const;
export const CERT_V = 34;
export const CERT_W = 36;
export const CERT_H = 28;

/* ------------------------------------------------------------------------ */
/* Furniture placements                                                      */
/* ------------------------------------------------------------------------ */

export const LAMP = { x: 445, y: 455, base: 2.4, pole: { x: 452, y: 462, w: 3, top: 88 }, shade: { x: 452, y: 462, z0: 94, z1: 110, r0: 12, r1: 8.5 } } as const;

export const DESK = { x: 546, y: 460, w: 260, d: 92, legH: 60, top: 5, z: 65 } as const;

export const CRT = {
  riser: [640, 485, 65, 38, 25, 2],
  rear: [656, 491, 67, 4, 4, 15],
  bezel: [600, 500, 78, 118, 4, 50],
} as const;
/** Bezel front face: faceLeft(568, 514, 130), local 72 x 62. */
export const CRT_FACE = { x: 600, y: 504, z: 128, w: 118, h: 50 } as const;
export const crtFront = onLeft(CRT_FACE.x, CRT_FACE.y, CRT_FACE.z);

export const KEYBOARD = { x: 629, y: 522, z: 65, w: 58, d: 19, h: 2.4 } as const;
export const CUBE = { x: 564, y: 526, z: 65, w: 9, d: 9, h: 11 } as const;

/** Flat desk items (top-face rects at desk height). */
export const RESUME = { x: 770, y: 512, w: 30, d: 39, rot: -7 } as const;
export const BADGE = { x: 549, y: 533, w: 13, d: 17 } as const;
export const PHONE = { x: 710, y: 530, w: 11, d: 20, h: 1.2 } as const;
export const BALL = { x: 780, y: 485, z: 77.6, r: 12.6, seed: 19 } as const;

export const RECORD_CAB = { x: 810, y: 446, z: 6, w: 56, d: 42, h: 34, feet: 6 } as const;
/** Turntable plinth top (deck) height. */
export const DECK_Z = 46;
export const PLINTH = { x: 815, y: 451, z: 40, w: 46, d: 33, h: 6 } as const;
/** Platter centre on the deck face (local), and in world units. */
export const PLATTER = { u: 15, v: 16.5, r: 14.3 } as const;

export const PLANT = { x: 548, y: 468, z: DESK.z, w: 22, d: 22, h: 20 } as const;

export const PC = { x: 759, y: 514, z: 1.5, w: PC_CASE.depth, d: PC_CASE.width, h: PC_CASE.height } as const;

export const CHAIR = { x: 665, y: 607 } as const;

/* ------------------------------------------------------------------------ */
/* Rack: the owner's 12U 10-inch rack, on the wood-topped cabinet                 */
/* ------------------------------------------------------------------------ */

/** Cabinet footprint; the compact rack sits on its right side beside the UPS. */
export const RACK_SPOT = { x: 458, y: 620, w: 105, d: 62 } as const;
/** Wood-topped workstation with three full-width drawers below the homelab. */
export const LAB_WORKSTATION = { bodyH: 60, topH: 4, surfaceZ: 64 } as const;
/** Side hardware geometry is shared by the art and clickable polygons. */
export const UPS = { x: RACK_SPOT.x - 21, y: RACK_SPOT.y + 12, z: LAB_WORKSTATION.surfaceZ, w: 23, d: 37, h: 42 } as const;
export const FIREWALL = { x: RACK_SPOT.x + 7, y: RACK_SPOT.y + 15, z: LAB_WORKSTATION.surfaceZ, w: 9, d: 31, h: 40 } as const;
/** Height of the rack's feet. */
export const RACK_FEET = 3;

/** Faces are authored in a W x D x H local box (src/lib/rack.tsx) and drawn scaled by S. */
export const RACK_LOCAL = { W: RACK_W, D: RACK_D, H: RACK_H, S: 0.46, TF: RACK_TF, U: RACK_UNIT } as const;

export const RACK = (() => {
  const { W, D, H, S } = RACK_LOCAL;
  const w = S * W;
  const d = S * D;
  const h = S * H;
  const x = RACK_SPOT.x + (RACK_SPOT.w - w) / 2;
  const y = RACK_SPOT.y + (RACK_SPOT.d - d) / 2;
  const z = LAB_WORKSTATION.surfaceZ + RACK_FEET;
  return { x, y, z, w, d, h, top: z + h };
})();

/** Height of the two carry handles above the rack top. */
export const RACK_HANDLE_H = 8.64;

/** Front face (plane y = RACK.y + RACK.d) local to world, already scaled. */
export const rackFront = (u: number, v: number): Vec3 =>
  labPoint(onLeft(RACK.x, RACK.y + RACK.d, RACK.top)(RACK_LOCAL.S * u, RACK_LOCAL.S * v));
/** Side panel (plane x = RACK.x + RACK.w) local to world, already scaled. */
export const rackSide = (u: number, v: number): Vec3 =>
  labPoint(onRight(RACK.x + RACK.w, RACK.y + RACK.d, RACK.top)(RACK_LOCAL.S * u, RACK_LOCAL.S * v));

/** Rack part local extents (u across the front, v down, d from the front toward the back). */
export const RACK_PART_LOCAL = PART_LOCAL;

/** Wall spotlight above the rack (on wall B). */
const placedRack = labBox(RACK);
export const SPOT = {
  bracket: [430, placedRack.y + placedRack.d / 2 - 2, 163, 6, 4, 2.6],
  head: [434, placedRack.y + placedRack.d / 2 - 3.5, 156, 8, 7, 8],
  /** Lens point the beam and its gradient start from. */
  lens: [438, placedRack.y + placedRack.d / 2, 159] as Vec3,
} as const;

/* ------------------------------------------------------------------------ */
/* Cables, packets, pools                                                    */
/* ------------------------------------------------------------------------ */

export const CABLES: Record<CableId, { pts: Vec3[]; color: LedColor }> = {
  /** Wall outlet on wall B, down to the floor, along the baseboard, into the rack cabinet. */
  wan: {
    pts: [
      [431, 745.5, 17],
      [431, 745.5, 1.5],
      [434, 745.5, 0],
      [434, 652, 0],
      [470, 652, 0],
    ],
    color: "cyan",
  },
  /** From behind the cabinet, along both walls to the desk, then up the wall to desk height. */
  desk: {
    pts: [
      [470, 630, 0],
      [437, 630, 0],
      [437, 444, 0],
      [604, 444, 0],
      [604, 444, 66],
    ],
    color: "amber",
  },
};

/** Screen lengths of the cable polylines (wan 196.64, desk 596.64). */
export const CABLE_LEN: Record<CableId, number> = {
  wan: screenLength(CABLES.wan.pts),
  desk: screenLength(CABLES.desk.pts),
};

/** Where the blocked packet dies (mid baseboard run) and its fraction of the WAN path (about 0.48). */
export const BLOCKED_AT: Vec3 = [434, 694, 0];
export const BLOCKED_FRACTION = screenLength([...CABLES.wan.pts.slice(0, 3), BLOCKED_AT]) / CABLE_LEN.wan;

export interface PacketDef {
  cable: CableId;
  dir: 1 | -1;
  color: LedColor;
  /** Fraction along the path used for the static still (lit render). */
  still: number;
}

export const PACKETS: PacketDef[] = [
  { cable: "wan", dir: 1, color: "white", still: 0.53 },
  { cable: "wan", dir: -1, color: "cyan", still: -1 },
  { cable: "desk", dir: 1, color: "amber", still: 0.34 },
  { cable: "desk", dir: -1, color: "cyan", still: 0.5 },
];

export const POOLS: { group: PoolGroup; x: number; y: number; r: number; color: LedColor }[] = [
  { group: "room", x: 456, y: 468, r: 95, color: "warm" },
  { group: "room", x: 714, y: 520, r: 120, color: "blue" },
  { group: "desk", x: 596, y: 572, r: 95, color: "amber" },
  { group: "myrack", x: 494, y: 652, r: 105, color: "cyan" },
];

/**
 * Foreground hulls cut out of the lights layer (mask #lab-occlude) so pools,
 * wall wash, cables and packets never paint over furniture.
 */
export const OCCLUDERS: Vec3[][] = [
  boxHull(LAMP.x, LAMP.y, 0, 14, 14, LAMP.base),
  boxHull(LAMP.pole.x, LAMP.pole.y, 0, LAMP.pole.w, LAMP.pole.w, LAMP.pole.top),
  boxHull(DESK.x, DESK.y, DESK.z - DESK.top, DESK.w, DESK.d, DESK.top),
  boxHull(550, 479, 0, 34, 61, 58),
  ...[596, 741].flatMap((x) => [boxHull(x - 4, 465, 0, 14, 83, 4), boxHull(x, 496, 4, 8, 11, 56)]),
  boxHull(PC.x, PC.y, PC.z, PC.w, PC.d, PC.h),
  boxHull(CRT_FACE.x, 485, 65, CRT_FACE.w, 25, CRT_FACE.z - 65),
  boxHull(430, 642, 0, RACK_SPOT.d + 10, RACK_SPOT.w + 29, LAB_WORKSTATION.surfaceZ),
  boxHull(placedRack.x, placedRack.y, 0, placedRack.w, placedRack.d, RACK.top + RACK_HANDLE_H),
  boxHull(CHAIR.x - 18, CHAIR.y - 18, 42, 36, 36, 7),
  boxHull(CHAIR.x - 17, CHAIR.y + 13, 49, 34, 5, 48),
  boxHull(CHAIR.x - 2, CHAIR.y - 2, 4, 4, 4, 38),
  ...[CHAIR.x - 23, CHAIR.x + 19].flatMap((x) => [boxHull(x, CHAIR.y - 9, 44, 3, 3, 14), boxHull(x - 2, CHAIR.y - 13, 58, 7, 30, 3)]),
];

/**
 * Seeds for deterministic detail. The rack seed sets the LED blink rates and
 * phases and the desk seed the CRT bar heights, so both match the reference
 * timing exactly; the rubber band ball uses its own seed (spec 04 step 18).
 */
export const SEEDS = { rack: 83, desk: 41, ball: BALL.seed } as const;
