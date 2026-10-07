/**
 * Classic view wrapper (spec 02 sections 2.1, 2.3 and 4.3; background per
 * docs/theme/b.md section 4). Server component.
 *
 *   div.relative.z-10.overflow-clip.bg-background  flat near-black base
 *     SkyGrid                                      page-tall 1px grid with pinging nodes
 *     div.pointer-events-none.absolute.inset-0     holds the sticky ClassicSky (rain, packets, wash)
 *     div.relative                                 landing hero + the enabled sections (children)
 *     RainDivider                                  last child, directly above the footer wrapper
 *
 * overflow-clip (not overflow-hidden) is load-bearing: clip does not create a
 * scroll container, so the sticky layer inside keeps working.
 */

import type { ReactNode } from "react";
import { ClassicSky } from "@/components/sky/ClassicSky";
import { SkyGrid } from "@/components/sky/SkyGrid";
import { RainDivider } from "./RainDivider";

export function ClassicShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 overflow-clip bg-background">
      <SkyGrid />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <ClassicSky />
      </div>
      <div className="relative">{children}</div>
      <RainDivider />
    </div>
  );
}
