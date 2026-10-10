/**
 * SVG #2, the lit layer (spec 04 section 9.1 steps 26 to 32): wall wash and
 * picture lights, window lights, the lamp glow, floor pools, glowing cables
 * and packets (all inside the #lab-occlude mask), then the firewall alert,
 * the CRT screen, phone screen, vinyl, rack devices and the power-up tags.
 *
 * Server-compatible and deterministic. Initial state: every [data-lights]
 * group (except "myrack", whose [data-unit] children fade instead),
 * [data-pool], [data-cable], [data-tag], packet and alert at opacity 0.
 * `lit` renders the fully lit end state; `stillPackets` freezes three packets
 * mid-flight for the landing still.
 */

import { INITIAL_VIEWBOX } from "@/components/lab/contracts";
import { faceTop } from "@/lib/iso";
import { LightDefs } from "./objects/Defs";
import { PictureLight, WALL_A_LEN, WALL_B_LEN, WallWash, wallATransform, wallBTransform } from "./objects/Shell";
import { SetupFloorLights, SetupLights } from "./objects/Setup";
import { WindowLights } from "./objects/WindowView";
import { LightStripLights } from "./objects/LightStrip";
import { FirewallAlert, LitCables, Packets, StillPackets } from "./objects/Cables";
import { DeskLights, STILL_BAR_SCALE } from "./objects/Desk";
import { DeskItemsLights } from "./objects/DeskItems";
import { RackLights, RackTags } from "./objects/Rack";
import { CERT_U, CERT_V, MAP, POOLS, POSTER, PRINT } from "./config";
import type { RoomArtRenderProps } from "./RoomBase";

export function RoomLights({
  lit = false,
  viewBox = INITIAL_VIEWBOX,
  stillPackets = false,
}: RoomArtRenderProps & { stillPackets?: boolean }) {
  const o = lit ? 1 : 0;
  return (
    <svg
      data-cam=""
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full [will-change:transform]"
      aria-hidden
    >
      <LightDefs />
      <g mask="url(#lab-occlude)">
        <g data-lights="room" opacity={o}>
          <g transform={wallATransform}>
            <WallWash len={WALL_A_LEN} />
            <PictureLight cx={PRINT.u + PRINT.w / 2} top={PRINT.v} />
            <PictureLight cx={MAP.u + MAP.w / 2} top={MAP.v} />
            <WindowLights />
          </g>
          <g transform={wallBTransform}>
            <WallWash len={WALL_B_LEN} />
            {CERT_U.map((u) => (
              <PictureLight key={u} cx={u + 18} top={CERT_V} />
            ))}
            <PictureLight cx={POSTER.u + POSTER.w / 2} top={POSTER.v} />
          </g>
          <LightStripLights />
          <SetupFloorLights />
        </g>
        {POOLS.map((p, i) => (
          <g key={i} data-toggle-light={i === 0 ? "floor-lamp" : undefined} data-pool={p.group} opacity={o} transform={faceTop(p.x - p.r, p.y - p.r, 0)}>
            <circle cx={p.r} cy={p.r} r={p.r} fill={`url(#lab-pool-${p.color})`} />
          </g>
        ))}
        <LitCables lit={lit} />
        <Packets />
        {stillPackets ? <StillPackets /> : null}
      </g>
      <FirewallAlert />
      <g data-lights="desk" opacity={o}>
        <SetupLights />
        <DeskLights counter={stillPackets ? "1" : "0"} barScale={stillPackets ? STILL_BAR_SCALE : undefined} />
      </g>
      <g data-lights="deskitems" opacity={o}>
        <DeskItemsLights />
      </g>
      <g data-lights="record" opacity={o}>

      </g>
      <RackLights lit={lit} />
      <RackTags />
    </svg>
  );
}
