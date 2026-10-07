import type { Vec2, Vec3 } from "./iso";

/** Y70 envelope, in centimetres: depth × width × height, with a cut front corner. */
export const PC_CASE = { depth: 47, width: 32, height: 47, corner: 8 } as const;
export type PcProjection = (point: Vec3) => Vec2;
export const PC_FOOTPRINT: Vec2[] = [
  [0, 0], [PC_CASE.depth - PC_CASE.corner, 0],
  [PC_CASE.depth, PC_CASE.corner], [PC_CASE.depth, PC_CASE.width], [0, PC_CASE.width],
];

/** A single orthographic camera for every face in the component explorer. */
export function pcInspectorProjection(): PcProjection {
  const yaw = 40 * Math.PI / 180;
  const pitch = 12 * Math.PI / 180;
  const raw = ([u, v, z]: Vec3): Vec2 => [
    u * Math.cos(yaw) + v * Math.sin(yaw),
    (u * Math.sin(yaw) - v * Math.cos(yaw)) * Math.sin(pitch) - z * Math.cos(pitch),
  ];
  const points = PC_FOOTPRINT.flatMap(([u, v]) => [raw([u, v, -1.5]), raw([u, v, PC_CASE.height])]);
  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxY = Math.max(...points.map(([, y]) => y));
  const scale = Math.min(408 / (maxX - minX), 444 / (maxY - minY));
  return (point) => {
    const [x, y] = raw(point);
    return [230 + (x - (minX + maxX) / 2) * scale, 250 + (y - (minY + maxY) / 2) * scale];
  };
}

/** Project a real planar face, preserving the same basis as the surrounding shell. */
export function pcFace(project: PcProjection, origin: Vec3, across: Vec3, down: Vec3): string {
  const [x, y] = project(origin);
  const u = project(origin.map((n, i) => n + across[i]) as Vec3);
  const v = project(origin.map((n, i) => n + down[i]) as Vec3);
  return `matrix(${u[0] - x} ${u[1] - y} ${v[0] - x} ${v[1] - y} ${x} ${y})`;
}

export function pcPoints(project: PcProjection, points: Vec3[]): string {
  return points.map((p) => project(p).join(",")).join(" ");
}
