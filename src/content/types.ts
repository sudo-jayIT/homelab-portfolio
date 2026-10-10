/**
 * Content model for every area. Shapes follow section 8 of each
 * reverse-engineering spec. Counts and approximate string lengths are noted
 * so replacement content keeps the layout.
 */

import type {
  BootPartId,
  CertHotspotId,
  RackPartId,
} from "@/components/lab/contracts";

/* ------------------------------------------------------------------------ */
/* Site and chrome (spec 02)                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Every section the page knows how to render. Which ones show, and in what
 * order, is decided by SECTION_DEFS in site.ts (the `enabled` toggles).
 */
export type SectionId = "projects" | "homelab" | "writeups" | "websites" | "experience" | "about" | "contact";

export type Accent = "signal" | "dusk" | "beacon" | "sodium";

/** Hotspot a header nav item opens while in room view. */
export type RoomTarget = "monitor" | "rack" | "badge" | "resume" | "phone";

export interface NavItem {
  id: SectionId;
  href: `#${SectionId}`;
  label: string;
  room: RoomTarget;
}

export interface SiteIdentity {
  /** Full display name. */
  name: string;
  /** Two uppercase letters for the keycap monogram. */
  initials: string;
  /** Short role used in the metadata title. */
  role: string;
  /** <title>: "{name} | {role}". */
  title: string;
  /** Metadata, OG and Twitter description (~150 to 170 chars). */
  description: string;
  /** "City, ST" (~11 chars). */
  location: string;
  /** Canonical origin used as metadataBase. */
  url: string;
  /** Bare domain shown by the terminal nmap report. */
  domain: string;
  /** OG / Twitter image alt (~48 to 64 chars). */
  ogAlt: string;
  email: string;
  /** Lowercase handle without "@" (LinkedIn vanity name). */
  handle: string;
  resumeUrl: string;
  /** Suggested file name for the resume Download button. */
  resumeFileName: string;
  /** Terminal host name in the prompt ("guest@{host}:~$"). */
  host: string;
}

export interface SiteChrome {
  monogram: string;
  monogramAriaLabel: string;
  resumeHref: string;
  resumeLabel: string;
  nav: NavItem[];
}

/**
 * One section definition (site.ts SECTION_DEFS). Flip `enabled` to remove a
 * section from the page, the header nav, the footer, the terminal and the
 * room CRT; index numbers follow the enabled order.
 */
export interface SectionDef {
  id: SectionId;
  enabled: boolean;
  /** Header nav and footer label. */
  label: string;
  /** Hotspot the header link opens in room view. */
  room: RoomTarget;
  accent: Accent;
  /** 1 to 2 words (rendered uppercase). */
  kicker: string;
  /** 1 to 3 words (rendered uppercase). */
  title: string;
  /** Contact uses 4xl, everything else 6xl. */
  container: "6xl" | "4xl";
  /** Listed in the footer's Navigation column. */
  footer: boolean;
}

export interface SectionMeta {
  id: SectionId;
  accent: Accent;
  /** "01", "02", ... in enabled order; "--" for a disabled section. */
  index: string;
  /** 1 to 2 words (rendered uppercase). */
  kicker: string;
  /** 1 to 3 words (rendered uppercase). */
  title: string;
  /** Contact uses 4xl, everything else 6xl. */
  container: "6xl" | "4xl";
  /** False only for the first enabled section. */
  borderTop: boolean;
  enabled: boolean;
}

export interface FooterContent {
  /** ~116 to 120 chars, wraps to 4 lines at 220px. */
  blurb: string;
  /** Enabled sections flagged `footer` in SECTION_DEFS. */
  navLinks: { href: `#${SectionId}`; label: string }[];
  copyrightName: string;
  statusText: string;
}

/* ------------------------------------------------------------------------ */
/* Landing hero (spec 03)                                                    */
/* ------------------------------------------------------------------------ */

