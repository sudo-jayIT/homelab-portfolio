/**
 * Home route: final page composition (spec 02 section 2.1, spec 03 section 2.1).
 *
 * Order matters for the CSS view switch: the room sky must precede #hero, and
 * everything after #hero inside <main> is hidden in room view
 * (`html[data-view="room"] #hero ~ *`). The footer sits outside <main> in a
 * [data-classic] wrapper (hidden in room view by its own rule).
 *
 * The classic sections follow SECTION_ORDER (src/content/site.ts), so a
 * section switched off there is simply not rendered.
 */

import type { ComponentType } from "react";
import { ClassicShell } from "@/components/chrome/ClassicShell";
import { Footer } from "@/components/chrome/Footer";
import { Header } from "@/components/chrome/Header";
import { LandingHero } from "@/components/hero/LandingHero";
import { RoomBase } from "@/components/lab/art/RoomBase";
import { RoomLights } from "@/components/lab/art/RoomLights";
import { LabHero } from "@/components/lab/LabHero";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Homelab } from "@/components/sections/Homelab";
import { Projects } from "@/components/sections/Projects";
import { Websites } from "@/components/sections/Websites";
import { Writeups } from "@/components/sections/Writeups";
import { RoomSky } from "@/components/sky/RoomSky";
import { SkyMotion } from "@/components/sky/SkyMotion";
import { SECTION_ORDER, type SectionId } from "@/content";

const SECTION_COMPONENTS: Record<SectionId, ComponentType> = {
  projects: Projects,
  homelab: Homelab,
  writeups: Writeups,
  websites: Websites,
  experience: Experience,
  about: About,
  contact: Contact,
};

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <SkyMotion />
        <RoomSky />
        <LabHero base={<RoomBase />} lights={<RoomLights />} />
        <ClassicShell>
          <LandingHero />
          {SECTION_ORDER.map((id) => {
            const Section = SECTION_COMPONENTS[id];
            return <Section key={id} />;
          })}
        </ClassicShell>
      </main>
      <Footer />
    </>
  );
}
