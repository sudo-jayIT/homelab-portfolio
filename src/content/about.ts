/**
 * About, education and credentials (spec 09 section 8, wall certificates from
 * spec 04), from the resume. Credentials are read by the room (wall art, cert
 * panels) and the terminal (`certs`). The bio paragraphs are drafts written
 * only from resume facts.
 *
 * Assets: /about/kris-green.jpg (owner-supplied photo)
 * and /certs/<id>.webp (scripts/assets/panels.mjs, original
 * stylized credential cards, not copies of any official certificate).
 */

import type { AboutContent, Credential } from "./types";
import { SITE } from "./site";
import portraitPhoto from "../../public/about/kris-green.jpg";

export const ABOUT: AboutContent = {
  portrait: {
    src: portraitPhoto.src,
    width: portraitPhoto.width,
    height: portraitPhoto.height,
    alt: `Portrait of ${SITE.name}`,
    name: SITE.name,
    location: SITE.location,
    placeholder: false,
  },
  // DRAFT: three paragraphs built only from resume facts.
  bio: [
    "I'm a cybersecurity student at the University of Richmond, working toward a B.S. in Information Systems/Cybersecurity, and a DevSecOps intern at Traffic by Intent.",
    "I also hold an A.A.S. in Information Systems from J. Sargent Reynolds College, with its Cybersecurity and Networking certificates, after coursework in risk management, local area networks, network attacks, computer crime and hacking, and cloud infrastructure. At Traffic by Intent I build and maintain CI/CD pipelines on GCP, manage IAM and service accounts, run AI security risk assessments aligned to SOC 2, and test custom LLM MCP servers. CompTIA Security+ is next, expected in November 2026.",
    "Outside of work I run a 4-node Proxmox homelab behind an OPNsense firewall, with Tailscale and a honeypot whose findings feed back into my firewall rules. As interim president of the UR Cybersecurity Club, I lead members through TryHackMe CTF rooms and workshops.",
  ],
  skillGroups: [
    { label: "Languages", tone: "neutral", items: ["Python", "JavaScript", "C++", "Bash", "PowerShell", "Node.js"] },
    { label: "Tools", tone: "neutral", items: ["Splunk", "Wireshark", "Metasploit", "ServiceNow", "OPNsense", "Tailscale"] },
    { label: "Platforms", tone: "neutral", items: ["Google Cloud (GCP)", "AWS", "Proxmox", "Linux", "Windows", "LLM Agents"] },
    {
      label: "Certifications",
      tone: "accent",
      items: ["Security+ (in progress)", "Cybersecurity Certificate", "Networking Certificate"],
    },
  ],
  education: [
    {
      school: "University of Richmond",
      location: "Richmond, VA",
      degree: "B.S. Information Systems/Cybersecurity",
      when: "Expected May 2028",
      details: ["GPA 3.81/4.00"],
    },
    {
      school: "J. Sargent Reynolds College",
      location: "Richmond, VA",
      degree: "A.A.S. Information Systems",
      when: "Graduated Dec 2025",
      details: ["Cybersecurity Certificate", "Networking Certificate"],
    },
  ],
  coursework: [
    "IT Security Planning & Risk Management",
    "Local Area Networks",
    "Data Literacy",
    "Network Attacks",
    "Computer Crime & Hacking",
    "Cloud Computing Infrastructure & Services",
  ],
};

/**
 * Four credentials in wall order (cert-1..cert-4). Every one has a generated
 * card image (`thumb`); `featured` ones are also framed in the About section.
 * None has a PDF or a verification link yet.
 */
export const CREDENTIALS: Credential[] = [
  {
    id: "security-plus",
    name: "Security+",
    full: "CompTIA Security+",
    issuer: "CompTIA",
    issuerFull: "CompTIA",
    kind: "certification",
    status: "in-progress",
    date: "Nov 2026",
    note: "In progress, expected Nov 2026",
    thumb: "/certs/security-plus.webp",
    featured: true,
    label: "CompTIA Security+ (in progress)",
    tip: "Security+ (in progress)",
    wall: { slot: "cert-1", wordmark: "CompTIA", wordmarkColor: "#1f2d3d", title: "Security+", seal: "#d97706" },
  },
  {
    id: "cybersecurity-certificate",
    name: "Cybersecurity Certificate",
    full: "Cybersecurity Certificate",
    issuer: "Reynolds",
    issuerFull: "J. Sargent Reynolds College",
    kind: "certificate",
    status: "earned",
    date: "Dec 2025",
    note: "Earned Dec 2025",
    thumb: "/certs/cybersecurity-certificate.webp",
    featured: true,
    label: "Reynolds Cybersecurity Certificate",
    tip: "Cybersecurity Cert.",
    wall: { slot: "cert-2", wordmark: "Reynolds", wordmarkColor: "#14532d", title: "CyberSec", seal: "#15803d" },
  },
  {
    id: "networking-certificate",
    name: "Networking Certificate",
    full: "Networking Certificate",
    issuer: "Reynolds",
    issuerFull: "J. Sargent Reynolds College",
    kind: "certificate",
    status: "earned",
    date: "Dec 2025",
    note: "Earned Dec 2025",
    thumb: "/certs/networking-certificate.webp",
    featured: true,
    label: "Reynolds Networking Certificate",
    tip: "Networking Cert.",
    wall: {
      slot: "cert-3",
      wordmark: "REYNOLDS",
      wordmarkColor: "#ffffff",
      title: "Network",
      seal: "#1d4ed8",
      band: "#1e3a5f",
    },
  },
  {
    id: "aas-information-systems",
    name: "A.A.S. Information Systems",
    full: "A.A.S. Information Systems",
    issuer: "Reynolds",
    issuerFull: "J. Sargent Reynolds College",
    kind: "degree",
    status: "earned",
    date: "Dec 2025",
    note: "Graduated Dec 2025",
    thumb: "/certs/aas-information-systems.webp",
    label: "A.A.S. Information Systems (Reynolds)",
    tip: "A.A.S. Info Systems",
    wall: { slot: "cert-4", wordmark: "Reynolds", wordmarkColor: "#3f3f46", title: "A.A.S.", seal: "#7c3aed" },
  },
];

/** Status badge text: "In progress" or "Earned". */
export function credentialStatus(c: Credential): string {
  return c.status === "in-progress" ? "In progress" : "Earned";
}

/** Date line: "Expected Nov 2026", "Earned Dec 2025" or "Graduated Dec 2025". */
export function credentialDate(c: Credential): string {
  if (c.status === "in-progress") return `Expected ${c.date}`;
  return `${c.kind === "degree" ? "Graduated" : "Earned"} ${c.date}`;
}
