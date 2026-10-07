/**
 * Homelab content (spec 07 section 8, spec 05 RackPart). Owned by the rack
 * area. Shared with the room (rack inspector, map panel, rack tags, boot log)
 * and the terminal (banner rows, `services`, `neofetch`).
 *
 * Source of truth: docs/OWNER-NOTES.md (rack, what runs where), then the
 * resume for lab-wide pieces that are not tied to a node (OPNsense edge,
 * Tailscale overlay, honeypot, NFS storage). Nothing here goes beyond them;
 * facts that are not known yet are listed in HOMELAB_TBD and left out of the
 * rendered text. Where each device sits in the rack is set by RACK_SLOTS in
 * src/lib/rack.tsx.
 */

import type { BootStage, RackDeviceId } from "@/components/lab/contracts";
import type { HomelabContent, HomelabService } from "./types";

/** Owner-confirmed hardware beside the rack; separate from the Proxmox nodes. */
export const SIDE_HARDWARE = {
  pc: {
    title: "HYTE Y70 Touch",
    role: "Desktop PC",
    description: "Glass-sided desktop with a vertical touchscreen and Corsair cooling, beneath the standing desk and outside its right leg.",
    specs: [["Case", "HYTE Y70 Touch"], ["Motherboard", "ASUS TUF Gaming X870E-Plus WiFi"], ["Memory", "64 GB (2 × 32 GB) Corsair Vengeance"], ["Graphics", "MSI GeForce RTX 4080 Super"], ["Storage", "4 TB Samsung 990 Pro"], ["Fans", "Corsair"], ["Cooling", "Corsair TITAN AIO"]],
  },
  firewall: {
    title: "HP t730",
    role: "OPNsense firewall",
    specs: [["Processor", "AMD RX-427BB"], ["Memory", "8 GB RAM"], ["Storage", "128 GB HDD"], ["Software", "OPNsense"]],
    description: "Dedicated thin client running the homelab’s OPNsense firewall. It sits between the UPS and the 10-inch rack.",
  },
  ups: {
    title: "CyberPower UPS",
    role: "Battery backup",
    specs: [["Capacity", "1500 VA"], ["Position", "Beside the 10-inch rack"]],
    description: "The homelab’s uninterruptible power supply. The Google mesh Wi-Fi router rests on top of it.",
  },
} as const;

/* ------------------------------------------------------------------------ */
/* What runs where                                                           */
/* ------------------------------------------------------------------------ */

/**
 * One row of "What I've built on it": a node, or a lab-wide piece, and what
 * runs there. The section, the rack inspector, the map panel and the
 * terminal (banner, `services`, `neofetch`) all read this list.
 */
export interface LabHost {
  /** Short host label: row key, terminal unit and map label (3 to 9 chars, lowercase). */
  id: string;
  /** Rack part the row is about (the inspector lists its services there), or null for lab-wide rows. */
  part: RackDeviceId | null;
  /** Display name, rendered uppercase in Archivo (2 to 14 chars). */
  name: string;
  /** Mono role tag beside the name: lowercase, up to about 22 chars. */
  tag: string;
  /** Description line: lowercase start, no final period, at most about 85 chars (one line at 1440). */
  note: string;
  /** What runs there, in the owner's order (proper names). Empty for an idle node. */
  services: readonly string[];
  /**
   * Terminal banner text, or null to keep the row out of the banner (which
   * reads "these services are live right now"). At most 29 chars so each row
   * stays on one line at 390 px.
   */
  banner: string | null;
  /** True while the node runs nothing yet: dim index dot, "idle" wherever it is listed. */
  idle?: boolean;
}

