/**
 * Intro terminal and shell content (spec 01 section 8). The shell also prints
 * data derived from other content modules (projects, experience, credentials,
 * contact, education, homelab); only text unique to the terminal lives here.
 *
 * Derived, not duplicated:
 *   - banner rows (login screen after a logout): HOMELAB_HOSTS rows with a banner text (id + banner; idle nodes are left out)
 *   - boot rows: RACK_BOOT in homelab.ts (printed by the engine on the login and reboot path, not listed here)
 *   - `services` and the neofetch Services row: HOMELAB_HOSTS
 *   - education: ABOUT.education
 *   - nmap rows: the enabled sections (site.ts) mapped through NMAP_PORTS
 *   - package name: SITE.name; repo host: SITE.host
 *   - pf-whoami rows: SITE, ABOUT.education, EXPERIENCE, HOMELAB, CREDENTIALS
 */

import type {
  IntroContent,
  NmapPort,
  PortfolioPackage,
  SectionId,
  ShellContent,
  TerminalCommandSpec,
  WhoamiSummary,
} from "./types";
import { ABOUT, CREDENTIALS } from "./about";
import { EXPERIENCE } from "./experience";
import { HOMELAB, HOMELAB_HOSTS } from "./homelab";
import { SECTION_ORDER, SITE } from "./site";

export const INTRO: IntroContent = {
  hostname: SITE.host,
  tty: "tty1",
  distroLine: `Debian GNU/Linux 13 ${SITE.host} tty1`,
  kernelLine: `Linux ${SITE.host} 6.12.57+deb13-cloud-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`,
  ownerName: SITE.name,
  bannerTagline: ", homelab portfolio. These services are live right now:",
  services: HOMELAB_HOSTS.flatMap(({ id, banner }) => (banner ? [{ unit: id, short: banner }] : [])),
  defaultUser: "guest",
};

const PACKAGE_NAME = `${SITE.name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")}-portfolio`;

/**
 * The package the first-visit intro installs (`sudo apt install kris-portfolio`)
 * and the numbers apt prints for it. DRAFT: version, sizes, rate and the dpkg
 * file count are illustrative; the repository is a homelab-style mirror name.
 */
export const PORTFOLIO_PACKAGE: PortfolioPackage = {
  name: PACKAGE_NAME,
  version: "1.0.0",
  repo: `http://apt.${SITE.host}.lan`,
  suite: "stable/main",
  arch: "all",
  download: "4,812 kB",
  installed: "17.9 MB",
  rate: "16.0 MB/s",
  dbFiles: "41237",
  dir: `/opt/${PACKAGE_NAME}`,
  bin: "./portfolio.sh",
};

/**
 * Help list in display order (20 rows; `boot` only on the login screen).
 * Names are also the tab-completion candidates; aliases are accepted but
 * never completed or listed.
 */
export const TERMINAL_COMMANDS: TerminalCommandSpec[] = [
  { name: "about", help: "a little about me" },
  { name: "boot", help: "power on the homelab", aliases: ["start", "startx"], introOnly: true },
  { name: "certs", help: "certifications", aliases: ["certifications"] },
  { name: "clear", help: "clear the screen" },
  { name: "contact", help: "email and profiles", aliases: ["email", "socials"] },
  { name: "echo", help: "print some text" },
  { name: "education", help: "schools and degrees" },
  { name: "experience", help: "work and leadership" },
  { name: "help", help: "this list" },
  { name: "history", help: "commands you have run" },
  { name: "neofetch", help: "the lab at a glance" },
  { name: "nmap", help: "scan this site for open ports" },
  { name: "open", help: "jump to a section (open homelab)" },
  { name: PORTFOLIO_PACKAGE.bin, help: "a quick summary of me" },
  { name: "projects", help: "things I have built" },
  { name: "pwd", help: "print working directory" },
  { name: "resume", help: "view my resume (pdf)" },
  { name: "services", help: "what runs on the homelab", aliases: ["homelab"] },
  { name: "whoami", help: "who you are logged in as" },
  { name: "exit", help: "log out", aliases: ["logout"] },
];

/** Port each section answers on in the `nmap` joke (the Proxmox web UI port for the homelab). */
export const NMAP_PORTS: Record<SectionId, string> = {
  about: "22/tcp",
  contact: "25/tcp",
  projects: "443/tcp",
  experience: "3306/tcp",
  homelab: "8006/tcp",
  websites: "8443/tcp",
};