export interface LandingHeroContent {
  prompt: { user: string; host: string; path: string; command: string };
  name: {
    /** sr-only full name. */
    full: string;
    /** 2 lines; fontStretch in [62, 125] tuned so each line fills the block width. */
    lines: { text: string; fontStretch: number }[];
  };
  /** 3 short role phrases joined with " · ". */
  roles: string[];
  /** One sentence, about 110 to 130 chars. */
  description: string;
  ctas: { label: string; href: `#${SectionId}`; variant: "light" | "dark" }[];
  door: {
    src: string;
    width: number;
    height: number;
    /** ~47 chars naming the rack, the desk and the CRT. */
    alt: string;
    ariaLabel: string;
    keyLabel: string;
    parallaxDepth: number;
    scrollFactor: number;
    sizes: string;
  };
}

/* ------------------------------------------------------------------------ */
/* Intro terminal (spec 01)                                                  */
/* ------------------------------------------------------------------------ */

export interface IntroContent {
  hostname: string;
  tty: string;
  /** "Debian GNU/Linux 13 {hostname} {tty}" */
  distroLine: string;
  /** ~80 chars, uname -a style. */
  kernelLine: string;
  /** Bolded at the start of the banner intro line (login screen after a logout). */
  ownerName: string;
  /** Follows the bold name (~50 chars). */
  bannerTagline: string;
  /**
   * One banner row per HOMELAB_HOSTS row that has a banner text (7 today; the
   * idle pve4 is left out): unit up to 9 chars (padded to 11), short at most
   * 29 chars so each row stays on one line at 390 px. 7 rows match the
   * original, which put the login prompt at y 587.9.
   */
  services: { unit: string; short: string }[];
  defaultUser: "guest";
}

export interface TerminalCommandSpec {
  name: string;
  /** 9 to 33 chars. */
  help: string;
  aliases?: string[];
  /** Only listed in help on the login screen (boot). */
  introOnly?: boolean;
}

export interface NmapPort {
  port: string;
  state: "open" | "filtered";
  service: string;
  /** Section the service button scrolls to; null for filtered rows. */
  target: SectionId | null;
}

/**
 * The Debian package the first-visit intro installs with
 * `sudo apt install {name}` (and that the shell reports as already installed).
 * Sizes are display strings in apt's own format ("4,812 kB", "17.9 MB").
 */
export interface PortfolioPackage {
  /** Package name, e.g. "kris-portfolio". */
  name: string;
  /** Upstream version as apt prints it ("1.0.0"). */
  version: string;
  /** Repository URI on the Get line ("http://apt.homelab.lan"). */
  repo: string;
  /** "{suite}/{component}" on the Get line ("stable/main"). */
  suite: string;
  /** Architecture; "all" for an architecture independent package. */
  arch: string;
  /** Download size ("Need to get ...", the Get and Fetched lines). */
  download: string;
  /** "After this operation, {installed} of additional disk space will be used." */
  installed: string;
  /** Rate on the Fetched line ("16.0 MB/s"). */
  rate: string;
  /** dpkg "(Reading database ... {n} files and directories currently installed.)", no separators. */
  dbFiles: string;
  /** Install directory the intro cds into ("/opt/{name}"). */
  dir: string;
  /** The identity command the package ships. */
  bin: string;
}

/**
 * One part of a pf-whoami value. Parts are joined with " · " and wrap as
 * whole units; `short` replaces `text` below the md breakpoint.
 */
export interface WhoamiPart {
  text: string;
  short?: string;
}

/** pf-whoami summary, derived from the other content modules. */
export interface WhoamiSummary {
  name: string;
  /** Role line under the name (~40 chars, one line at 390 px). */
  role: string;
  /** Status rows: key up to 7 chars; each part at most ~31 chars so a row takes two lines at most at 390 px. */
  rows: { key: string; parts: WhoamiPart[] }[];
}

