/**
 * Isometric projection used by the room scene (spec 04, section 2.2).
 *
 * World units are roughly centimetres. +x runs screen right and down, +y runs
 * screen left and down, +z runs straight up. One world unit is scaled by K.
 *
 *   iso(x, y, z) = [800 + (x - y) * A, 40 + (x + y) * B - z * K]
 *   A = K * cos(30deg) = 1.14315, B = K / 2 = 0.66
 */

export type Vec2 = [x: number, y: number];
export type Vec3 = [x: number, y: number, z: number];
/** A world point whose z defaults to 0. */
export type WorldPoint = [x: number, y: number, z?: number];

export const K = 1.32;
export const A = K * Math.cos(Math.PI / 6);
export const B = K / 2;
export const ORIGIN_X = 800;
export const ORIGIN_Y = 40;

/** Round to 2 decimals (all emitted SVG numbers use this). */
export const r2 = (n: number): number => Math.round(n * 100) / 100;

/** Project a world point to SVG user units. */
export function iso(x: number, y: number, z = 0): Vec2 {
  return [ORIGIN_X + (x - y) * A, ORIGIN_Y + (x + y) * B - z * K];
}

/** Project a list of world points into an SVG `points` attribute string. */
export function pts(points: readonly WorldPoint[]): string {
  return points
    .map(([x, y, z]) => {
      const [sx, sy] = iso(x, y, z ?? 0);
      return `${r2(sx)},${r2(sy)}`;
    })
    .join(" ");
}

/** Project a polyline of world points into an SVG path `d` string (M ... L ...). */
export function pathD(points: readonly WorldPoint[]): string {
  return points
    .map(([x, y, z], i) => {
      const [sx, sy] = iso(x, y, z ?? 0);
      return `${i ? "L" : "M"}${r2(sx)} ${r2(sy)}`;
    })
    .join(" ");
}

/** Length in SVG user units of a projected polyline (used for packet speeds). */
export function screenLength(points: readonly WorldPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = iso(points[i - 1][0], points[i - 1][1], points[i - 1][2] ?? 0);
    const [bx, by] = iso(points[i][0], points[i][1], points[i][2] ?? 0);
    total += Math.hypot(bx - ax, by - ay);
  }
  return total;
}

/**
 * Affine face matrices. Each maps local (u, v) coordinates drawn inside a
 * <g transform> onto a plane of the world:
 *
 * faceTop(x0, y0, z0):   (u, v) -> (x0 + u, y0 + v, z0)   horizontal plane
 * faceLeft(x0, y0, z0):  (u, v) -> (x0 + u, y0, z0 - v)   plane y = y0, faces +y
 * faceRight(x0, y0, z0): (u, v) -> (x0, y0 - u, z0 - v)   plane x = x0, faces +x
 *
 * The *M variants return the six numbers [a, b, c, d, e, f]; the plain variants
 * return the SVG `matrix(...)` string with entries rounded to 2 decimals.
 */
export type Matrix = [a: number, b: number, c: number, d: number, e: number, f: number];

export function faceTopM(x0: number, y0: number, z0: number): Matrix {
  const [e, f] = iso(x0, y0, z0);
  return [A, B, -A, B, e, f];
}
export function faceLeftM(x0: number, y0: number, z0: number): Matrix {
  const [e, f] = iso(x0, y0, z0);
  return [A, B, 0, K, e, f];
}
export function faceRightM(x0: number, y0: number, z0: number): Matrix {
  const [e, f] = iso(x0, y0, z0);
  return [A, -B, 0, K, e, f];
}

export const matrixString = (m: Matrix): string => `matrix(${m.map(r2).join(" ")})`;

export const faceTop = (x0: number, y0: number, z0: number): string => matrixString(faceTopM(x0, y0, z0));
export const faceLeft = (x0: number, y0: number, z0: number): string => matrixString(faceLeftM(x0, y0, z0));
export const faceRight = (x0: number, y0: number, z0: number): string => matrixString(faceRightM(x0, y0, z0));

/** Local-to-world mappers matching the face matrices (for hotspot faces and hulls). */
export const onTop = (x0: number, y0: number, z0: number) => (u: number, v: number): Vec3 => [x0 + u, y0 + v, z0];
export const onLeft = (x0: number, y0: number, z0: number) => (u: number, v: number): Vec3 => [x0 + u, y0, z0 - v];
export const onRight = (x0: number, y0: number, z0: number) => (u: number, v: number): Vec3 => [x0, y0 - u, z0 - v];

/** Polygon points of a local rect (u0..u1, v0..v1) on a face, via one of the on* mappers. */
export function faceRect(
  map: (u: number, v: number) => Vec3,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
): string {
  return pts([map(u0, v0), map(u1, v0), map(u1, v1), map(u0, v1)]);
}

/**
 * The 6-point silhouette of a world box (x, y, z) sized (w, d, h), in drawing
 * order: top-back-left, top-back-right, bottom-back-right, bottom-front-right,
 * bottom-front-left, top-front-left. Used for hotspot polygons and occlusion.
 */
export function boxHull(x: number, y: number, z: number, w: number, d: number, h: number): Vec3[] {
  return [
    [x, y, z + h],
    [x + w, y, z + h],
    [x + w, y, z],
    [x + w, y + d, z],
    [x, y + d, z],
    [x, y + d, z + h],
  ];
}

/** Screen ellipse radii of a world circle of radius r lying on a horizontal plane. */
export function floorEllipse(r: number): { rx: number; ry: number } {
  return { rx: 1.2247 * r * K, ry: 0.7071 * r * K };
}

/** Screen-space bounding box of projected world points. */
export function screenBounds(points: readonly WorldPoint[]): { x: number; y: number; w: number; h: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y, z] of points) {
    const [sx, sy] = iso(x, y, z ?? 0);
    minX = Math.min(minX, sx);
    minY = Math.min(minY, sy);
    maxX = Math.max(maxX, sx);
    maxY = Math.max(maxY, sy);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Parse an SVG `points` string back into numbers (for hotspot bboxes). */
export function parsePoints(points: string): Vec2[] {
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return [x, y] as Vec2;
    });
}

/** Bounding box of an SVG `points` string. */
export function pointsBounds(points: string): { x: number; y: number; w: number; h: number } {
  const list = parsePoints(points);
  const xs = list.map((p) => p[0]);
  const ys = list.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