/** The one filtered row. */
const NMAP_FILTERED: NmapPort = { port: "23/tcp", state: "filtered", service: "telnet", target: null };

const portNumber = (p: string) => parseInt(p, 10);

/** Enabled sections only, plus the filtered telnet row, sorted by port. */
const NMAP: NmapPort[] = [
  ...SECTION_ORDER.map((id): NmapPort => ({ port: NMAP_PORTS[id], state: "open", service: id, target: id })),
  NMAP_FILTERED,
].sort((a, b) => portNumber(a.port) - portNumber(b.port));

export const SHELL: ShellContent = {
  // DRAFT: built from resume facts.
  aboutParagraphs: [
    `I'm ${SITE.name}, a cybersecurity student at the University of Richmond and a DevSecOps intern at Traffic by Intent.`,
    "I build CI/CD pipelines on GCP, run AI security risk assessments aligned to SOC 2, lead the UR Cybersecurity Club as interim president, and run the Proxmox cluster you just powered on.",
  ],
  education: ABOUT.education.map((e) => [e.school, e.degree, e.when.toLowerCase(), ...e.details].join(" · ")),
  // Rack facts from docs/OWNER-NOTES.md; the network row from the resume.
  neofetch: {
    OS: "Proxmox VE · 4-node cluster + QDevice",
    Host: "3× HP ProDesk G3 Mini · GMKtec G3 Pro",
    Memory: "pve1 16 GB · pve2 16 GB · pve3 32 GB · pve4 8 GB",
    Storage: "pve1 86 GB · pve2 86 GB · pve3 256 GB · pve4 512 GB SSD · NAS",
    Network: "OPNsense edge · managed switch · Tailscale",
  },
  servicesHost: "pve-cluster",
  nmap: NMAP,
};

/** Small shell strings that the shared ShellContent shape does not cover. */
export const SHELL_EXTRA = {
  /** neofetch CPU row, printed after Host. */
  cpu: "3× Intel Core i5-6500T · Intel Core i3-10110U",
  /** Suffix of the neofetch Services row: "{n} on pve1 to pve3 · pve4 idle · {servicesNote}". */
  servicesNote: "isolated by segmentation and ACLs",
  /** `ls` output (the two files `cat` understands are about.txt and services.md). */
  listing: "about.txt   certs/   experience/   projects/   resume.pdf   services.md",
  /** Address printed in the nmap scan report line. */
  scanAddress: "10.20.0.1",
  /** Duration printed by the nmap "done" line. */
  scanSeconds: "0.38",
} as const;

/** "Expected May 2028" becomes "expected May 2028". */
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** The degree in progress (an "Expected ..." entry), else the first one listed. */
const STUDY = ABOUT.education.find((e) => /^expected/i.test(e.when)) ?? ABOUT.education[0];
/** Current job: the first non-leadership entry still running ("... to Present"). */
const WORK =
  EXPERIENCE.find((e) => e.type !== "Leadership" && /present$/i.test(e.period)) ??
  EXPERIENCE.find((e) => e.type !== "Leadership");
const LEAD = EXPERIENCE.find((e) => e.type === "Leadership");
/** The industry certification (Security+), in progress or earned. */
const CERT = CREDENTIALS.find((c) => c.kind === "certification");

/**
 * `pf-whoami`: name, role line and five status rows, all read from the other
 * content modules. Below md the long parts switch to their short forms (the
 * degree level, the badge tab names) so every row wraps to two lines at most
 * at 390 px.
 */
export const PF_WHOAMI: WhoamiSummary = {
  name: SITE.name,
  role: `${SITE.role} · ${SITE.location}`,
  rows: [
    STUDY && {
      key: "study",
      parts: [{ text: STUDY.school }, { text: STUDY.degree, short: STUDY.degree.split(" ")[0] }, { text: lowerFirst(STUDY.when) }],
    },
    WORK && { key: "work", parts: [{ text: WORK.role }, { text: WORK.company, short: WORK.badge.tab }] },
    LEAD && { key: "lead", parts: [{ text: LEAD.role }, { text: LEAD.company, short: LEAD.badge.tab }] },
    { key: "homelab", parts: [{ text: HOMELAB.host }, { text: HOMELAB.os }] },
    CERT && { key: "certs", parts: [{ text: CERT.full }, { text: lowerFirst(CERT.note) }] },
  ].filter((row): row is WhoamiSummary["rows"][number] => !!row),
};
