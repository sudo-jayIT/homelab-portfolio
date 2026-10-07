/**
 * /dev/hero: the landing hero in isolation (B2). Mirrors the page structure
 * the view switch relies on: a section#hero (here a dev stub) followed by the
 * classic wrapper on the flat page base, so the door's enterRoom() hides the
 * landing exactly like on "/" and the stub can flip back to replay the
 * entrance. Below the hero, the name fit readout recommends per-line
 * font-stretch values for src/content/hero.ts.
 */

import { LandingHero } from "@/components/hero/LandingHero";
import { NameFit } from "./NameFit";
import { RoomStub } from "./RoomStub";

export default function HeroDev() {
  return (
    <main>
      <section id="hero" className="relative">
        <RoomStub />
      </section>
      <div className="relative z-10 overflow-clip bg-background">
        <div className="relative">
          <LandingHero />
          <NameFit />
          <div id="projects" className="h-[80svh] border-t border-line" />
          <div id="contact" className="h-[40svh]" />
        </div>
      </div>
    </main>
  );
}