/** Shell-only text; everything else the shell prints is derived from other content. */
export interface ShellContent {
  /** ~110 and ~210 chars. */
  aboutParagraphs: [string, string];
  /** One line per school, ~60 to 100 chars each. */
  education: string[];
  neofetch: { OS: string; Host: string; Memory: string; Storage: string; Network: string };
  /** Bold label printed by `services` before the OS. */
  servicesHost: string;
  /** Computed from the enabled sections (plus one filtered row), sorted by port. */
  nmap: NmapPort[];
}

/* ------------------------------------------------------------------------ */
/* Projects (spec 06)                                                        */
/* ------------------------------------------------------------------------ */

export interface Project {
  slug: string;
  /** 13 to 31 chars, rendered uppercase. */
  name: string;
  /** 142 to 207 chars. */
  description: string;
  /** 4 to 5 tech labels, 2 to 14 chars each, rendered in order. */
  stack: string[];
  /**
   * Where the card points: an absolute URL (opens in a new tab), an in-page
   * anchor such as "#homelab" (same tab), or "" for no link (the link icon
   * is hidden and the card is not clickable).
   */
  link: string;
  /** "/previews/<slug>.png" (1280x800, 16:10), or null for the placeholder. */
  preview: string | null;
  /** Only when preview is null: file name shown as "./previews/<file>". */
  placeholderFile?: string;
  /** 8.3 file name on the room CRT, e.g. "JUMPBOX.MCP". */
  dosName: string;
}

/* ------------------------------------------------------------------------ */
/* Write-ups (CTF / lab walkthroughs)                                        */
/* ------------------------------------------------------------------------ */

/** Relative difficulty, color-coded on the card badge. */
export type WriteupDifficulty = "Easy" | "Medium" | "Hard" | "Insane";

/**
 * One capture-the-flag / lab machine walkthrough. Only ever populate this with
 * boxes actually solved — a write-up is a claim of skill, so fabricated entries
 * are resume fraud, not filler.
 */
export interface Writeup {
  slug: string;
  /** Box / room name, rendered uppercase. 3 to 28 chars. */
  name: string;
  /** Where the work lives, e.g. "TryHackMe", "Hack The Box", "Homelab". */
  platform: string;
  /** CTF difficulty; omit for non-box work (e.g. a homelab assessment) so the badge is hidden. */
  difficulty?: WriteupDifficulty;
  /** One-paragraph summary of the attack path. 110 to 210 chars. */
  summary: string;
  /** Technique / tooling tags rendered as chips, in order. 3 to 6 items, 2 to 20 chars. */
  tags: string[];
  /**
   * Link to the full write-up (blog post, GitHub, PDF). "" hides the link
   * affordance and makes the card non-clickable, like a linkless Project.
   */
  link: string;
}

/* ------------------------------------------------------------------------ */
/* Websites and experience (spec 08)                                         */
/* ------------------------------------------------------------------------ */

export interface ClientSite {
  slug: string;
  /** 23 to 30 chars. */
  name: string;
  /** "{business type} · {City, ST}", 29 to 36 chars. */
  category: string;
  url: string;
  /** 16 to 25 chars, no protocol. */
  displayUrl: string;
  /** 196 to 270 chars. */
  description: string;
  /** 4 tags, 3 to 16 chars. */
  tags: string[];
  /** "/sites/<slug>.webp" (1400x875, 16:10). */
  preview: string;
  /** 8.3 file name on the room CRT, e.g. "HARBOR.WWW". */
  dosName: string;
}

export interface BadgeStyle {
  /** Colour band hex. */
  band: string;
  /** Uppercase org line, 10 to 34 chars. */
  org: string;
  /** Badge tab label, 9 to 17 chars. */
  tab: string;
}

export interface ExperienceEntry {
  /** 11 to 43 chars. */
  role: string;
  /** 15 to 40 chars. */
  company: string;
  /** "City, ST" or "Remote". */
  location: string;
  /** "{Mon YYYY} to {Mon YYYY|Present}", split on " to ". */
  period: string;
  /** 9 to 22 chars, e.g. "Internship". */
  type: string;
  /** 2 to 5 items; 60 to 154 chars each. */
  bullets: string[];
  /** Room work badge styling. */
  badge: BadgeStyle;
}

