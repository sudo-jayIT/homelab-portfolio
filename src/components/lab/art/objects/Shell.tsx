/**
 * Room shell: floor slab, planks, rug and the two back walls (spec 04
 * section 9.1 steps 2 to 6), plus the wall wash light strips of the lit layer.
 */

import { LED } from "@/components/lab/contracts";
import { faceLeft, faceRight, faceTop } from "@/lib/iso";
import { IsoBox } from "../primitives";
import { SHELL, TONES } from "../config";

const FLOOR_W = SHELL.x1 - SHELL.x0; // 430, along x (parallel to wall A)
const FLOOR_D = SHELL.y1 - SHELL.y0; // 350, along y
/** Steps 2 to 6: slab, planks, rug, wall A, wall B. */
export function Shell() {
  const { x0, y0, x1, y1, h, t, slab } = SHELL;
  return (
    <>
      <IsoBox x={x0 - t} y={y0 - t} z={-slab} w={x1 - x0 + t} d={y1 - y0 + t} h={slab} tone={TONES.slab} rim={false} />
      <g transform={faceTop(x0, y0, 0)}>
        <rect width={FLOOR_W} height={FLOOR_D} fill="#8c7e78" />
        <defs><pattern id="lab-carpet" width={11.4} height={11.1} patternUnits="userSpaceOnUse"><circle cx={3} cy={3} r={0.65} fill="#afa097" opacity={0.22} /><circle cx={8} cy={8} r={0.65} fill="#605a57" opacity={0.22} /></pattern></defs>
        <rect width={FLOOR_W} height={FLOOR_D} fill="url(#lab-carpet)" />
      </g>
      <IsoBox x={x0 - t} y={y0 - t} z={0} w={x1 - x0 + t} d={t} h={h} tone={TONES.wallA} rim={false} />
      <IsoBox x={x0 - t} y={y0} z={0} w={t} d={y1 - y0} h={h} tone={TONES.wallB} rim={false} />
      {/* Cutaway view of the attic's angled ceiling above the workstation. */}
      <g transform={wallATransform}>
        <path d={`M275 0H${FLOOR_W}V94Z`} fill="#b8afa1" />
        <path d={`M275 0L${FLOOR_W} 94`} stroke="#d3cabe" strokeWidth={1.4} />
      </g>
      <g transform={wallBTransform}>
        <path d="M0 0H138L0 85Z" fill="#b5aca0" />
        <path d="M0 85L138 0" stroke="#d3cabe" strokeWidth={1.2} />
      </g>
    </>
  );
}

/** Warm wash band and LED strip just above a baseboard (wall-local, length `len`). */
export function WallWash({ len }: { len: number }) {
  return (
    <>
      <rect y={SHELL.h - 16} width={len} height={11} fill={LED.warm} opacity={0.05} />
      <rect y={SHELL.h - 5.6} width={len} height={0.7} fill={LED.warm} opacity={0.55} />
    </>
  );
}

/** Picture light: a small fixture bar above a frame and a soft white glow below it. */
export function PictureLight({ cx, top }: { cx: number; top: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={top + 10} rx={20} ry={14} fill="url(#lab-glow-white)" opacity={0.28} />
      <rect x={cx - 7} y={top - 3} width={14} height={1.6} rx={0.8} fill="#2b2f33" />
    </g>
  );
}

export const wallATransform = faceLeft(SHELL.x0, SHELL.y0, SHELL.h);
export const wallBTransform = faceRight(SHELL.x0, SHELL.y1, SHELL.h);
export const WALL_A_LEN = FLOOR_W;
export const WALL_B_LEN = FLOOR_D;