export const HOMELAB_HOSTS: readonly LabHost[] = [
  {
    id: "pve1",
    part: "pve1",
    name: "pve1",
    tag: "critical services",
    note: "passwords, file sync, photos, single sign-on, security monitoring, proxy and media",
    services: ["AI agent jumpbox", "Vaultwarden", "Seafile", "Immich", "Wazuh", "Caddy", "Authentik", "Jellyfin"],
    banner: "vaultwarden, immich, wazuh +5",
  },
  {
    id: "pve2",
    part: "pve2",
    name: "pve2",
    tag: "monitoring + tools",
    note: "dashboards, metrics and network traffic monitoring, plus notes and self-hosted git",
    services: ["Homarr", "Prometheus", "Grafana", "Trilium Notes", "ntopng", "Gitea"],
    banner: "grafana, prometheus, gitea +3",
  },
  {
    id: "pve3",
    part: "pve3",
    name: "pve3",
    tag: "virtual machines",
    note: "home automation, plus an isolated pentest range: vulnerable targets and a kali box",
    services: ["Home Assistant", "Metasploitable", "Kioptrix", "Kali Linux"],
    banner: "home assistant + pentest vms",
  },
  {
    id: "pve4",
    part: "pve4",
    name: "pve4",
    tag: "idle · spare capacity",
    note: "nothing assigned yet: an i3-10110U, 8 GB of RAM and a 512 GB SSD in reserve",
    services: [],
    banner: null,
    idle: true,
  },
  {
    id: "pi4",
    part: "pi",
    name: "Pi 4",
    tag: "quorum + wake-on-lan",
    note: "the proxmox qdevice for a tie-breaking quorum vote, plus the wake-on-lan scripts",
    services: ["QDevice", "wake-on-LAN scripts"],
    banner: "qdevice quorum + wake-on-lan",
  },
  {
    id: "edge",
    part: null,
    name: "Edge",
    tag: "firewall + overlay",
    note: "opnsense on an hp t730 thin client; a tailscale overlay joins the nodes",
    services: ["OPNsense", "Tailscale"],
    banner: "opnsense + tailscale overlay",
  },
  {
    id: "storage",
    part: "nas",
    name: "Storage",
    tag: "nas over nfs",
    note: "nfs-backed storage from the two-bay nas, behind the same segmentation and acls",
    services: ["UGREEN 2-bay NAS", "NFS"],
    banner: "ugreen 2-bay nas over nfs",
  },
  {
    id: "honeypot",
    part: null,
    name: "Honeypot",
    tag: "attack capture",
    note: "captures real-world attack traffic that feeds tighter firewall rules and detections",
    services: [],
    banner: "captures real attack traffic",
  },
];

/** The Proxmox nodes, pve1 to pve4. */
export const CLUSTER_HOSTS: readonly LabHost[] = HOMELAB_HOSTS.filter((h) => h.id.startsWith("pve"));

/** Rows about one rack part (empty for parts with nothing assigned, such as the ZimaBoards). */
export function hostsOn(part: RackDeviceId): readonly LabHost[] {
  return HOMELAB_HOSTS.filter((h) => h.part === part);
}

/**
 * Lowercase list of a row's services that fits in `max` characters, with a
 * "+N" count for the rest ("vaultwarden, immich +6"). Used where space is
 * tight (map panel nodes).
 */
export function serviceSummary(host: LabHost, max: number, from = 0): string {
  const names = host.services.slice(from).map((s) => s.toLowerCase());
  if (names.length === 0) return host.idle ? "nothing assigned yet" : host.tag;
  let out = names[0];
  for (let i = 1; i < names.length; i++) {
    const rest = names.length - i - 1;
    const next = `${out}, ${names[i]}`;
    if (next.length + (rest > 0 ? ` +${rest}`.length : 0) > max) return `${out} +${names.length - i}`;
    out = next;
  }
  return out;
}

/** Services and VMs on the cluster nodes (neofetch). */
export const CLUSTER_SERVICE_COUNT = CLUSTER_HOSTS.reduce((n, h) => n + h.services.length, 0);

/* ------------------------------------------------------------------------ */
/* Rack parts                                                                */
/* ------------------------------------------------------------------------ */

/** Shared spec lines of the three ProDesk nodes. */
const PRODESK = "HP ProDesk G3 Mini";
const I5 = "Intel Core i5-6500T";

/** Third spec line of a Proxmox node: "Cluster node · {role}". */
function nodeLine(id: string): string {
  const host = HOMELAB_HOSTS.find((h) => h.id === id);
  return host ? `Cluster node · ${host.tag}` : "Proxmox VE cluster node";
}

/** One HomelabService per row (the shared shape: name, unit, banner short, description). */
const SERVICES: HomelabService[] = HOMELAB_HOSTS.map((h) => ({
  name: h.name,
  unit: h.id,
  short: h.banner ?? h.tag,
  role: h.note,
}));

