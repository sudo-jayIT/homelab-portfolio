/**
 * The 23 room hotspots (spec 05 section 8) derived from the art geometry in
 * ./config and the rack layout in src/lib/rack.tsx, so the polygons always
 * match the drawn objects.
 *
 * Every non-rack hotspot has a face (origin, width-axis end, height-axis end
 * of the flat surface its focus panel lifts off). Hint markers sit at the face
 * centre, or at the polygon bbox centre for the rack. Tooltip anchors are the
 * polygon bbox top centre (or bottom centre when the object is near the top
 * of the screen); TIP_ANCHORS precomputes both.
 *
 * DOM (tab) order: certificates, poster, print, map, monitor, resume, badge,
 * phone, record, rack, then the rack devices top to bottom. Later polygons
 * sit on top, so the rack parts win over the rack hull. Each device's polygon
 * covers its whole slot band on the rack front (split between devices that
 * share a shelf), so even 1U parts are comfortable targets.
 */

import {
  CERT_IDS,
  MARKED,
  RACK_DEVICE_IDS,
  type Face3,
  type Hotspot,
  type HotspotId,
  type PartBox,
  type RackPartId,
  type Vec2,
  type Vec3,
} from "@/components/lab/contracts";
import { CREDENTIALS, HOMELAB, ROOM_CONTENT } from "@/content";
import { boxHull, faceRect, iso, pointsBounds, pts, r2 } from "@/lib/iso";
import { labBox, labPoint } from "@/lib/lab-placement";
import { hitArea } from "@/lib/rack";
import {
  BADGE,
  CERT_H,
  CERT_U,
  CERT_V,
  CERT_W,
  CRT_FACE,
  DESK,
  FIREWALL,
  LAMP,
  MAP,
  PHONE,
  PC,
  POSTER,
  PRINT,
  RACK,
  RACK_HANDLE_H,
  RACK_LOCAL,
  RACK_PART_LOCAL,
  RESUME,
  UPS,
  crtFront,
  rackFront,
  wallA,
  wallB,
  type Frame,
} from "./config";

type Draft = Omit<Hotspot, "marker">;

/** Face of a rect on a wall-like mapper: origin, u end, v end. */
function frameFace(map: (u: number, v: number) => Vec3, f: Frame): Face3 {
  return [map(f.u, f.v), map(f.u + f.w, f.v), map(f.u, f.v + f.h)];
}

function framePoints(map: (u: number, v: number) => Vec3, f: Frame): string {
  return faceRect(map, f.u, f.v, f.u + f.w, f.v + f.h);
}

/** Polygon of a desk item: its top rect padded by `pad`, lifted to z + 2. */
function padded(item: { x: number; y: number; w: number; d: number }, pad: number): string {
  const z = DESK.z + 2;
  return pts([
    [item.x - pad, item.y - pad, z],
    [item.x + item.w + pad, item.y - pad, z],
    [item.x + item.w + pad, item.y + item.d + pad, z],
    [item.x - pad, item.y + item.d + pad, z],
  ]);
}

/** Flat top face of a desk item at height z. */
function flatFace(item: { x: number; y: number; w: number; d: number }, z: number): Face3 {
  return [
    [item.x, item.y, z],
    [item.x + item.w, item.y, z],
    [item.x, item.y + item.d, z],
  ];
}

/** The resume's top sheet is rotated about its centre; its face follows. */
function resumeFace(): Face3 {
  const { x, y, w, d, rot } = RESUME;
  const a = (rot * Math.PI) / 180;
  const map = (u: number, v: number): Vec3 => {
    const du = u - w / 2;
    const dv = v - d / 2;
    return [x + w / 2 + du * Math.cos(a) - dv * Math.sin(a), y + d / 2 + du * Math.sin(a) + dv * Math.cos(a), DESK.z + 0.2];
  };
  return [map(0, 0), map(w, 0), map(0, d)];
}

/* ------------------------------------------------------------------------ */
/* Rack parts                                                                */
/* ------------------------------------------------------------------------ */

/** World boxes of the rack parts (poseOf and the inspector's scene pose). */
export const RACK_PART_BOXES: Record<RackPartId, PartBox> = Object.fromEntries(
  (Object.keys(RACK_PART_LOCAL) as RackPartId[]).map((id) => {
    const t = RACK_PART_LOCAL[id];
    const S = RACK_LOCAL.S;
    return [
      id,
      labBox({
        x: r2(RACK.x + S * t.u[0]),
        y: r2(RACK.y + RACK.d - S * t.d[1]),
        z: r2(RACK.top - S * t.v[1]),
        w: r2(S * (t.u[1] - t.u[0])),
        d: r2(S * (t.d[1] - t.d[0])),
        h: r2(S * (t.v[1] - t.v[0])),
      }),
    ];
  }),
) as Record<RackPartId, PartBox>;

const frontRect = (u0: number, v0: number, u1: number, v1: number) => faceRect(rackFront, u0, v0, u1, v1);

/* ------------------------------------------------------------------------ */
/* Drafts in DOM order                                                       */
/* ------------------------------------------------------------------------ */

const certs: Draft[] = CERT_IDS.map((slot, i) => {
  const cred = CREDENTIALS.find((c) => c.wall.slot === slot);
  const f: Frame = { u: CERT_U[i], v: CERT_V, w: CERT_W, h: CERT_H };
  return {
    id: slot,
    title: cred?.label ?? `Certificate ${i + 1}`,
    tip: cred?.tip ?? `Certificate ${i + 1}`,
    points: framePoints(wallB, f),
    face: frameFace(wallB, f),
  };
});

const parts = HOMELAB.parts;

