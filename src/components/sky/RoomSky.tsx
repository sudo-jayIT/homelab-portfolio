/**
 * Room view background (docs/theme/b.md section 4): fixed, full viewport, the
 * same rain as the classic page in its "room" mode (full width, dimmed inside
 * an ellipse around the room), the two packets and the top wash. Hidden by
 * default and shown only under html[data-view="room"] (rules in base.css);
 * the rain loop runs only while the room view shows. Must render BEFORE
 * section#hero in <main>, because everything after #hero is hidden in room
 * view. Server component; only RainField hydrates.
 *
 * The flat base is a class rather than a style prop, so a re-render can never
 * touch the variables SkyMotion writes to this element.
 */

import { RainField } from "./RainField";
import { SkyPackets } from "./SkyPackets";

export function RoomSky() {
  return (
    <div
      aria-hidden
      data-room-sky=""
      data-sky-vars=""
      className="pointer-events-none fixed inset-0 overflow-hidden bg-background"
      style={{ position: "fixed", inset: 0 }}
    >
      {/* Inline position/size (not just the Tailwind classes) on this chain is
       * load-bearing, not decoration: confirmed 2026-10-07 that utility
       * classes can silently go missing from a production build (a Next/
       * Tailwind pipeline issue, tracked separately — see globals.css). When
       * that happens this canvas falls into normal document flow with no
       * height constraint, its ResizeObserver reacts to its OWN size change,
       * and it doubles every tick until the tab crashes (reproduced on iOS
       * Safari). Do not remove these styles even if the Tailwind bug is
       * fixed upstream — they're a deliberate second line of defense. */}
      <div className="sky-rain par absolute -inset-x-3 inset-y-0" style={{ position: "absolute", top: 0, bottom: 0, left: -12, right: -12 }}>
        <RainField mode="room" className="absolute inset-0 h-full w-full" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      </div>
      <SkyPackets />
      <div className="sky-wash absolute inset-0" style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