/* ------------------------------------------------------------------------ */
/* About, credentials, contact (spec 09)                                     */
/* ------------------------------------------------------------------------ */

export interface EducationEntry {
  school: string;
  /** "City, ST" */
  location: string;
  /** Degree line, e.g. "B.S. Information Systems/Cybersecurity". */
  degree: string;
  /** "Expected May 2028" or "Graduated Dec 2025". */
  when: string;
  /** Short extras shown as a dotted line (GPA, certificates). */
  details: string[];
}

export interface AboutContent {
  portrait: {
    src: string;
    width: number;
    height: number;
    alt: string;
    name: string;
    location: string;
    /** True while the image is the generated silhouette, not the owner. */
    placeholder: boolean;
  };
  /** About 184, 525 and 300 chars. */
  bio: [string, string, string];
  /** Three chip groups; the last one (certifications) uses the accent tone. */
  skillGroups: { label: string; tone: "neutral" | "accent"; items: string[] }[];
  education: EducationEntry[];
  /** Relevant coursework, shown under the education rows. */
  coursework: string[];
}

/** How a certificate is drawn on wall B of the room (spec 04 section 9.1 step 9). */
export interface WallCert {
  slot: CertHotspotId;
  /** 4 to 8 chars, drawn in the ink colour (or per-letter colours). */
  wordmark: string;
  wordmarkColor: string | string[];
  /** 4 to 9 chars, bold. */
  title: string;
  seal: string;
  /** Optional full-width header band (one of the four has it). */
  band?: string;
}

export type CredentialStatus = "in-progress" | "earned";

export interface Credential {
  /** Short lowercase slug. */
  id: string;
  /** Short name for chips, alt and aria (4 to 24 chars). */
  name: string;
  /** Full title (17 to 41 chars). */
  full: string;
  /** Issuer short name used in captions (5 to 8 chars). */
  issuer: string;
  /** Issuer full name for the credential cards. */
  issuerFull: string;
  kind: "certification" | "certificate" | "degree";
  status: CredentialStatus;
  /** "Mon YYYY": the expected date while in progress, otherwise the date earned. */
  date: string;
  /**
   * Shown in the room caption "{issuer} · {note}". A credential without
   * verify or PDF keys keeps its note at 30 chars or fewer so its cert panel
   * chrome stays on one row at 390 px.
   */
  note: string;
  /** Optional, only for credentials that can be verified. */
  issued?: string;
  validThrough?: string;
  /** "/certs/<slug>.pdf" (a real certificate file, when the owner adds one). */
  file?: string;
  /** "/certs/<slug>.webp", 1200x927 stylized card generated by scripts/assets/panels.mjs. */
  thumb?: string;
  verify?: { url: string; code: string };
  /** Hung as a framed card in the About section. */
  featured?: boolean;
  /** Hotspot label, e.g. "CompTIA Security+ (in progress)" (20 to 40 chars). */
  label: string;
  /** Tooltip short name. */
  tip: string;
  wall: WallCert;
}

export type ContactKey = "github" | "linkedin" | "email" | "resume";

export interface ContactLink {
  key: ContactKey;
  /** Contact tile label: GitHub, LinkedIn, Email, Resume. */
  label: string;
  /** 8 to 26 chars. */
  handle: string;
  /** An empty href hides the link everywhere (grid, footer, phone, terminal). */
  href: string;
  /** Opens in a new tab (everything except mailto). */
  external: boolean;
  /** True while the handle and href are stand-ins the owner still has to supply. */
  placeholder?: boolean;
}

export interface ContactContent {
  /** ~95 chars. */
  lede: string;
  links: ContactLink[];
  /** Contact grid order. */
  gridOrder: ContactKey[];
  /** Footer "Connect" order. */
  footerOrder: ContactKey[];
  /** Phone panel one-liner (~75 chars). */
  pitch: string;
}

