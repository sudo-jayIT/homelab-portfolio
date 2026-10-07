/**
 * /dev/work: preview of Projects, Websites and Experience on the classic page
 * base (the flat Mint Terminal background; the grid and rain belong to the
 * chrome). Sections are rendered directly so other areas' in-progress files
 * cannot break this page. Websites is rendered even while it is switched off
 * in site.ts, under a dev-only label, so it can still be checked before being
 * re-enabled.
 */

import { Experience } from "@/components/sections/Experience";
import { Projects } from "@/components/sections/Projects";
import { Websites } from "@/components/sections/Websites";
import { isSectionEnabled } from "@/content";

export const metadata = { title: "dev · work" };

export default function DevWork() {
  const websitesOn = isSectionEnabled("websites");
  return (
    <main>
      <div className="relative z-10 overflow-clip bg-background">
        <div className="relative">
          <Projects />
          {/* Stand-in for the homelab section between projects and the next section. */}
          <div className="h-24 border-t border-line" aria-hidden="true" />
          {websitesOn ? null : (
            <p data-dev-disabled="websites" className="px-6 pt-6 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-gray-2">
              websites: disabled in site.ts (preview only)
            </p>
          )}
          <Websites />
          <Experience />
        </div>
      </div>
    </main>
  );
}
