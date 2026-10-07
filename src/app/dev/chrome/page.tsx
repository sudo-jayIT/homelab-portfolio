/**
 * /dev/chrome: B1 preview. Same composition as the home route, with neutral
 * placeholder sections sized like the original at 1440 and 390 so the
 * background (grid, rain, packets), scrollspy, rain divider and footer behave
 * as on the real page. See DevControls
 * for the query params (?view=room, ?attr=lab-intro, ?bare).
 */

import { ClassicShell } from "@/components/chrome/ClassicShell";
import { Footer } from "@/components/chrome/Footer";
import { Header } from "@/components/chrome/Header";
import { RoomSky } from "@/components/sky/RoomSky";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SECTION_ORDER, SECTIONS } from "@/content/site";
import type { SectionId } from "@/content/types";
import { cn } from "@/lib/cn";
import { DevControls } from "./DevControls";

/**
 * Body filler per section: [mobile, desktop] section heights of the original.
 * Only the sections enabled in SECTION_DEFS (SECTION_ORDER) are rendered.
 */
const FILL: Record<SectionId, string> = {
  projects: "min-h-[2275px] md:min-h-[1245px]",
  homelab: "min-h-[2873px] md:min-h-[1712px]",
  websites: "min-h-[1914px] md:min-h-[1368px]",
  experience: "min-h-[1778px] md:min-h-[1251px]",
  about: "min-h-[2808px] md:min-h-[1507px]",
  contact: "min-h-[783px] md:min-h-[680px]",
};

export default function ChromePreview() {
  return (
    <>
      <Header />
      <main>
        <RoomSky />
        <section id="hero" className="relative flex items-center justify-center font-mono text-xs text-white/40">
          room view placeholder
        </section>
        <ClassicShell>
          <section className="flex min-h-[1018px] items-center justify-center px-6 font-mono text-xs text-white/40 md:min-h-[774px]">
            landing placeholder
          </section>
          {SECTION_ORDER.map((id) => {
            const s = SECTIONS[id];
            return (
              <section
                key={id}
                id={id}
                data-sec={s.accent}
                className={cn("py-24 md:py-32 px-6", s.borderTop && "border-t border-line", FILL[id])}
              >
                <div className={cn("mx-auto", s.container === "4xl" ? "max-w-4xl" : "max-w-6xl")}>
                  <SectionHeading index={s.index} kicker={s.kicker} title={s.title} />
                </div>
              </section>
            );
          })}
        </ClassicShell>
      </main>
      <Footer />
      <DevControls />
    </>
  );
}
