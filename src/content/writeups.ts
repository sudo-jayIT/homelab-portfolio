/**
 * CTF / lab write-ups and homelab security work. The section is switched OFF in
 * site.ts (SECTION_DEFS) until there are enough real entries to fill it out;
 * flip `enabled: true` on the "writeups" row once you're happy.
 *
 * Every entry here is REAL work (full text under docs/writeups/<slug>.md). Only
 * ever add work you actually did — a write-up is a claim of skill. The `link`
 * points at wherever you publish the full text (blog, GitHub); "" hides it.
 *
 * NOTE: the attack-surface and forward-auth entries describe real, partly
 * still-open exposures and are written sanitized. Review (and fix the open
 * items) before making the portfolio public.
 */

import type { Writeup } from "./types";

export const WRITEUPS_LEDE =
  "CTF boxes and homelab security work I've worked through, with the full path from first scan to proof.";

export const WRITEUPS: Writeup[] = [
  {
    slug: "sandbox-blast-radius",
    name: "Sandbox Blast-Radius Assessment",
    platform: "Homelab",
    summary:
      "Isolated a vulnerable-VM network on a single-NIC Proxmox host, then enumerated from a compromised-guest position to confirm the LAN and hypervisor admin plane were unreachable while internet egress still worked.",
    tags: ["Proxmox", "nftables", "Network Isolation", "Enumeration", "netns"],
    link: "",
  },
  {
    slug: "homelab-attack-surface-review",
    name: "Internal Attack-Surface Review",
    platform: "Homelab",
    summary:
      "Turned my own tooling inward: inventoried every listening service on the LAN, checked who could reach each and what auth stood in front of it, fingerprinted unknown hosts, and found the vault and the topology map had the weakest access control.",
    tags: ["Service Enumeration", "Access Control", "ss", "nmap", "Audit"],
    link: "",
  },
  {
    slug: "sso-forward-auth-bypass",
    name: "Bypassing Forward-Auth by IP",
    platform: "Homelab",
    summary:
      "An SSO forward-auth gate only protected the proxy hostname; the origin still listened on 0.0.0.0, so hitting the service IP:port directly skipped auth entirely — and the native mobile app used exactly that unauthenticated path.",
    tags: ["Forward-Auth", "SSO", "Reverse Proxy", "Access Control", "curl"],
    link: "",
  },
  {
    slug: "lan-east-west-visibility",
    name: "Why the Sensor Was Blind",
    platform: "Homelab",
    summary:
      "Set out to watch host-to-host traffic and proved, using the firewall's own tables, that neither the sensor nor the firewall can see same-subnet traffic on a switched LAN — port mirroring on the switch is the only path.",
    tags: ["Switching", "Packet Capture", "SPAN", "promiscuous", "IDS"],
    link: "",
  },
  {
    slug: "opnsense-config-audit",
    name: "Auditing a Firewall Before Pulling It",
    platform: "Homelab",
    summary:
      "A read-only audit of a live OPNsense config before retiring the box: 35 filter rules but only one custom (a Tailscale allow), a hidden double-NAT, and the catch that the box was also the sole remote-access path.",
    tags: ["OPNsense", "Firewall", "Tailscale", "NAT", "Audit"],
    link: "",
  },
  {
    slug: "self-pentest-vault-exposure",
    name: "Red-Teaming My Own Homelab",
    platform: "Homelab",
    summary:
      "A self-authorized pentest with explicit rules of engagement: chained a default-credential foothold to an SSO bypass on the password vault's origin, proved unauthenticated reachability to the network's highest-value asset, and stopped at the line I set before I started.",
    tags: ["Pentest", "Rules of Engagement", "Auth Bypass", "Privilege Path", "Recon"],
    link: "",
  },
];
