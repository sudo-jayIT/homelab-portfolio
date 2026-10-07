# Owner notes (source of truth for homelab content)

Facts supplied directly by the owner. Use these over any draft in `src/content/`.

Status (2026-10-06 pass): applied on the site. The rack order and hardware, what runs where, the section decisions, the phone number rule, the wall art decision, theme B with the colour rule and the first-visit intro sequence below are all live; `docs/PERSONALIZATION-TODO.md` section 2 lists where each one lives. The resume PDF at `/resume.pdf` still contains the phone number; it is an open item in `docs/PERSONALIZATION-TODO.md`.

## Rack (top to bottom, confirmed)

1. NETGEAR 5-port unmanaged switch
2. NETGEAR 8-port managed switch
3. HP ProDesk G3 Mini, pve1: Intel Core i5-6500T, 16 GB RAM, 86 GB storage
4. HP ProDesk G3 Mini, pve2: Intel Core i5-6500T, 16 GB RAM, 86 GB storage
5. HP ProDesk G3 Mini, pve3: Intel Core i5-6500T, 32 GB RAM, 256 GB storage
6. GMKtec G3 Pro, pve4: Intel Core i3-10110U, 8 GB RAM, 512 GB SSD
7. Raspberry Pi 4: wake-on-LAN scripts and the Proxmox QDevice (quorum)
8. 2x ZimaBoard 2 (1664): no role yet
9. UGREEN 2-bay NAS
10. 8-outlet PDU (bottom)

Rack: Tecmojo 12U 10-inch. pve1 to pve4 form a Proxmox VE cluster.

## Physical setup (owner photos and clarification, 2026-10-06)

- The 10-inch rack stands on a wood-topped workstation desk with three drawers and a black steel frame.
- Beside the rack is a CyberPower 1500VA UPS.
- A rounded white Google mesh Wi-Fi router sits on top of the UPS.
- The silver-front HP t730 thin client between the UPS and rack is the dedicated OPNsense firewall; it is separate from the Proxmox nodes.
- HP t730 specifications confirmed by the owner: AMD RX-427BB CPU, 8 GB RAM, 128 GB HDD.
- The homelab workstation is turned along the side wall, facing the parallel wall across the room.
- The main desk is a standing desk with telescoping columns and a height control.
- A glass-sided PC with purple fans and a vertical front display sits below its right side.
- A display rests on top of the rack; the supplied photos show Grafana.
- The rack has a solid black side panel with ventilation slots, blue patch leads at the top, and green Ethernet leads at the ZimaBoards.

## What runs where

- pve1 (critical services): AI agent jumpbox, Vaultwarden, Seafile, Immich, Wazuh, Caddy, Authentik, Jellyfin
- pve2: Homarr, Prometheus, Grafana, Trilium Notes, ntopng, Gitea
- pve3 (VMs): Home Assistant, Metasploitable, Kioptrix vulnerable machines, Kali Linux
- pve4: nothing yet (spare capacity)
- Raspberry Pi 4: wake-on-LAN scripts, QDevice
- ZimaBoards: unassigned

## Decisions

- No photography section (removed).
- No client websites section (owner does not build websites; keep it disabled).
- Room wall art (poster, print): leave as is for now.
- Phone number never appears in site text.
- Theme: B, Mint Terminal (spec in `docs/theme/b.md`), with one rule on top of the spec. The mint styling applies to the page frame: background (grid and gutter rain replacing the night sky), header, keycaps, cards, chips, section headings, terminal, HUD and panel chrome. Things that carry meaning through color keep their full color: the room scene (wood, lighting, certificates, poster, print, window, CRT, rug, plant), the rack hardware and its multicolor status LEDs, devicon tech icons, and project preview images. Do not monochrome-tint content or art.

## First-visit intro sequence (built)

Status: built 2026-10-06 (`src/components/lab/terminal/session.tsx`, `apt.tsx`, `commands.tsx`; package and summary data in `src/content/intro.ts`). The terminal part ends about 7.3 s after the page hydrates; `docs/BUILD-NOTES.md`, "First-visit intro", has the details and measured timings.

The terminal intro auto-types a short session that "installs" the portfolio, then opens the page:

1. tty header and `homelab login: guest` (kept, but the old service banner is dropped)
2. `guest@homelab:~$ sudo apt install kris-portfolio`, then `[sudo] password for guest:` with no echo, then realistic Debian apt output (reading package lists, NEW packages, Get line from a homelab-style repo such as `http://apt.homelab.lan stable/main`, unpack, apt's progress bar, `Setting up kris-portfolio (...)`)
3. `cd /opt/kris-portfolio` (prompt path updates)
4. `pf-whoami`, which prints a short identity summary built from site content (name, role line, school, current role, homelab one-liner, Security+ status) with green status dots, ending in a launch line
5. The page opens through the existing room power-up and camera hand-off to the landing page

"skip intro →" still skips from any point; returning visitors and reduced-motion users still skip the intro. The in-room shell also accepts `pf-whoami` and `sudo apt install kris-portfolio` (prints that the package is already the newest version).

## Still to come from the owner

- "Broke it, fixed it" stories
- More projects and their links/screenshots
- GitHub username

- Desktop PC (owner confirmed): HYTE Y70 Touch; ASUS TUF Gaming X870E-Plus WiFi; 64 GB (2 × 32 GB) Corsair Vengeance; RTX 4080 Super; 4 TB Samsung 990 Pro; Corsair fans and Corsair TITAN AIO. Case is under the standing desk, outside its right lifting column.
- PS5 replaces the decorative rubber-band ball; remove the record player from the room.

- PC interaction: selecting the case opens a component explorer with directly selectable graphics card, CPU/AIO cover, memory, motherboard, M.2 storage, fans and touchscreen. CPU model has not yet been supplied.

- PC artwork references: HYTE Y70 Touch family (https://hyte.com/store/y70/cs-hyte-y70tti-bb), ASUS TUF X870E-Plus (https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-x870e-plus-wifi7/), Corsair TITAN RX family (https://www.corsair.com/us/en/p/cpu-coolers/CW-9061018-WW/icue-link-aio-pump-cap-module-groove-cw-9061013-ww), and Corsair Vengeance RGB DDR5 (https://www.corsair.com/ww/en/p/memory/cmh32gx5m2d6000c36/vengeance-rgb-32gb-2x16gb-ddr5-dram-6000mhz-c36-memory-kit-black-cmh32gx5m2d6000c36). These guide shapes and materials; exact GPU manufacturer and CPU model remain unspecified. GPU shroud is illustrative, without claiming a specific partner design.
- Landing preview now uses a static image import so regenerating the still automatically changes its hashed URL and refreshes Next image optimization caches.

- PC photo corrections (IMG_8793–8798): MSI-branded silver/gray angular triple-fan RTX 4080 Super installed vertically; pale Corsair LCD pump with cyan ring; two bright white RGB Vengeance sticks to its right; dark braided tubes loop over the RAM; rear fan at left, three side intake fans at right with black X-shaped rear supports, top radiator fans, blue/purple lighting through a slotted lower floor. Exact MSI SKU and CPU model remain unconfirmed. Earlier generic GPU and pump drawings are superseded by these photos.

- PC case geometry is now shared between the room and component explorer: a 47 cm deep × 32 cm wide × 47 cm high shell with an 8 cm front corner cut. The inspector uses one orthographic camera (40-degree yaw, 12-degree elevation), so the side glass, corner touchscreen, front glass, top mesh and base share consistent axes. The room uses its standard isometric camera on that same shell.