const DRAFTS: Draft[] = [
  ...([588, 733] as const).map((x): Draft => ({
    id: x === 588 ? "light-left" : "light-right",
    title: x === 588 ? "Toggle left desk light" : "Toggle right desk light",
    tip: "Toggle desk light",
    points: pts(boxHull(x - 3, 477, 123, 18, 7, 35)),
  })),
  { id: "floor-lamp", title: "Toggle floor lamp", tip: "Toggle floor lamp", points: pts(boxHull(LAMP.x - 6, LAMP.y - 6, 90, 26, 26, 25)) },
  { id: "ambient", title: "Toggle purple desk lighting", tip: "Toggle purple lighting", points: pts(boxHull(724, 544, 56, 24, 8, 8)) },
  ...certs,
  {
    id: "poster",
    title: ROOM_CONTENT.poster.caption.split(",")[0] + " poster",
    tip: ROOM_CONTENT.poster.tip,
    points: framePoints(wallB, POSTER),
    face: frameFace(wallB, POSTER),
  },
  {
    id: "print",
    title: ROOM_CONTENT.print.title,
    tip: ROOM_CONTENT.print.tip,
    points: framePoints(wallA, PRINT),
    face: frameFace(wallA, PRINT),
  },
  {
    id: "map",
    title: "Homelab: network map",
    tip: "Network map",
    points: framePoints(wallA, MAP),
    face: frameFace(wallA, MAP),
  },
  {
    id: "monitor",
    title: "Projects: ultrawide workstation",
    tip: "Projects",
    points: faceRect(crtFront, 0, 0, CRT_FACE.w, CRT_FACE.h),
    face: [crtFront(0, 0), crtFront(CRT_FACE.w, 0), crtFront(0, CRT_FACE.h)],
  },
  {
    id: "resume",
    title: "Resume",
    tip: "Resume",
    points: padded(RESUME, 4),
    face: resumeFace(),
  },
  {
    id: "badge",
    title: "Experience: work badge",
    tip: "Experience",
    points: padded(BADGE, 5),
    face: flatFace(BADGE, DESK.z + 0.3),
  },
  {
    id: "phone",
    title: "Contact: phone",
    tip: "Contact",
    points: padded(PHONE, 5),
    face: flatFace(PHONE, DESK.z + PHONE.h + 0.05),
  },
  {
    id: "pc",
    title: "Desktop PC: HYTE Y70 Touch",
    tip: "Desktop PC specs",
    points: pts(boxHull(PC.x, PC.y, PC.z, PC.w, PC.d, PC.h)),
    face: [[PC.x, PC.y + PC.d, PC.z + PC.h], [PC.x + PC.w, PC.y + PC.d, PC.z + PC.h], [PC.x, PC.y + PC.d, PC.z]],
  },
  {
    id: "rack",
    title: parts.rack.title,
    tip: parts.rack.tip,
    points: pts(boxHull(labBox(RACK).x, labBox(RACK).y, 0, RACK.d, RACK.w, RACK.top + RACK_HANDLE_H)),
  },
  ...RACK_DEVICE_IDS.map((id): Draft => {
    const { u, v } = hitArea(id);
    return { id, title: parts[id].title, tip: parts[id].tip, points: frontRect(u[0], v[0], u[1], v[1]) };
  }),
  ...([
    { id: "ups", title: "CyberPower 1500VA UPS", tip: "1500VA UPS", box: UPS },
    { id: "firewall", title: "HP t730: OPNsense firewall", tip: "OPNsense · HP t730", box: FIREWALL },
  ] as const).map(({ id, title, tip, box }): Draft => ({
    id,
    title,
    tip,
    points: pts(boxHull(labBox(box).x, labBox(box).y, box.z, box.d, box.w, box.h)),
    face: [
      labPoint([box.x, box.y + box.d, box.z + box.h]),
      labPoint([box.x + box.w, box.y + box.d, box.z + box.h]),
      labPoint([box.x, box.y + box.d, box.z]),
    ],
  })),
];

/** Marker anchor: centre of the face (midpoint of its u end and v end), else the bbox centre. */
function markerAt(h: Draft): Vec2 {
  if (h.face) {
    const [, u, v] = h.face;
    const [x, y] = iso((u[0] + v[0]) / 2, (u[1] + v[1]) / 2, (u[2] + v[2]) / 2);
    return [r2(x), r2(y)];
  }
  const b = pointsBounds(h.points);
  return [r2(b.x + b.w / 2), r2(b.y + b.h / 2)];
}

/** All 23 hotspots in DOM (tab) order. */
export const HOTSPOTS: Hotspot[] = DRAFTS.map((h) => ({ ...h, marker: markerAt(h) }));

export const HOTSPOT: Record<HotspotId, Hotspot> = Object.fromEntries(HOTSPOTS.map((h) => [h.id, h])) as Record<
  HotspotId,
  Hotspot
>;

/** The 8 hint markers in MARKED order (marker i gets animation-delay 0.43s * i). */
export const MARKERS: { id: HotspotId; at: Vec2 }[] = MARKED.map((id) => ({ id, at: HOTSPOT[id].marker! }));

/** Polygon bbox plus the tooltip anchors (top centre and bottom centre), in SVG user units. */
export const TIP_ANCHORS: Record<HotspotId, { x: number; y: number; w: number; h: number; top: Vec2; bottom: Vec2 }> =
  Object.fromEntries(
    HOTSPOTS.map((h) => {
      const b = pointsBounds(h.points);
      const cx = r2(b.x + b.w / 2);
      return [h.id, { ...b, top: [cx, r2(b.y)] as Vec2, bottom: [cx, r2(b.y + b.h)] as Vec2 }];
    }),
  ) as Record<HotspotId, { x: number; y: number; w: number; h: number; top: Vec2; bottom: Vec2 }>;
