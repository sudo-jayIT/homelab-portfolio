/** Turn the lab workstation 90 degrees so its front faces across the room. */
import { A, B, faceLeft, faceRight, iso, matrixString, pathD, type Vec3 } from "./iso";
import type { PartBox } from "@/components/lab/contracts";

export const labPoint = ([x, y, z]: Vec3): Vec3 => [430 + y - 615, 775 - (x - 430), z];
export const labBox = (b: PartBox): PartBox => ({ x: 430 + b.y - 615, y: 775 - (b.x + b.w - 430), z: b.z, w: b.d, d: b.w, h: b.h });
export const labLeft = (x: number, y: number, z: number) => faceRight(...labPoint([x, y, z]));
export const labRight = (x: number, y: number, z: number) => `${faceLeft(...labPoint([x, y, z]))} scale(-1 1)`;
export const labTop = (x: number, y: number, z: number) => {
  const [sx, sy] = iso(...labPoint([x, y, z]));
  return matrixString([A, -B, A, B, sx, sy]);
};
export const labIso = (x: number, y: number, z: number) => iso(...labPoint([x, y, z]));
export const labPath = (points: Vec3[]) => pathD(points.map(labPoint));
