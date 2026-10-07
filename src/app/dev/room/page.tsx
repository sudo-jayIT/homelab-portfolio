/**
 * /dev/room: the room engine (B4) in isolation. LabHero with the real art
 * (B3), forced into room view. Query flags: ?intro=1 replays the first-visit
 * intro, ?classic=1 starts on the page with a stand-in door. Everything after
 * #hero (the dev panel) is hidden in room view by the base.css view switch.
 */

import { STILL } from "@/components/lab/contracts";
import { RoomBase } from "@/components/lab/art/RoomBase";
import { RoomLights } from "@/components/lab/art/RoomLights";
import { LabHero } from "@/components/lab/LabHero";
import { RoomSky } from "@/components/sky/RoomSky";
import { DevDoor, DevRoomBoot } from "./DevRoom";

export default function DevRoomPage() {
  return (
    <main>
      <RoomSky />
      <DevRoomBoot />
      <LabHero base={<RoomBase />} lights={<RoomLights />} />
      <section className="relative mx-auto grid min-h-[100svh] max-w-6xl items-center gap-10 px-6 py-24 font-mono text-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-mint">dev · room engine</p>
          <p className="text-gray-1">Click the still to step inside. Esc or ↙ step outside shrinks the room back onto it.</p>
          <ul className="space-y-2 text-gray-2">
            <li>
              <a className="underline decoration-line-strong underline-offset-4" href="/dev/room">
                /dev/room
              </a>{" "}
              · live room at the step-in framing
            </li>
            <li>
              <a className="underline decoration-line-strong underline-offset-4" href="/dev/room?intro=1">
                /dev/room?intro=1
              </a>{" "}
              · first-visit intro
            </li>
            <li>
              <a className="underline decoration-line-strong underline-offset-4" href="/dev/room?classic=1">
                /dev/room?classic=1
              </a>{" "}
              · start here, on the page
            </li>
          </ul>
        </div>
        <DevDoor src={STILL.src} />
      </section>
    </main>
  );
}
