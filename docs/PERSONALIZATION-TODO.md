# Personalization to-do

What the owner still has to supply, confirm or decide. Personal content was written only from the resume, the hardware notes and `docs/OWNER-NOTES.md`; anything those sources did not cover is hidden, marked as a draft, or listed here.

Status: the owner notes are applied as of the 2026-10-06 pass (section 2), including the requested first-visit intro sequence (the apt install session).

Tags: **Privacy** (check before publishing), **Missing** (information not provided yet), **Draft** (written from resume facts, needs a read), **Decision** (a choice only the owner can make), **Requested** (asked for, not built yet).

Most fields hide their UI when left empty: a contact link with `href: ""`, a project with `link: ""`, an empty `HOMELAB.stories`. Facts that are not known yet are kept out of the rendered text rather than guessed.

After editing room art, the rack layout or wall art, rerun `node scripts/assets/room-still.mjs` with the dev server running (see README).

## 1. Open items

| Tag | Item | Where it shows | File to edit |
|---|---|---|---|
| Privacy | `public/resume.pdf` is the real resume and **still contains the phone number** (checked 2026-10-06). It is served publicly at `/resume.pdf`. The room's resume image (`public/lab/resume.webp`) has the number cut out, but the PDF itself is unchanged. Export a copy without the phone number and run `RESUME_SRC=path/to/that.pdf node scripts/assets/panels.mjs resume`, or confirm the PDF may stay public as is. Do this before publishing. | Header "Resume ↗", Contact card, footer, terminal `resume`, room resume panel (Open PDF, Download) | `public/resume.pdf` |
| Missing | Site domain. `SITE.url` (`https://kris-green.example`) and `SITE.domain` (`kris-green.example`) are placeholders. Set them before or right after the first deploy. | Metadata base (canonical and OG URLs), terminal `nmap` report line | `src/content/site.ts` |
| Missing | "Broke it, fixed it" stories. `HOMELAB.stories` is empty, so the section block and the map panel's "Things I've debugged" list are hidden. Add up to three sentences (about 115 to 144 characters each) to show them. | Homelab section, room map panel | `src/content/homelab.ts` |
| Missing | More projects, links and screenshots. Self-Hosted AI Agent Jumpbox, Penetration Test Report and Capstone have `link: ""` (no link icon) until public URLs exist; the homelab card links to `#homelab`. The Personal Homelab card shows the strip "./previews/personal-homelab.png · screenshot coming soon": add a 1280 x 800 PNG at `public/previews/personal-homelab.png` and set `preview: "/previews/personal-homelab.png"`. The three other previews are original generated illustrations, not screenshots; replace them with real images if any can be shared. The grid is laid out for four cards. | Projects section, terminal `projects`, room CRT | `src/content/projects.ts`, `public/previews/` |
| Missing | Portrait. The current image is a generated faceless silhouette (`ABOUT.portrait.placeholder = true`), also used on the room badge and phone panels. Replace `public/about/portrait.webp` (840 x 1120) and set `placeholder: false`. | About section, room badge and phone panels | `public/about/portrait.webp`, `src/content/about.ts` |
| Decision | Metasploit chip. Penetration Test Report lists a "Metasploit" tech chip. The resume lists Metasploit as a tool but does not tie it to this project. Confirm or remove the chip. | Projects section | `src/content/projects.ts` |
| Draft | Copy review. Every draft line on the site is listed in section 3; read them once and change anything that does not sound right. | Site wide | see section 3 |

## 2. Done (applied from the owner notes)

