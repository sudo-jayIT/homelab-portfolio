/**
 * Camera math for the room view (spec 01 section 4.4, spec 05 section 4.1).
 *
 * The camera is a viewBox `{x, y, w, h}` in room SVG user units that every
 * svg[data-cam] shares. All helpers here are pure; the engine
 * (src/components/lab/useRoomCamera.ts) owns the live camera object and the
 * DOM measurements.
 *
 * Coordinate spaces:
 *   units     room SVG user units (the iso projection output)
 *   element   CSS px inside the svg[data-cam] box (which bleeds past the hero)
 *   section   CSS px inside section#hero; element = section - (ox, oy)
 */

import { iso, type Vec3 } from "@/lib/iso";

/** A viewBox in SVG user units. */
export interface Cam {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A rectangle (units or px depending on context). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Layout measurements, refreshed before every camera move.
 * hl/ht/hw/hh: section rect in viewport px. ew/eh: svg element size in px.
 * ox/oy: svg element offset inside the section with the wrapper's GSAP
 * parallax translate removed (so it is stable while the parallax eases).
 */
export interface Metrics {
  hl: number;
  ht: number;
  hw: number;
  hh: number;
  ew: number;
  eh: number;
  ox: number;
  oy: number;
}

/** A 2D affine matrix [a, b, c, d, e, f] as used by CSS matrix(). */
export type Affine = [number, number, number, number, number, number];

export const IDENTITY: Affine = [1, 0, 0, 1, 0, 0];

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * Put unit point (cx, cy) at element pixel (px, py) with `scale` px per unit.
 * ew/eh are the svg element size, so the result keeps the element aspect and
 * preserveAspectRatio "meet" never letterboxes.
 */
export function place(cx: number, cy: number, scale: number, px: number, py: number, ew: number, eh: number): Cam {
  return { x: cx - px / scale, y: cy - py / scale, w: ew / scale, h: eh / scale };
}

/** Fit `bounds` (units) into `rect` (element px), contained and centred. */
export function fit(bounds: Box, rect: Box, ew: number, eh: number): Cam {
  const s = Math.min(rect.w / bounds.w, rect.h / bounds.h);
  return place(bounds.x + bounds.w / 2, bounds.y + bounds.h / 2, s, rect.x + rect.w / 2, rect.y + rect.h / 2, ew, eh);
}

/** px per unit of a camera on an element `ew` px wide. */
export const scaleOf = (cam: Cam, ew: number): number => ew / cam.w;

/** viewBox attribute string (2 decimals). */
export const viewBoxString = (c: Cam): string => `${c.x.toFixed(2)} ${c.y.toFixed(2)} ${c.w.toFixed(2)} ${c.h.toFixed(2)}`;

export const isFiniteCam = (c: Cam): boolean =>
  [c.x, c.y, c.w, c.h].every(Number.isFinite) && c.w > 0 && c.h > 0;

/** A world point projected to element px under camera `cam`. */
export function toScreen(p: Vec3 | readonly [number, number, number?], cam: Cam, ew: number): [number, number] {
  const [ux, uy] = iso(p[0], p[1], p[2] ?? 0);
  const s = ew / cam.w;
  return [(ux - cam.x) * s, (uy - cam.y) * s];
}

/**
 * Pan clamp: keep the room from leaving the screen. The margin is in screen px
 * and converted to units; bounds swap when the view is larger than the room.
 */
export function clampPan(v: Cam, room: Box, ew: number, marginPx = 24): Cam {
  const m = (marginPx * v.w) / ew;
  const axis = (pos: number, size: number, r0: number, rSize: number) => {
    const lo = r0 - m;
    const hi = r0 + rSize + m - size;
    return clamp(pos, Math.min(lo, hi), Math.max(lo, hi));
  };
  return { x: axis(v.x, v.w, room.x, room.w), y: axis(v.y, v.h, room.y, room.h), w: v.w, h: v.h };
}

/** Element-to-section offset applied to a rect given in section px. */
export const sectionToElement = (r: Box, m: Metrics): Box => ({ x: r.x - m.ox, y: r.y - m.oy, w: r.w, h: r.h });

/** Viewport rect (client px) to element px. */
export const clientToElement = (r: Box, m: Metrics): Box => ({
  x: r.x - m.hl - m.ox,
  y: r.y - m.ht - m.oy,
  w: r.w,
  h: r.h,
});

/** Element-wise linear interpolation of two equal-length number arrays. */
export function lerpAffine(a: Affine, b: Affine, t: number): Affine {
  return a.map((v, i) => v + (b[i] - v) * t) as Affine;
}

/** CSS matrix() string with 5 decimals. */
export const cssMatrix = (m: Affine): string => `matrix(${m.map((n) => n.toFixed(5)).join(",")})`;

/**
 * The lift matrix: maps an element of size box.w x box.h (whose untransformed
 * top-left is at box.x, box.y in section px) onto the parallelogram spanned by
 * a world face [origin, width end, height end] under camera `cam`.
 * transform-origin must be top left.
 */
export function faceAffine(face: readonly Vec3[], cam: Cam, m: Metrics, box: Box): Affine {
  const [o, u, v] = face.map((p) => {
    const [sx, sy] = toScreen(p, cam, m.ew);
    return [sx + m.ox - box.x, sy + m.oy - box.y] as const;
  });
  return [(u[0] - o[0]) / box.w, (u[1] - o[1]) / box.w, (v[0] - o[0]) / box.h, (v[1] - o[1]) / box.h, o[0], o[1]];
}
