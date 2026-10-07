/**
 * Room-only content (spec 04 section 8, spec 05 section 8); read by the art,
 * the engine and the focus panels. Everything is original: an invented
 * record, an abstract retro-futurist poster, an art print.
 *
 * Assets (scripts/assets/panels.mjs):
 *   /lab/poster.webp  1024x1024 square poster (in-scene and poster panel)
 *   /lab/print.webp   1360x920 framed art print (scene and print panel)
 *   /lab/resume.webp  page 1 of /resume.pdf, rendered from the PDF itself
 *   /lab/cover.webp   400x400 cover art for the music card
 *   /lab/nocturne.mp3 26.7 s seamless loop for the music card, synthesized
 *                     from scratch by the generator (original, royalty free)
 */

import type { RoomContent } from "./types";
import { CLUSTER_HOSTS, serviceSummary } from "./homelab";
import { PROJECTS } from "./projects";
import { SITE } from "./site";

/** "JUMPBOX.MCP" becomes "jumpbox    .mcp" (name padded to 11), like a DOS `dir`. */
function dirLine(dosName: string): string {
  const [base, ext = ""] = dosName.toLowerCase().split(".");
  return `${base.padEnd(11, " ")}.${ext}`;
}

export const ROOM_CONTENT: RoomContent = {
  poster: {
    src: "/lab/poster.webp",
    alt: "Retro-futurist screenprint of a lighthouse beam sweeping under a ringed planet",
    tip: "Lighthouse",
    caption: "Lighthouse",
  },
  printArt: "/lab/circuit-print.webp",
  print: {
    title: "Wall: framed circuit boards",
    tip: "Circuit board collection",
    alt: "Framed collection of green circuit boards and computer components",
    caption: "Circuit board collection",
  },
  resume: { image: "/lab/resume.webp", pdf: SITE.resumeUrl, downloadName: SITE.resumeFileName },
  crt: {
    dosTitle: `${SITE.initials}-DOS 6.22 · C:\\PROJECTS`,
    promptPrefix: `C:\\${SITE.initials}>`,
    listCommand: "dir projects",
    listing: PROJECTS.slice(0, 4).map((p) => dirLine(p.dosName)),
    counterCommand: "threats",
    barsLabel: "wan0",
    modelBadge: `${SITE.initials}-386`,
  },
  record: { artist: "LOWTIDE", title: "Nocturne" },
  music: {
    artist: "Lowtide",
    title: "Nocturne for Servers",
    audioSrc: "/lab/nocturne.mp3",
    cover: "/lab/cover.webp",
  },
  // Network map board (in the scene): wan, the edge, three nodes, then one
  // service each (columns 1, 1, 3, 3). From docs/OWNER-NOTES.md and the resume.
  mapNodes: ["wan", "opnsense", "8-port", "pve ×4", "nas", "pi 4", "5-port", "zima · ap · hue"],
  // Map panel diagram: wan, edge, cluster, then one node box per Proxmox node
  // with its services (MapPanel also draws the Pi, NAS and honeypot from HOMELAB_HOSTS).
  mapPanel: {
    wan: { title: "wan uplink", sub: "own physical nic" },
    switch: { title: "opnsense edge", sub: "hp t730 · firewall" },
    server: { title: "proxmox cluster", sub: "4 nodes + qdevice" },
    services: CLUSTER_HOSTS.map((h) => ({ title: `${h.id} · ${h.tag}`, sub: serviceSummary(h, 34) })),
  },
};

/**
 * Map panel nodes beyond the RoomContent shape: the lab-wide pieces drawn in
 * the second row of the diagram and the label of the dashed Tailscale group
 * around the node column. Titles up to 16 chars, subs up to 21.
 */
export const MAP_EXTRA = {
  honeypot: { title: "honeypot", sub: "real attacks → rules" },
  nas: { title: "ugreen nas", sub: "nfs · shared storage" },
  pi: { title: "pi 4 · qdevice", sub: "quorum + wake-on-lan" },
  overlay: "tailscale overlay · joins the nodes",
} as const;
