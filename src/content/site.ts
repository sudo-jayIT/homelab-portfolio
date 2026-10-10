/**
 * Site identity, section toggles, navigation, section headings and footer.
 *
 * SECTION_DEFS is the one switchboard for the page: set `enabled: false` to
 * hide a section from the page, the header nav, the footer, the terminal
 * (`open`, `nmap`) and the room CRT. Index numbers ("01.", "02.", ...) and
 * the first section's missing top border follow the enabled order, so no
 * other file needs editing.
 */

import type {
  FooterContent,
  NavItem,
  SectionDef,
  SectionId,
  SectionMeta,
  SiteChrome,
  SiteIdentity,
} from "./types";

export const SITE: SiteIdentity = {
  name: "Kris Green",
  initials: "KG",
  role: "Cybersecurity & DevSecOps",
  title: "Kris Green | Cybersecurity & DevSecOps",
  description:
    "Kris Green is a cybersecurity student at the University of Richmond and a DevSecOps intern who runs a 4-node Proxmox homelab. Step inside the lab.",
  location: "Richmond, VA",
  // DRAFT: placeholder origin until the site has its real domain.
  url: "https://kris-green.example",
  domain: "kris-green.example",
  ogAlt: "Kris Green, cybersecurity and DevSecOps, on a dark grid with mint terminal glyphs",
  email: "krisgreen305@gmail.com",
  // LinkedIn vanity name (linkedin.com/in/<handle>); the Contact link is built from it.
  handle: "kris-green-4815a938a",
  resumeUrl: "/resume.pdf",
  resumeFileName: "Kris_Green_Resume.pdf",
  host: "homelab",
};

/**
 * Every section in page order. `enabled` is the toggle; everything else in
 * this file is derived from it.
 */
export const SECTION_DEFS: SectionDef[] = [
  { id: "projects", enabled: true, label: "Projects", room: "monitor", accent: "signal", kicker: "Work", title: "Projects", container: "6xl", footer: true },
  { id: "homelab", enabled: true, label: "Homelab", room: "rack", accent: "dusk", kicker: "Self-hosted", title: "Homelab", container: "6xl", footer: true },
  // Write-ups: holds 5 real entries (see writeups.ts / docs/writeups). Ready to
  // show — flip `enabled: true` after a clean CT126 build. Review the sanitized
  // security entries (and fix their open items) before the site goes public.
  { id: "writeups", enabled: true, label: "Write-ups", room: "monitor", accent: "beacon", kicker: "CTF", title: "Write-ups", container: "6xl", footer: true },
  // Client work: no client sites are listed yet, so the section is off. The
  // content (websites.ts) and the component stay ready to switch back on.
  { id: "websites", enabled: false, label: "Websites", room: "monitor", accent: "sodium", kicker: "Client Work", title: "Websites for Business", container: "6xl", footer: true },
  { id: "experience", enabled: true, label: "Experience", room: "badge", accent: "beacon", kicker: "Background", title: "Experience", container: "6xl", footer: true },
  { id: "about", enabled: true, label: "About", room: "resume", accent: "dusk", kicker: "Story", title: "About", container: "6xl", footer: true },
  { id: "contact", enabled: true, label: "Contact", room: "phone", accent: "signal", kicker: "Connect", title: "Contact", container: "4xl", footer: true },
];

/** Enabled sections, in page order. */
export const ENABLED_SECTIONS: SectionDef[] = SECTION_DEFS.filter((s) => s.enabled);

/** Section order on the page (enabled only). */
export const SECTION_ORDER: SectionId[] = ENABLED_SECTIONS.map((s) => s.id);

export function isSectionEnabled(id: SectionId): boolean {
  return SECTION_ORDER.includes(id);
}

/** "01", "02", ... by enabled position; "--" when the section is off. */
export function sectionIndex(id: SectionId): string {
  const at = SECTION_ORDER.indexOf(id);
  return at === -1 ? "--" : String(at + 1).padStart(2, "0");
}

/** Header nav, in display order, with the room hotspot each item opens in room view. */
export const NAV: NavItem[] = ENABLED_SECTIONS.map((s) => ({
  id: s.id,
  href: `#${s.id}`,
  label: s.label,
  room: s.room,
}));

export const CHROME: SiteChrome = {
  monogram: SITE.initials,
  monogramAriaLabel: `${SITE.name}, back to top`,
  resumeHref: SITE.resumeUrl,
  resumeLabel: "Resume ↗",
  nav: NAV,
};

/** Section headings (generic labels). Ledes live with each area's content. */
export const SECTIONS = Object.fromEntries(
  SECTION_DEFS.map((s): [SectionId, SectionMeta] => [
    s.id,
    {
      id: s.id,
      accent: s.accent,
      index: sectionIndex(s.id),
      kicker: s.kicker,
      title: s.title,
      container: s.container,
      borderTop: SECTION_ORDER[0] !== s.id,
      enabled: s.enabled,
    },
  ]),
) as Record<SectionId, SectionMeta>;

export const FOOTER: FooterContent = {
  // DRAFT: built from resume facts; edit freely.
  blurb:
    "Cybersecurity student and DevSecOps intern in Richmond, VA. I run a Proxmox homelab and lead the UR Cybersecurity Club.",
  navLinks: ENABLED_SECTIONS.filter((s) => s.footer).map((s) => ({ href: `#${s.id}` as const, label: s.label })),
  copyrightName: SITE.name,
  // DRAFT: availability status, confirm or change.
  statusText: "Open to opportunities",
};
