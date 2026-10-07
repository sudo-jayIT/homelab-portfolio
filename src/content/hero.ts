/**
 * Landing hero content (spec 03 section 8).
 *
 * Name lines: each line is set at its own Archivo width (font-stretch, the
 * wdth axis, 62 to 125) so the word's natural advance width lands just under
 * the name block width; `justify-content: space-between` absorbs the rest.
 * The ratio does not depend on the block size (the font size is a fixed
 * fraction of the block, 29.7619cqw), so one value per line works at every
 * viewport. After changing a line's text, open /dev/hero: its "name fit"
 * readout measures every line and prints the largest fontStretch that fits.
 */

import type { LandingHeroContent } from "./types";
import { SITE } from "./site";
import { ROOM_STILL_SRC } from "./room-still";

export const HERO: LandingHeroContent = {
  prompt: { user: "guest", host: SITE.host, path: "~", command: "whoami" },
  name: {
    full: SITE.name,
    lines: [
      { text: "KRIS", fontStretch: 125 },
      { text: "GREEN", fontStretch: 85 },
    ],
  },
  // DRAFT: role line and one-sentence description, built from resume facts.
  roles: ["Cybersecurity", "DevSecOps", "Cloud & Homelab"],
  description:
    "I study cybersecurity at the University of Richmond, work as a DevSecOps intern, and run a Proxmox homelab.",
  ctas: [
    { label: "View projects ↓", href: "#projects", variant: "light" },
    { label: "Get in touch", href: "#contact", variant: "dark" },
  ],
  door: {
    src: ROOM_STILL_SRC,
    width: 1700,
    height: 1460,
    alt: "My room: a 10-inch homelab rack, standing desk, ultrawide monitor and HYTE PC",
    ariaLabel: "Step inside my room",
    keyLabel: "step inside →",
    parallaxDepth: 18,
    scrollFactor: -0.04,
    sizes: "(max-width: 1024px) 92vw, 40rem",
  },
};