export const HOMELAB: HomelabContent = {
  lede:
    "A 12U rack at home: a 4-node Proxmox cluster behind an OPNsense firewall, running the services I self-host and isolated environments for security practice.",
  rackTitle: "Tecmojo 12U · 10-inch rack",
  diagramLabel:
    "Front view of a 12U 10-inch rack: two network switches, three HP ProDesk mini PCs and a GMKtec mini PC as Proxmox nodes, a Raspberry Pi 4 and two ZimaBoards on a shelf, a 2-bay NAS and an 8-outlet PDU",
  host: "4-node Proxmox VE cluster",
  os: "QDevice quorum on a Pi 4",
  parts: {
    rack: {
      kicker: "the rack",
      title: "Tecmojo 12U 10-inch rack",
      specs: ["12U · 10-inch network rack", "Switches, 4 Proxmox nodes, a Pi, ZimaBoards, NAS, PDU"],
      tab: "Rack",
      tip: "The rack",
    },
    "switch-5": {
      kicker: "network",
      title: "NETGEAR 5-port switch",
      specs: ["5 ports · unmanaged"],
      tab: "5-port",
      tip: "5-port switch",
    },
    "switch-8": {
      kicker: "network",
      title: "NETGEAR 8-port managed switch",
      specs: ["8 ports · managed"],
      tab: "8-port",
      tip: "8-port switch",
    },
    pve1: {
      kicker: "proxmox node",
      title: `${PRODESK} · pve1`,
      specs: [I5, "16 GB RAM · 86 GB storage", nodeLine("pve1")],
      tab: "pve1",
      tip: "pve1",
    },
    pve2: {
      kicker: "proxmox node",
      title: `${PRODESK} · pve2`,
      specs: [I5, "16 GB RAM · 86 GB storage", nodeLine("pve2")],
      tab: "pve2",
      tip: "pve2",
    },
    pve3: {
      kicker: "proxmox node",
      title: `${PRODESK} · pve3`,
      specs: [I5, "32 GB RAM · 256 GB storage", nodeLine("pve3")],
      tab: "pve3",
      tip: "pve3",
    },
    pve4: {
      kicker: "proxmox node",
      title: "GMKtec G3 Pro · pve4",
      specs: ["Intel Core i3-10110U", "8 GB RAM · 512 GB SSD", nodeLine("pve4")],
      tab: "pve4",
      tip: "pve4",
    },
    pi: {
      kicker: "quorum · wol",
      title: "Raspberry Pi 4",
      specs: ["Proxmox QDevice for cluster quorum", "Runs the wake-on-LAN scripts"],
      tab: "Pi 4",
      tip: "Raspberry Pi 4",
    },
    zima: {
      kicker: "compute",
      title: "ZimaBoard 2 (1664) ×2",
      specs: ["2 boards · 1664 model", "Unassigned · no role yet"],
      tab: "ZimaBoards",
      tip: "ZimaBoards",
    },
    nas: {
      kicker: "storage",
      title: "UGREEN 2-bay NAS",
      // Model and drives not provided yet (HOMELAB_TBD.nas).
      specs: ["2 drive bays", "NFS-backed storage for the lab"],
      tab: "NAS",
      tip: "2-bay NAS",
    },
    pdu: {
      kicker: "power",
      title: "8-outlet PDU",
      specs: ["8 outlets", "At the bottom of the rack"],
      tab: "PDU",
      tip: "8-outlet PDU",
    },
  },
  list: ["switch-5", "switch-8", "pve1", "pve2", "pve3", "pve4", "pi", "zima", "nas", "pdu"],
  specIndex: { pve1: 1, pve2: 1, pve3: 1, pve4: 1, pi: 0, zima: 1, nas: 1 },
  // Derived from HOMELAB_HOSTS (one entry per row); read HOMELAB_HOSTS for the per-node service lists.
  services: SERVICES,
  hardening: [
    "network segmentation",
    "access control lists (acls)",
    "restrictive firewall rules at the edge",
    "view-only firewall api user, no shell access",
    "no standing credentials with write or shell access",
    "honeypot findings tune firewall rules and detections",
  ],
  // None provided yet; the "Broke it, fixed it" block renders only when this has entries.
  stories: [],
  rackTags: {
    "switch-8": "switch · 8 ports linked",
    pve1: "proxmox · 4 nodes up",
    pi: "pi 4 · qdevice voting",
    pdu: "pdu · 8 outlets live",
  },
};

/**
 * The rack power-up, in order: each stage's devices flicker on together and
 * its rows print to the console as "[  OK  ] host  msg". Every device in the
 * rack should appear in exactly one stage. The ZimaBoards power on with the
 * Pi but print no row (no role yet).
 */
export const RACK_BOOT: readonly BootStage[] = [
  { parts: ["pdu"], rows: [{ host: "pdu", msg: "8 outlets energized" }] },
  {
    parts: ["switch-8", "switch-5"],
    rows: [
      { host: "switch-8", msg: "8 ports linked" },
      { host: "switch-5", msg: "5 ports linked" },
    ],
  },
  { parts: ["pi", "zima"], rows: [{ host: "pi4", msg: "qdevice + wake-on-lan up" }] },
  {
    parts: ["pve1", "pve2", "pve3", "pve4"],
    rows: [
      { host: "pve1", msg: "Started pve1 · 16 GB" },
      { host: "pve2", msg: "Started pve2 · 16 GB" },
      { host: "pve3", msg: "Started pve3 · 32 GB" },
      { host: "pve4", msg: "Started pve4 · 8 GB" },
      { host: "corosync", msg: "Reached quorum (qdevice)" },
    ],
  },
  { parts: ["nas"], rows: [{ host: "nas", msg: "nfs storage online" }] },
];

/**
 * Facts not provided yet. Nothing here is rendered: fill a value in, then add
 * it to the matching part above (and drop it from this list).
 */
export const HOMELAB_TBD = {
  nas: { model: "TBD", drives: "TBD" },
  rackOrder: "provisional (RACK_SLOTS in src/lib/rack.tsx)",
  stories: "TBD",
} as const;
