/**
 * Classic view background layer (docs/theme/b.md section 4): a sticky,
 * viewport-tall box inside the classic wrapper's absolute layer, carrying
 * data-sky-vars so the parallax variables cascade to its layers:
 *
 *   div.sky-rain.par    canvas glyph rain, pointer parallax only (--d 6, --s 0)
 *   SkyPackets          two drifting packets
 *   div.sky-wash        faint mint lift at the top, soft floor at the bottom
 *
 * The page grid is a separate, page-tall layer (SkyGrid in ClassicShell).
 * Server component; only RainField hydrates. No React style prop on the
 * data-sky-vars element: SkyMotion writes --px/--py/--sy imperatively.
 */

import { RainField } from "./RainField";
import { SkyPackets } from "./SkyPackets";

export function ClassicSky() {
  return (
    <div data-sky-vars="" className="sticky top-0 h-lvh overflow-hidden" style={{ position: "sticky", top: 0, height: "100lvh", overflow: "hidden" }}>
      {/* See RoomSky.tsx for why the inline styles here are load-bearing. */}
      <div className="sky-rain par absolute -inset-x-3 inset-y-0" style={{ position: "absolute", top: 0, bottom: 0, left: -12, right: -12 }}>
        <RainField className="absolute inset-0 h-full w-full" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      </div>
      <SkyPackets />
      <div className="sky-wash absolute inset-0" style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