/* ------------------------------------------------------------------------ */
/* Homelab (spec 07) and rack parts (spec 05)                                */
/* ------------------------------------------------------------------------ */

export interface HardwarePart {
  /** Lowercase category, 5 to 12 chars ("the rack", "network", "proxmox node", "compute", "storage", "power"). */
  kicker: string;
  /** Product line, 15 to 32 chars. Brand and model names of the owner's own hardware are fine as plain text (never drawn as logos). */
  title: string;
  /** 1 to 3 lines, 8 to 55 chars, " · " and "×" separators. Leave out facts that are not known yet. */
  specs: string[];
  /** Optional reference link (for example the product page). */
  href?: string;
  extra?: { label: string; href: string };
  /** Inspector tab label. */
  tab: string;
  /** Room tooltip short name. */
  tip: string;
}

export interface HomelabService {
  /** 5 to 21 chars, rendered uppercase; may contain "→" or "+". */
  name: string;
  /** 5 to 9 chars (terminal banner). */
  unit: string;
  /** 24 to 42 chars (terminal banner). */
  short: string;
  /** 79 to 114 chars, lowercase start, no final period. */
  role: string;
}

export interface HomelabContent {
  /** ~128 chars. */
  lede: string;
  /** Card header, ~28 chars. */
  rackTitle: string;
  /** SVG aria-label, ~120 chars. */
  diagramLabel: string;
  /** Machine description, ~29 chars. */
  host: string;
  /** "OS · mode · uptime", ~27 chars. */
  os: string;
  /** One entry per rack part (the rack and its 10 devices). */
  parts: Record<RackPartId, HardwarePart>;
  /** The listed parts with callouts, in order (all 10 devices). */
  list: Exclude<RackPartId, "rack">[];
  /** Which spec line shows in the list meta (default 0). */
  specIndex: Partial<Record<RackPartId, number>>;
  /** One entry per HOMELAB_HOSTS row (8 today), derived from that list. */
  services: HomelabService[];
  /** 6 chips, 8 to 55 chars, lowercase. */
  hardening: string[];
  /**
   * "Broke it, fixed it" stories: 0 to 3 sentences, 115 to 144 chars, ending
   * with a period. Empty hides the block in the section and the map panel.
   */
  stories: string[];
  /** 4 rack callout tags during the power-up, lowercase "device · status", 18 to 30 chars. */
  rackTags: Record<BootPartId, string>;
}

/* ------------------------------------------------------------------------ */
/* Room extras (spec 04 section 8, spec 05 section 8)                        */
/* ------------------------------------------------------------------------ */

export interface RoomContent {
  poster: { src: string; alt: string; tip: string; caption: string };
  /** In-scene framed print image (landscape ~1.48:1). */
  printArt: string;
  /** Framed art print: hotspot title and tooltip, panel alt text and caption. */
  print: { title: string; tip: string; alt: string; caption: string };
  resume: { image: string; pdf: string; downloadName: string };
  crt: {
    /** "{initials}-DOS 6.22 · C:\PROJECTS" */
    dosTitle: string;
    /** DOS prompt with initials, e.g. "C:\KG>". */
    promptPrefix: string;
    listCommand: string;
    /** 4 lines, "name<pad>.ext", 14 to 15 chars. */
    listing: string[];
    counterCommand: string;
    barsLabel: string;
    /** "{initials}-386" */
    modelBadge: string;
  };
  record: { artist: string; title: string };
  music: {
    artist: string;
    title: string;
    /** Self-hosted royalty-free audio, or null (card shows art only). */
    audioSrc: string | null;
    cover: string | null;
  };
  /** In-scene network map board: 8 node labels (3 to 9 chars), columns 1, 1, 3, 3. */
  mapNodes: string[];
  /** Map panel diagram: WAN, switch, server, 4 service nodes. */
  mapPanel: {
    wan: { title: string; sub: string };
    switch: { title: string; sub: string };
    server: { title: string; sub: string };
    services: { title: string; sub: string }[];
  };
}
