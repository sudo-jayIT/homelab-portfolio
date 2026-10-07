/**
 * SVG #1, the static room art (spec 04 section 9.1 steps 1 to 25).
 * Server-compatible: no hooks, no "use client", deterministic markup. page.tsx
 * renders it once and passes it into LabHero as the `base` prop.
 *
 * Every furniture group carries [data-base] and starts at opacity 0.42 (dark
 * room); the engine fades them to 1 when the room powers up. `lit` renders the
 * end state directly (used by the landing still render).
 */

import { INITIAL_VIEWBOX, type RoomArtProps } from "@/components/lab/contracts";
import { iso, r2 } from "@/lib/iso";
import { BaseDefs } from "./objects/Defs";
import { Shell, wallATransform, wallBTransform } from "./objects/Shell";
import { WindowBars, WindowView } from "./objects/WindowView";
import {
  Certificates,
  FramedPrint,
  NetworkMap,
  Outlet,
  Poster,
  WallABaseboard,
  WallBBaseboard,
} from "./objects/WallArt";
import { Lamp, LampShadow } from "./objects/Lamp";
import { CableBeds } from "./objects/Cables";
import { DeskBase } from "./objects/Desk";
import { DeskItemsBase } from "./objects/DeskItems";
import { RackBase } from "./objects/Rack";
import { Chair } from "./objects/Chair";
import { IsoBox } from "./primitives";
import { LabCabinet, LabSideHardware, RackSetup } from "./objects/Setup";
import { TONES, WINDOW } from "./config";

export interface RoomArtRenderProps extends RoomArtProps {
  /** viewBox override (the still render frames the room with its own box). */
  viewBox?: string;
}

const [haloX, haloY] = iso(645, 615, 0);

export function RoomBase({ lit = false, viewBox = INITIAL_VIEWBOX }: RoomArtRenderProps) {
  const o = lit ? 1 : 0.42;
  return (
    <svg
      data-cam=""
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <BaseDefs />
      <ellipse cx={r2(haloX)} cy={r2(haloY)} rx={720} ry={420} fill="url(#lab-halo)" />
      <g data-base="room" opacity={o}>
        <Shell />
        <g transform={wallATransform}>
          <WallABaseboard />
          <rect x={WINDOW.u - 3.5} y={WINDOW.v - 3.5} width={WINDOW.w + 7} height={WINDOW.h + 7} fill="#0b0d0f" />
          <WindowView />
          <WindowBars />
          <FramedPrint />
          <NetworkMap />
        </g>
        <IsoBox x={544} y={440} z={61} w={142} d={6} h={3} tone={TONES.sill} rim={false} />
        <g transform={wallBTransform}>
          <WallBBaseboard />
          <Certificates />
          <Poster />
          <Outlet />
        </g>
        <LampShadow />
      </g>
      <CableBeds />
      <g data-base="room" opacity={o}>
        <Lamp />
      </g>
      <g data-base="desk" opacity={o}>
        <DeskBase />
      </g>
      <g data-base="deskitems" opacity={o}>
        <DeskItemsBase />
      </g>
      <g data-base="record" opacity={o}>

      </g>
      <g data-base="myrack" opacity={o}>
        <LabCabinet />
        <RackBase />
        <RackSetup />
        <LabSideHardware />
      </g>
      <g data-base="room" opacity={o}>
        <Chair />
      </g>
    </svg>
  );
}