| Item | Where it lives |
|---|---|
| GitHub username: handle `@sudo-jayIT`, href `https://github.com/sudo-jayIT`. | `src/content/contact.ts` |
| Rack order, top to bottom: 5-port switch, 8-port managed switch, pve1 to pve4, a 1U shelf with the Raspberry Pi 4 and both ZimaBoards, the UGREEN 2-bay NAS, the PDU at the bottom. The room, the homelab diagram, the hotspots and the rack inspector all follow it. | `src/lib/rack.tsx` (`RACK_SLOTS`) |
| Hardware per device (HP ProDesk G3 Mini pve1 to pve3, GMKtec G3 Pro pve4, CPU, RAM and storage; Tecmojo 12U 10-inch rack; 4-node Proxmox VE cluster with the Pi as QDevice). | `src/content/homelab.ts` |
| What runs where: pve1 critical services, pve2 monitoring and tools, pve3 VMs (Home Assistant and the pentest range), pve4 idle, the Pi with wake-on-LAN and the QDevice, ZimaBoards unassigned. Also used by the terminal `services` and `neofetch`, the inspector and the map panel. | `src/content/homelab.ts` (`HOMELAB_HOSTS`), `src/content/room.ts` |
| No Photography section. | removed |
| Websites section stays off (`enabled: false`); its sample content never renders. | `src/content/site.ts` |
| Room wall art (lighthouse poster, art print) left as is. | `public/lab/` |
| The phone number never appears in site text; it is cut out of the room's resume image. The PDF itself is still open in section 1. | `public/lab/resume.webp` |
| First-visit intro sequence: login, `sudo apt install kris-portfolio` with Debian apt and dpkg output and apt's progress row, `cd /opt/kris-portfolio`, `pf-whoami`, then the room power-up and hand-off (no service banner, no boot log rows). The shell accepts `pf-whoami`, `sudo apt install kris-portfolio` (already the newest version), `apt` without sudo (lock error) and `cd`. | `src/components/lab/terminal/session.tsx`, `apt.tsx`, `commands.tsx`, `src/content/intro.ts` (`PORTFOLIO_PACKAGE`, `PF_WHOAMI`) |
| Theme B, Mint Terminal, with the colour rule: mint for the page frame and UI; the room scene, rack hardware and its LEDs, wall art, devicons and project images keep their own colours. Theme previews removed. | `src/styles/base.css`, `docs/theme/b.md`, README "Theme" |

## 3. Draft copy to review

Each line was written from resume facts or the owner notes and adds no new facts; it only needs a read.

| Area | Draft | File to edit |
|---|---|---|
| Site | `SITE.role` and `SITE.title` ("Cybersecurity & DevSecOps"), `SITE.description` (metadata and share cards), `SITE.ogAlt` (share card alt text, "on a dark grid with mint terminal glyphs"), footer blurb (`FOOTER.blurb`) | `src/content/site.ts` |
| Landing | Role line "Cybersecurity · DevSecOps · Cloud & Homelab" (`HERO.roles`) and the one-sentence description (`HERO.description`) | `src/content/hero.ts` |
| Projects | The four project descriptions (condensed from the resume bullets) | `src/content/projects.ts` |
| Homelab | Section lede; host/os line "4-node Proxmox VE cluster · QDevice quorum on a Pi 4"; rack spec line; PDU spec "At the bottom of the rack"; ZimaBoard spec "x86 single-board servers"; row tags (for example pve2 "monitoring + tools", edge "firewall + overlay", honeypot "attack capture"), one-line notes, terminal banner shorts and map panel subtitles | `src/content/homelab.ts`, `src/content/room.ts` |
| Homelab | Boot-log rows and power-up tags ("Started pve1 · 16 GB", "Reached quorum (qdevice)", "pi4 · qdevice + wake-on-lan up", "nfs storage online", "pi 4 · qdevice voting"). Only pve1 to pve4 are known hostnames; pi4, nas, switch-5, switch-8 and corosync are labels. Hostname stickers on the drawn device faces are art labels. | `src/content/homelab.ts` (`RACK_BOOT`, `HOMELAB.rackTags`), `src/lib/rack.tsx` |
| Experience | Bullets tightened from the resume (same facts) | `src/content/experience.ts` |
| About | Bio (three paragraphs) | `src/content/about.ts` (`ABOUT.bio`) |
| Contact | Contact lede (`CONTACT.lede`) and the room phone panel pitch (`CONTACT.pitch`) | `src/content/contact.ts` |
| Terminal | `about` paragraphs (`SHELL.aboutParagraphs`); `neofetch` rows (from the hardware notes, including pve4's 8 GB and 512 GB SSD); banner tagline ", homelab portfolio. These services are live right now:" (`INTRO.bannerTagline`); the `nmap` joke's illustrative address `10.20.0.1` and the `services` label "pve-cluster" (neither is a real address or hostname) | `src/content/intro.ts` |
| Terminal | First-visit apt session: package version `1.0.0`, sizes (4,812 kB download, 17.9 MB installed), the fetch rate, the dpkg file count and the repository name `http://apt.homelab.lan` are illustrative (`PORTFOLIO_PACKAGE`). `pf-whoami` rows are derived from existing content: study (school, degree, expected date; the degree level "B.S." on phones), work and lead (role and company; the badge tab names "Traffic by Intent" and "UR Cyber Club" on phones), homelab (`HOMELAB.host` and `HOMELAB.os`), certs (the Security+ note); help text "a quick summary of me". | `src/content/intro.ts`, `src/content/experience.ts` (`badge.tab`) |
| Room | Network map board labels (wan, opnsense, pve1 to pve3, wazuh, grafana, kali) and the map panel nodes (`MAP_EXTRA`); rerun `room-still.mjs` after changing board labels. Firewall flash "blocked · opnsense" and the CRT counter label "wan0". | `src/content/room.ts`, `src/components/lab/art/objects/Cables.tsx` |

## 4. Kept as built (change any time)

Choices made while building that need no answer to publish. Each one is easy to change later.

| Item | File to edit |
|---|---|
| Footer status "Open to opportunities" (availability is not stated on the resume). | `src/content/site.ts` (`FOOTER.statusText`) |
| The footer's Navigation column lists Homelab. Set `footer: false` on its `SECTION_DEFS` entry to drop it. | `src/content/site.ts` |
| The Personal Homelab project card keeps the resume's wording ("a self-hosted LLM, a NAS, Immich, Home Assistant and a honeypot") while the Homelab section groups services by node. The LLM is not tied to a node in the owner notes, so the homelab section does not name it. | `src/content/projects.ts`, `src/content/homelab.ts` |
| UGREEN 2-bay NAS model and drives are not known (`HOMELAB_TBD.nas`); the face is a generic 2-bay drawing and its role text comes from the resume. | `src/content/homelab.ts` |
| U positions and slot heights are assumed (a 4U NAS, a shared 1U shelf at U6, the PDU at U1); the plugged switch ports (`PLUGGED`) are illustrative. Reorder or resize freely; every view follows. | `src/lib/rack.tsx` |
| No "Tailscale-only remote access" hardening chip, because the resume does not say remote access is Tailscale-only. | `src/content/homelab.ts` (`HOMELAB.hardening`) |
| Room badge band colours `#134e4a` (Traffic by Intent) and `#312e81` (UR Cybersecurity Club) are original choices. | `src/content/experience.ts` (`badge.band`) |
| Credential cards (`public/certs/*.webp`) are original designs generated from the content, not scans; no PDFs or verification links. | `src/content/about.ts`, `scripts/assets/panels.mjs` |
| CompTIA Security+ shows "in progress, expected Nov 2026". When it is earned, set `status: "earned"`, the date and note, optionally a `verify` link, then rerun `node scripts/assets/panels.mjs certs` and `room-still.mjs`. | `src/content/about.ts` |
| The record and music card ("Lowtide, Nocturne for Servers") are an invented artist and a synthesized loop. | `src/content/room.ts`, `scripts/assets/panels.mjs` |
| Theme: all four section accents collapse to mint. Mint-family offsets (for example seafoam `#6ff7c0` for Homelab and About) could help orientation on long scrolls. | `docs/theme/b.md` section 11, `src/styles/base.css` |
| Theme: hotspot hover fill is mint at 8%, which slightly greens the amber CRT and beige bezel while hovered; about 5% keeps objects closer to their colour. | `src/styles/lab.css` |
| Theme: the music notes above the turntable keep the scene's putty colour; switch that fill to mint if they should read as a HUD indicator. | `src/components/lab/art/objects/Record.tsx` |
| Theme: not applied under the colour rule, and only worth revisiting if the rule changes: the room recolour and window rain (b.md 3.10), the LED and chassis shifts (3.8), the poster, print and cover regeneration (8), and the project preview regeneration on the mint base (3.12). | `docs/theme/b.md`, `scripts/assets/work.mjs` |
