# 07 · Homelab section (`section#homelab`)

Area key: `homelab`. Source of truth: client module `31532` (component `Homelab`) in `0a3~eqffmh-1p.js`, rack geometry module `78428`, LED palette module `66109`, seeded RNG module `85142`, data module `13003`, view store module `54773`. Values below were read from code and confirmed with computed styles in headless Chrome at 1440, 1280, 1024, 768, 640 and 390 px.

---

## 1. Overview

Section 02 of the classic (scrolling) page. It opens with the shared section heading (eyebrow `02. SELF-HOSTED`, giant condensed `HOMELAB` title, one-sentence lede), then a two-column layout: on the left, a dark card holding a code-drawn front-view SVG of a 10-inch 6U rack with five numbered callout bubbles, followed by a numbered hardware list; on the right, a mono header with the host line, a bordered list of seven numbered services (each with a softly pulsing green status dot), a pair of sub-blocks ("Locked down" chips and "Broke it, fixed it" bullets), and a quiet mono text button that enters the immersive room view. The mood is a calm, technical spec sheet: near-black navy panels, a lavender section accent (`--dusk`, `#a58bff`), condensed uppercase display type, and tiny blinking LEDs that make the rack feel powered on. Motion is restrained: three fade-up reveals on scroll plus perpetual LED blinking; nothing is pinned or scrubbed, and there is no hover linking between the diagram and the list.

---

## 2. Structure

Component tree with exact classes (Tailwind v4). `BlurFade` is a `motion.div` (see section 4).

```
section#homelab[data-sec="dusk"]            .py-24 md:py-32 px-6 border-t border-white/[0.06]
└─ div                                       .max-w-6xl mx-auto                      (1152px)
   ├─ BlurFade (delay 0)                     .mb-12 md:mb-16          ← shared SectionHeading
   │  ├─ p                                   .text-sec text-xs font-mono tracking-[0.2em] uppercase mb-3
   │  │  ├─ span                             .opacity-70 mr-2        → "02."
   │  │  └─ "Self-hosted"
   │  ├─ h2                                  .display sec-title      → "Homelab"
   │  └─ p (lede)                            .text-white/65 text-lg mt-5 max-w-lg
   └─ div (main grid)                        .grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14
      ├─ BlurFade (delay 0.05)               (left column, no class)
      │  ├─ p                                .font-mono text-xs uppercase tracking-[0.2em] mb-5 text-sec   → "The hardware"
      │  └─ div (rack card)                  .relative rounded-2xl border border-white/10 bg-[#0a0d19] p-5 md:p-6
      │     ├─ div (card header)             .mb-4 flex items-baseline justify-between gap-3 font-mono text-[11px] text-white/45
      │     │  ├─ span                       → rack title (data)
      │     │  └─ span                       .shrink-0 uppercase tracking-[0.2em]   → "front"
      │     ├─ svg[role=img]                 .mx-auto block h-auto w-full max-w-[26rem] [mask-image:linear-gradient(#000_90%,transparent)]
      │     │                                viewBox="-10 -12 103 101"   (see 3.4)
      │     └─ ol (hardware list)            .mt-5 grid gap-x-6 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2
      │        └─ li ×5                      .flex gap-3
      │           ├─ span (number badge)     .mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sec/60 font-mono text-[10px] font-bold text-sec
      │           └─ div                     .min-w-0
      │              ├─ p (name)             .text-sm font-medium leading-snug text-white
      │              └─ p (meta)             .mt-0.5 text-xs leading-relaxed text-white/55
      │                 ├─ span (kicker)     .text-sec/80
      │                 ├─ " · "
      │                 └─ spec line
      └─ BlurFade (delay 0.15)               (right column, no class)
         ├─ div (header row)                 .mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1
         │  ├─ p                             .font-mono text-xs uppercase tracking-[0.2em] text-sec   → "What I've built on it"
         │  └─ p                             .font-mono text-[11px] text-white/45   → "{host} · {os}"
         ├─ ol (services)                    .divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d19]
         │  └─ li ×7                         .grid grid-cols-[2.75rem_minmax(0,1fr)] md:grid-cols-[3.25rem_minmax(0,1fr)]
         │     ├─ div (index rail)           .flex flex-col items-center gap-2.5 border-r border-white/[0.07] bg-white/[0.03] pt-5 font-mono text-[10px] text-white/40
         │     │  ├─ "01".."07"              (String(i+1).padStart(2,"0"))
         │     │  └─ span[aria-hidden]       .lab-led-pulse h-1.5 w-1.5 rounded-full bg-emerald-400   style="animation-delay:-{0.7*i}s"
         │     └─ div                        .p-5 md:px-6
         │        ├─ h3                      .display text-[1.55rem] text-white   → service name
         │        └─ p                       .mt-2 text-sm leading-relaxed text-white/65   → service role
         ├─ div (sub-blocks grid)            .mt-9 grid gap-9 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]
         │  ├─ div
         │  │  ├─ p                          .font-mono text-xs uppercase tracking-[0.2em] mb-3 text-white/50   → "Locked down"
         │  │  └─ ul                         .flex flex-wrap gap-1.5
         │  │     └─ li ×6                   .rounded-lg border border-sec/25 bg-sec/10 px-2.5 py-1 text-xs text-sec
         │  └─ div
         │     ├─ p                          .font-mono text-xs uppercase tracking-[0.2em] mb-3 text-white/50   → "Broke it, fixed it"
         │     └─ ul                         .space-y-2.5
         │        └─ li ×3                   .flex gap-3 text-sm leading-relaxed text-white/65
         │           ├─ span                 .shrink-0 text-sec/70   → "›"
         │           └─ story text
         └─ button[type=button]              .mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-white/40 transition-colors hover:text-white/80
                                             → "see it in the room →"
```

Placement in the page: `section#homelab` is the second child section inside `main > div.relative.z-10.overflow-clip > div.relative`. That ancestor `div.relative.z-10.overflow-clip` carries the inline background `linear-gradient(180deg, #06080f 0%, #080b16 30%, #0b0f1d 65%, #121129 88%, #1c1530 100%)` and the starfield / moon / constellation decorations (separate area). The section itself is transparent. It has the `[data-classic]` behavior of its wrapper: hidden by `html[data-view="room"] [data-classic] { display:none }`.

The whole `Homelab` module is a client component in the original (`"use client"`; referenced from the RSC payload as `I[31532,…,"Homelab"]`), but it is fully server-rendered into the HTML with the BlurFade wrappers at `style="opacity:0;transform:translateY(14px)"`.

---

## 3. Styling

### 3.1 Tokens used

| Token | Value | Where |
|---|---|---|
| `--sec` | `var(--dusk)` = `#a58bff` via `[data-sec="dusk"]` | all `*-sec` utilities in this section |
| `--color-sec` (Tailwind theme, inline) | `var(--sec, #e6d9b5)` | `text-sec`, `border-sec/60`, `bg-sec/10`, `fill-sec`, `stroke-sec` |
| Opacity variants | `color-mix(in oklab, var(--sec) N%, transparent)` | `/25`, `/60`, `/70`, `/80`, `/10` |
| Panel fill | `#0a0d19` (rgb 10,13,25) | rack card, services list, callout bubble fill |
| Panel border | `rgba(255,255,255,0.10)` 1px | rack card, services list |
| Row divider | `rgba(255,255,255,0.07)` 1px | services `divide-y`, index rail `border-r` |
| Index rail fill | `rgba(255,255,255,0.03)` | services index column |
| Section top rule | `rgba(255,255,255,0.06)` 1px | `section` `border-t` |
| Status dot | Tailwind v4 `emerald-400` = `oklch(76.5% 0.177 163.223)` ≈ `#00d294` | service LED |
| Title cream | `#f7f4ec` | `.sec-title` h2 |
| Body text | `#f0f0f0` (inherited from body) | defaults |

`.display` = `font-family: var(--font-archivo), "Arial Narrow", system-ui, sans-serif; text-transform: uppercase; font-weight: 900; font-stretch: 62%; line-height: 0.9`.
`.sec-title` = `color: #f7f4ec; font-size: clamp(2.6rem, 13vw, 5.5rem)`.
`.lab-mono` (SVG text) = `font-family: var(--font-geist-mono), ui-monospace, monospace`.

### 3.2 Typography (computed at 1440 px)

| Element | Family | Size / line-height | Weight | Tracking | Transform | Color |
|---|---|---|---|---|---|---|
| Eyebrow `02. SELF-HOSTED` | Geist Mono | 12px / 16px | 400 | 2.4px (0.2em) | uppercase | `#a58bff`; the `02.` span at opacity 0.7, `margin-right: 8px` |
| h2 `HOMELAB` | Archivo (wdth 62%) | 88px / 79.2px (390 px viewport: 50.7px) | 900 | normal | uppercase | `#f7f4ec` |
| Lede | Geist | 18px / 28px, max-width 512px | 400 | normal | none | white 65% |
| Column labels (`THE HARDWARE`, `WHAT I'VE BUILT ON IT`) | Geist Mono | 12px / 16px | 400 | 2.4px | uppercase | `#a58bff` |
| Card header left (rack title) | Geist Mono | 11px / 16.5px | 400 | normal | none | white 45% |
| Card header right `FRONT` | Geist Mono | 11px / 16.5px | 400 | 2.2px | uppercase | white 45% |
| Hardware number badge | Geist Mono | 10px / 15px | 700 | normal | none | `#a58bff`; border `--sec` at 60% |
| Hardware name | Geist | 14px / 19.25px (`leading-snug`) | 500 | normal | none | `#fff` |
| Hardware meta | Geist | 12px / 19.5px (`leading-relaxed`) | 400 | normal | none | white 55%; kicker `--sec` at 80% |
| Host line | Geist Mono | 11px / 16.5px | 400 | normal | none | white 45% |
| Service index `01` | Geist Mono | 10px / 15px | 400 | normal | none | white 40% |
| Service name h3 | Archivo (wdth 62%) | 24.8px (1.55rem) / 22.32px | 900 | normal | uppercase | `#fff` |
| Service role | Geist | 14px / 22.75px | 400 | normal | none | white 65% |
| Sub-block labels (`LOCKED DOWN`, `BROKE IT, FIXED IT`) | Geist Mono | 12px / 16px | 400 | 2.4px | uppercase | white 50% |
| Chip | Geist | 12px / 16px | 400 | normal | none | `#a58bff` |
| Story text | Geist | 14px / 22.75px | 400 | normal | none | white 65%; `›` bullet `--sec` at 70% |
| CTA button | Geist Mono | 11px / 16.5px | 400 | 2.42px (0.22em) | uppercase | white 40%, hover white 80% |

### 3.3 Box model (computed)

| Element | Values |
|---|---|
| section | padding 96px 24px (base), 128px 24px (md+); border-top 1px white 6% |
| inner wrapper | max-width 1152px, centered |
| heading block | margin-bottom 48px (base), 64px (md+) |
| main grid | gap 48px (base); lg+: columns `minmax(0,5fr) minmax(0,7fr)`, gap 56px. At 1152px wide: 456.66px + 639.34px |
| column label margin | 20px below (`mb-5`) |
| rack card | radius 16px, 1px border white 10%, bg `#0a0d19`, padding 20px (base) / 24px (md+), `position: relative`, no shadow |
| card header | flex, baseline aligned, space-between, gap 12px, margin-bottom 16px |
| SVG | width 100% up to 416px (`26rem`), auto height (aspect 103:101), centered; at 1440 it renders 406.7 x 398.8px |
| hardware ol | margin-top 20px; row gap 14px, column gap 24px |
| hardware li | flex, gap 12px; badge 20 x 20px, margin-top 2px, fully round; meta margin-top 2px |
| right header row | flex wrap, baseline, space-between, column gap 24px, row gap 4px, margin-bottom 20px |
| services ol | radius 16px, 1px border white 10%, bg `#0a0d19`, `overflow: hidden`; 1px white 7% border-bottom between rows |
| service li | grid columns 44px + 1fr (base) or 52px + 1fr (md+) |
| index rail | flex column, centered, gap 10px, padding-top 20px, border-right 1px white 7%, bg white 3%; spans full row height |
| service body | padding 20px (base), 20px 24px (md+); role margin-top 8px |
| status dot | 6 x 6px, round |
| sub-blocks grid | margin-top 36px, gap 36px; md+: `minmax(0,2fr) minmax(0,3fr)` (241.3px + 362px at 1440) |
| chip list | flex wrap, gap 6px |
| chip | radius 8px, 1px border `--sec` 25%, bg `--sec` 10%, padding 4px 10px |
| story list | 10px between items; li flex gap 12px |
| CTA | margin-top 40px, inline-block, no padding, no background |

Measured section height: 1712px at 1440 and 1280; 1780px at 1024; 2405px at 768; 2552px at 640; 2873px at 390.

### 3.4 Rack diagram (code-drawn SVG)

All numbers are SVG user units. One rendered unit is about 3.95px at 1440 (406.7 / 103) and 4.04px at the 416px cap.

**Coordinate system and constants**

| Name | Value | Meaning |
|---|---|---|
| `viewBox` | `-10 -12 103 101` | equals `(-10, -12, W+27, H+22)`; leaves room for handles above, plinth below, callouts to the right |
| `W` | 76 | rack outer width |
| `H` | 79 | rack outer height |
| top band | y 0 to 8 | rack top frame (`TF = 8`) |
| `U` | 11 | one rack unit |
| U slots | U6 8..19, U5 19..30, U4 30..41, U3 41..52, U2 52..63, U1 63..74 | slotTop(n) = 8 + (6 − n) × 11 |
| bottom band | y 74 to 79 | rack bottom frame (`BF = 5`) |
| posts | x 0..7 and 69..76 (`P = 7`) | vertical frame members |
| rails | x 2..8 and 68..74, width 6 | dark mounting rails, drawn only where a shelf sits |
| inner bay | x 7..69 (62 wide) | interior back wall visible here |
| callout column | x = W + 11 = 87 | centre of numbered bubbles |
| depth `D` | 50 | used only by the 3D room version |

**Draw order (back to front)**

1. **Carry handles** (two). Inverted-U open paths from (x1, 0) up to y −8, across to x2, back down to y 0. Spans: x 7..26 and x 50..69 (i.e. `[7, 26]` and `[W−26, W−7]`). Each drawn twice: a 2.6-wide stroke `#2a2e33`, then a 0.5-wide highlight stroke `rgba(255,255,255,0.18)` on the same path. `fill: none`, `stroke-linejoin: round`. Reads as a dark tube handle with a thin specular line.
2. **Rack front (`RackFront`)**
   - Interior: rect 0,0 76 x 79 `#0a0c0e`.
   - Posts: rect x 0 w 7 h 79 and x 69 w 7 h 79, `#d6dadd` (light grey, the rack is a white-framed model).
   - Top band: rect 76 x 8 `#e2e5e7` (slightly lighter than posts).
   - Bottom band: rect y 74, 76 x 5 `#d6dadd`.
   - Vendor wordmark on the top band, two lines: a small mono word at (34.5, 3), size 1.8, `#111`; a bold word centred at (38, 6.6), size 3.8, weight 700, letter-spacing 0.2, `#111` (inherits Geist sans).
   - U markings, for r = 0..5: screw holes at (3.5, 8+11r+5.5) and (72.5, same), r 0.8, `#7d8489`; U number text at (3.5, 8+11r+2.6), size 1.4, `#8a9196`, centred, reading `06` at the top down to `01` at the bottom. **In this front view every U number and nearly every screw hole is covered by gear or rails drawn after them**; only two half-holes peek out below the patch strip at y 24.5. Keep them in the clone for fidelity (they show if a slot is left empty).
   - **U6: blank 1U panel.** Rect x 2, y 8.3, 72 x 10.4, `#0e1012`, stroke `rgba(255,255,255,0.06)` 0.3. Four screws r 0.9 `#454b50` at (4, 10.6), (4, 16.4), (72, 10.6), (72, 16.4). (In the original a rear-mounted power strip lives behind this slot; callout 1 points here.)
   - **U5: half-U patch strip** at translate(2, 19.3): rect 72 x 5.4 `#0b0c0e`, stroke `rgba(255,255,255,0.08)` 0.3. Vendor label left at (6.4, 3.4) and cable-category label right-aligned at (65.4, 3.4), both size 1.3 `#e5e7eb`. 12 keystone ports at x = 11 + (50/12)·i, y 1.3, 2.9 x 2.8 `#040506`; ports with index 2..9 (8 ports) get a white plug inset at +0.2, y 1.6, 2.5 x 2.4 `#eef1f3`. The rest of U5 below the strip (y 24.7..30) is open: light posts and the dark interior show, and patch cables pass through.
   - **U4: shelf + 8-port switch.** Rail blocks rect x 2 and x 68, y 30.5, 6 x 10, `#121416`. Shelf lip rect x 7, y 40, 62 x 1, `#1d2023`. Switch at translate(13, 32.2): body 50 x 7.6 `#262a2e`, stroke `rgba(255,255,255,0.1)` 0.3; lowercase vendor word at (1.4, 2.2) size 1.5 `rgba(255,255,255,0.6)`; model number right-aligned at (48.6, 2.2) size 1.15 `rgba(255,255,255,0.4)`; 8 RJ45 ports at x = 11 + 4.6·i, y 3.3, 3.4 x 2.9 `#060708` (no plugs drawn in this view).
   - **Patch cables** (drawn after the switch so they lie over it): group `fill none`, stroke `#eef1f3`, width 0.9, `stroke-linecap: round`, opacity 0.85. Eight cubic Béziers, one per patched port i (patch port index p = 2..9, switch port index r = 0..7). Start S = (2 + patchX(p) + 1.45, 23.3), end E = (13 + swX(r) + 1.7, 35.6). Control points: C1 = (S.x − 1.5, S.y + 6), C2 = (E.x + 2.5, E.y − 5). Result: eight parallel white S-curves leaning right as they drop from the strip into the switch ports.
   - **U3 to U2: 2U shelf** for non-rackmount gear. Rail blocks x 2 and x 68, y 41.5, 6 x 21, `#121416`. Lip x 7, y 62, 62 x 1, `#1d2023`.
     - **External drive** (stacked on the mini PC) at translate(31, 46.6): rounded rect 28 x 4.4, rx 0.8, `#6a6f74`; perforation of 3 rows x 15 dots, cx = 1.6 + 1.6·i + (row odd ? 0.8 : 0), cy = 1 + 1.2·row, r 0.32, `#575b60`.
     - **Mini PC** at translate(12, 51), body 50 x 10.8 `#121417`, stroke `rgba(255,255,255,0.08)` 0.3. Vendor badge rect (1, 0.6) 7 x 1.8 `#2b2f33` with a centred word at (4.5, 2) size 1.2 `#cbd5e1`. Vent field 5 rows x 15 holes, cx = 2 + 1.65·i + (row odd ? 0.82 : 0), cy = 3.6 + 1.5·row, r 0.5 `#050607`. Red vertical model strip rect (27.8, 1) 2.6 x 8.6 `#b91c1c` with a white model word size 1.5 rotated −90° centred at (29.6, 5.3). Two USB slots rect (32.2, 4) and (36.2, 4), 3.2 x 1.5 `#050607`; audio jack circle (40.8, 4.8) r 0.7 `#050607`. Italic series word right-aligned at (49, 2.6) size 1.5 `rgba(255,255,255,0.7)`. Power button ring circle (46.5, 6.8) r 1.5 `#0c0d0f`, stroke `#5b6167` 0.3.
   - **U1: empty slot with vent.** Rail blocks x 2 and x 68, y 63.5, 6 x 10 `#121416`. Vent strip rect x 7, y 72, 62 x 2 `#15181b` with 26 slots at x = 9 + 2.2·r, y 72.4, 1 x 1.2 `#050607`.
3. **LEDs** (drawn over the rack front; local simplified LED: a halo circle radius 3r, same color, opacity 0.2, plus a core circle radius r; both wrapped in a `<g>` that carries the blink class and inline timing):

   | LED | Centre | r | Color | Blink |
   |---|---|---|---|---|
   | Switch port activity ×8 | (13 + 11 + 4.6·i + 1.7, 34.8) | 0.45 | green `#4ade80` | `lab-led-act` |
   | Switch power | (15.2, 38.2) | 0.5 | green `#4ade80` | steady |
   | Mini PC power (inside the button ring) | (58.5, 57.8) | 0.6 | white `#f1f5f9` | steady |
   | Mini PC disk | (45.8, 58.6) | 0.35 | amber `#fbbf24` | `lab-led-disk` |
   | External drive activity | (57.4, 48.8) | 0.45 | blue `#60a5fa` | `lab-led-disk` |

   The switch activity LEDs sit just above the ports, partially overlapping the cable ends.
4. **Plinth / shelf the rack stands on.** Rect x −8.5, y 79, 93 x 10, `#14171a`; top edge highlight rect same x/w, height 0.6, `rgba(255,255,255,0.14)`. Label plate rect (−3, 81.6) 22 x 4.6, rx 0.4, `#eeece4` (warm off-white) with `HOMELAB` centred at (8, 85), size 2.9, weight 700, `#111`, `.lab-mono`, letter-spacing 0.4.
5. **Callouts** (last, so they overlay everything). One per hardware list item, in list order. For a part with local box `u = [x0, x1]`, `v = [y0, y1]`: `cy = (y0 + y1) / 2`.
   - Leader: horizontal path from (x1 − 1.5, cy) to (87 − 3.4, cy), `stroke: var(--sec)` (class `stroke-sec`), width 0.45, no fill.
   - Anchor dot: circle (x1 − 1.5, cy), r 0.9, `fill: var(--sec)`.
   - Bubble: circle (87, cy), r 3.4, fill `#0a0d19` (same as the card, so it reads as a cut-out ring), `stroke: var(--sec)` 0.6.
   - Number: text (87, cy + 1.25), size 3.6, weight 700, centred, `.lab-mono fill-sec`, `1`..`5`.

   Part boxes in the original (`PART_LOCAL`, x range `u`, y range `v`):

   | # | Part | u | v | cy | Anchor x |
   |---|---|---|---|---|---|
   | 1 | rear power strip (behind U6 blank) | 2..74 | 9.5..17.5 | 13.5 | 72.5 |
   | 2 | patch strip | 2..74 | 19.3..24.7 | 22 | 72.5 |
   | 3 | switch | 13..63 | 32.2..39.8 | 36 | 61.5 |
   | 4 | external drive | 31..59 | 46.6..51 | 48.8 | 57.5 |
   | 5 | mini PC | 12..62 | 51..61.8 | 56.4 | 60.5 |
   | (rack) | whole rack | 0..76 | 0..79 | n/a | n/a |

   Leaders cross the right post and rails in front of the gear. Bubbles have a diameter of 6.8 units; adjacent `cy` values must differ by at least 6.8 to avoid overlap (closest pair in the original: 48.8 and 56.4, gap 7.6).

**Whole-SVG treatment.** `mask-image: linear-gradient(#000 90%, transparent)` (top to bottom). The fade covers the bottom 10.1 units (y ≈ 78.9 to 89), which is exactly the plinth: the label plate and plinth fade from solid at their top edge to transparent at the bottom, giving the label a lit-from-above gradient look. No filters, gradients, patterns or `<defs>` are used in this SVG; the room-view version of the same parts uses radial glow gradients instead of the 20% halo circles.

**Palette summary.** Frame `#d6dadd` / `#e2e5e7`; interior `#0a0c0e`; gear faces `#0e1012`, `#0b0c0e`, `#262a2e`, `#121417`; rails `#121416`; lips `#1d2023`; vent `#15181b`; holes `#040506` to `#060708`; screws `#454b50`, `#7d8489`; handles `#2a2e33`; cables / plugs `#eef1f3`; drive `#6a6f74` / `#575b60`; model strip `#b91c1c`; plinth `#14171a`; label plate `#eeece4`; ink `#111`; LEDs green `#4ade80`, white `#f1f5f9`, amber `#fbbf24`, blue `#60a5fa`; callouts `--sec` (`#a58bff`) on `#0a0d19`.

**Generic recipe for any 6U stack (for our different sample hardware).**
- Keep W 76, H 79, U 11, the posts, bands, handles, plinth and callout column unchanged.
- Each device declares `{ kind, slot (top U), heightU, box: {u:[x0,x1], v:[y0,y1]} }`.
- Rack-mount 1U gear (blank, PDU face, 1U server): full width x 2..74 starting at slotTop + 0.3, height 10.4, with ear screws at x 4 / 72.
- Half-U strips (patch panel, brush panel): x 2..74, height 5.4, at slotTop + 0.3.
- Non-rackmount gear on a shelf of k units: rail blocks x 2 and x 68 from slotTop + 0.5 with height 11k − 1, lip at slotBottom − 1 (62 wide, 1 tall); the device's bottom edge sits at lip top − 0.2 and is horizontally inset (x 12..63 range in the original).
- Stacked boxes rest directly on the device below (bottom edge = top of the lower device).
- Empty units: either leave the light posts and dark interior visible, or close with a vent strip (U1) or blank panel.
- Callouts: one per listed part in list order; anchor at the box's right edge − 1.5 and vertical centre.

---

## 4. Animation and timing

No GSAP and no ScrollTrigger are used in this section. Everything is either `motion` (`whileInView`) or CSS keyframes.

### 4.1 BlurFade reveals (motion)

Shared wrapper (module `82821`):

```ts
<motion.div
  initial={{ opacity: 0, y: 14 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.15 }}
  transition={reduced ? { duration: 0 } : { duration: 0.5, delay, ease: "easeOut" }}
/>
```

- `reduced` is read once at mount from motion's reduced-motion store (`useState(prefersReducedMotion.current)`), not reactively.
- `easeOut` in motion is cubic-bezier(0, 0, 0.58, 1). No blur despite the name.
- Three independent instances, each with its own IntersectionObserver at threshold 0.15:

| Target | Delay | Trigger |
|---|---|---|
| Section heading block | 0s | 15% of the heading block visible |
| Left column (label + rack card) | 0.05s | 15% of the left column visible |
| Right column (services, sub-blocks, CTA) | 0.15s | 15% of the right column visible |

- On lg+ both columns sit in one row, so they enter together and the right lags by 100ms. Below 1024px the right column is stacked and much taller (1128px at 768, 1655px at 390); it fires only when about 15% of it is on screen (measured: when its top passes about 855px from the viewport top at 768x1024, and about 596px at 390x844).
- `once: true`: never re-hides.
- SSR HTML ships each wrapper with `style="opacity:0;transform:translateY(14px)"`; without JS the section stays invisible.
- A programmatic jump that scrolls past an element faster than the observer samples can skip a reveal (seen in automated captures); real wheel or touch scrolling always triggers it.

### 4.2 LED keyframes (CSS, global stylesheet)

```css
.lab-led-act   { animation: 1.2s step-end infinite lab-act; }   /* duration overridden inline */
.lab-led-disk  { animation: 3s step-end infinite lab-disk; }    /* duration overridden inline */
.lab-led-pulse { animation: 3.2s ease-in-out infinite lab-pulse; }

@keyframes lab-act  { 0%{opacity:1} 8%{opacity:.15} 13%{opacity:1} 36%{opacity:.2} 40%{opacity:1}
                      61%{opacity:.1} 65%{opacity:1} 71%{opacity:.3} 75%{opacity:1} }
@keyframes lab-disk { 0%,to{opacity:.12} 4%{opacity:1} 7%{opacity:.2} 10%{opacity:1} 13%{opacity:.12}
                      52%{opacity:.12} 55%{opacity:1} 58%{opacity:.3} 61%{opacity:1} 64%{opacity:.12} }
@keyframes lab-pulse { 0%,to{opacity:1} 50%{opacity:.35} }
```

`step-end` (computed `steps(1)`) makes act/disk LEDs snap between levels like real activity lights: act LEDs are mostly on with four short dips per cycle; disk LEDs are mostly dim with two double-flashes per cycle.

**Per-LED timing (deterministic).** A seeded PRNG (mulberry32, seed 2026) produces 10 pairs `[a, b]` at module load. For LED k with blink kind `K` and range `[min, max]` (`act: [0.7, 1.9]`, `disk: [1.8, 4.6]`, `pulse: [2.6, 4.4]` exists but is unused here):

```ts
const dur = min + a * (max - min);
style = { animationDuration: `${dur.toFixed(2)}s`, animationDelay: `${(-b * dur).toFixed(2)}s` };
```

Pairs 0 to 7 drive the switch LEDs, pair 8 the mini PC disk LED, pair 9 the external drive LED. Measured output:

| LED | Duration | Delay |
|---|---|---|
| switch port 1..8 | 1.25, 1.49, 0.88, 1.52, 1.05, 0.78, 1.17, 0.92 s | −0.38, −0.92, −0.20, −1.22, −0.04, −0.48, −0.13, −0.30 s |
| mini PC disk | 2.94 s | −2.71 s |
| drive activity | 3.38 s | −0.01 s |

Negative delays start each LED mid-cycle so nothing blinks in sync. The whole `<g>` (halo + core) blinks together.

**Service status dots.** `lab-led-pulse` 3.2s ease-in-out infinite; inline `animation-delay: -(0.7 × i)s` for i = 0..6 (`0s, -0.7s, -1.4s, -2.1s, -2.8s, -3.5s, -4.2s`), so the seven dots breathe as a slow descending wave (opacity 1 to 0.35).

### 4.3 Transitions

| Element | Property | Duration | Easing |
|---|---|---|---|
| CTA button | `color` (Tailwind `transition-colors` list) | 150ms | cubic-bezier(0.4, 0, 0.2, 1) |

Measured hover ramp: alpha 0.40 → 0.72 (≈50ms) → 0.80 (≈150ms).

---

## 5. Interaction and state

- **Diagram to list linking: none.** There are no event handlers on the SVG, callouts or list items, no `data-*` hooks, no hover or focus styles, and no connector between the list and the bubbles other than shared numbering. The SVG is `role="img"`; its parts are not focusable. Hovering list items, chips, service rows or the SVG changes nothing (verified computed styles before and after hover). Cursor stays `auto` everywhere except the CTA (`default`).
- **Only focusable element:** the CTA `<button>`.
- **CTA "see it in the room →"** (rendered uppercase as `SEE IT IN THE ROOM →`):

  ```ts
  function seeInRoom() {
    const door = document.querySelector('[data-room-door]');   // the "step inside" mini-room button in the landing hero
    if (!door) return setView('room');
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => door.click());
  }
  ```

  The door's click handler measures the hero room image and calls `enterRoom(imageBox, restBox, 18)`, which sets `html[data-been-inside]`, then `setView('room')`: `html[data-view="room"]`, `history.scrollRestoration = "manual"`, another instant scroll to top, and `window.dispatchEvent(new Event("yg:view"))`. CSS then hides `[data-classic]` content and shows the interior room with its zoom-in entrance (owned by the room/hero spec). Effects measured: URL unchanged (no hash, no history entry), `scrollY` 0, `localStorage` contains `yg-lab` afterwards, the room overview is visible about 100ms after the click and fully settled with the "step outside" (Esc) control by about 4s. The CTA does not focus or zoom to the rack hotspot; it lands on the room overview.
- **Nav coupling (other area):** the top nav highlights "Homelab" while this section crosses the band `rootMargin: -40% 0px -55% 0px`. In room mode the nav item maps to the `rack` hotspot.
- `html { scroll-behavior: smooth }` (auto under reduced motion) applies to `#homelab` anchor jumps; the section has no `scroll-margin`, the 128px top padding clears the 64px fixed header.
- No keyboard handlers in this section; no localStorage reads/writes of its own.

---

## 6. Responsive behavior

| Viewport | Changes |
|---|---|
| base (<640) | section padding 96/24; heading mb 48; h2 `13vw` (50.7px at 390); single column (left then right, gap 48); card padding 20; hardware list 1 column; services index rail 44px, body padding 20 all round; sub-blocks stacked (Locked down above Broke it), gap 36; host line wraps under the label (flex-wrap) |
| sm ≥640 | hardware list 2 columns (gap-x 24, gap-y 14); h2 83.2px at 640 |
| md ≥768 | section padding 128/24; heading mb 64; card padding 24; services index rail 52px, body padding 20/24; sub-blocks side by side 2fr / 3fr; h2 hits the 88px cap from 677px up |
| lg ≥1024 | main grid 5fr / 7fr, gap 56; hardware list back to 1 column (card is narrow, 383px at 1024); right header label and host line may wrap onto two lines (they do at 1024) |
| xl ≥1280 | hardware list 2 columns again inside the card (191px each at 1280 / 1440) |
| ≥1312 | content capped at 1152px and centred; 1280 and 1440 render identically apart from side margins |

SVG width at each size: 300px (390), 416px cap (640, 768, centred in the wider card), 333px (1024), 407px (1280 / 1440). The diagram always keeps its 103:101 aspect.

Coarse pointer: no specific variants in this section (no `@media (pointer: coarse)` or hover-only content). Touch users simply never see the CTA hover color. The mobile `--mobile` emulation renders the same layout as a 390px desktop window.

---

## 7. Accessibility and reduced motion

- SVG: `role="img"` with a descriptive `aria-label` (one sentence naming the rack size and the main devices, about 120 characters). Callout numbers and faceplate text inside are not separately exposed.
- Hardware list is a real `<ol>` and also renders a visible number span, so screen readers announce both the list position and the digit.
- Service list is an `<ol>`; the visible `01`..`07` text is read; the status dot is `aria-hidden`.
- Headings: `h2` for the section, `h3` per service; column labels and sub-block labels are plain `<p>` (not headings).
- CTA is a native `<button type="button">`; no `aria-label`, arrow glyph is part of the accessible name; keyboard focus shows the browser default ring (computed `outline: auto 1px`, rendered as a white rounded ring hugging the text); `cursor: default` (Tailwind v4 preflight), no custom `focus-visible` style.
- Contrast notes: CTA at white 40% and service index at white 40% on `#0a0d19`/sky are low contrast by design.
- `prefers-reduced-motion: reduce`:
  - `.lab-led-act, .lab-led-disk, .lab-led-pulse { animation: none }`: all LEDs and status dots render steady at full opacity.
  - BlurFade transitions get `duration: 0` (content appears immediately when in view).
  - `html` scroll-behavior becomes `auto`.
  - Verified in headless Chrome with `reducedMotion: 'reduce'`: `animation-name` computes to `none` for every LED.

---

## 8. Content model

```ts
// Hardware parts (shared with the room view, which also uses href/extra/specs)
type PartKey = 'rack' | 'patch' | 'switch' | 'compute' | 'storage' | 'power';

interface HardwarePart {
  kicker: string;        // lowercase category, 7 to 12 chars; may contain " · " (e.g. "power · rear")
  title: string;         // product name, 15 to 32 chars
  specs: string[];       // 2 to 3 short lines, 10 to 55 chars, using " · " and "×" separators
  href?: string;         // purchase / reference link (not shown in this section)
  extra?: { label: string; href: string }; // not shown in this section
}

interface PartGeometry {            // front-view box in rack units (see 3.4)
  u: [number, number];              // x range
  v: [number, number];              // y range
  d: [number, number];              // depth range, used by the 3D room view only
}

// Which hardware entries appear in the list / callouts, in order (5 items)
const HARDWARE_LIST: PartKey[];     // original order: power, patch, switch, storage, compute
const SPEC_INDEX: Partial<Record<PartKey, number>>; // which spec line to show; default 0 (original: patch → 1, storage → 1)

interface HomelabService {
  name: string;          // 5 to 21 chars, rendered uppercase condensed; may contain "→" or "+"
  unit: string;          // short id, 5 to 9 chars (used by the terminal elsewhere)
  short: string;         // 25 to 45 char summary (used by the terminal elsewhere)
  role: string;          // 79 to 114 chars, one sentence fragment, lowercase start, no final period
}

interface HomelabData {
  host: string;          // machine name, about 29 chars
  os: string;            // about 27 chars, " · " separated (OS · mode · uptime promise)
  services: HomelabService[];   // 7
  hardening: string[];   // 6 chips, 8 to 55 chars, lowercase fragments, may contain "→" and "%"
  stories: string[];     // 3 sentences, 115 to 144 chars, end with a period
}
```

Counts: 5 hardware list items (rack itself is the card header, not listed); 5 callouts; 7 services; 6 hardening chips (two wrap to two lines in a 241px column); 3 stories. Lede about 128 characters (wraps to 3 lines at 512px). Rack title (card header) about 28 chars.

Meta line format: `{kicker} · {specs[SPEC_INDEX[key] ?? 0]}`, the kicker in accent color.

Generic UI labels (verbatim, source casing; CSS uppercases where noted):

| Label | Rendered |
|---|---|
| eyebrow index `02` + `.` and kicker `Self-hosted` | `02. SELF-HOSTED` |
| title `Homelab` | `HOMELAB` |
| `The hardware` | `THE HARDWARE` |
| `front` | `FRONT` |
| `What I've built on it` | `WHAT I'VE BUILT ON IT` |
| `Locked down` | `LOCKED DOWN` |
| `Broke it, fixed it` | `BROKE IT, FIXED IT` |
| `see it in the room →` | `SEE IT IN THE ROOM →` |
| story bullet | `›` |
| plinth plate in SVG | `HOMELAB` |
| service index | `01` … `07` |
| meta separator | ` · ` |

---

## 9. Assets

| Original | Replacement plan |
|---|---|
| Rack diagram: 100% code-drawn inline SVG, no images, includes real vendor wordmarks and model names on faceplates | Draw an original rack in the same coordinate system with fictional or neutral wordmarks (e.g. a made-up rack brand on the top band, a generic switch brand and model, a generic mini PC brand). Keep sizes, positions, colors, LED placement and callouts from 3.4 |
| Fonts: Geist, Geist Mono (next/font/google), Archivo variable with `wdth` axis 62 to 125 | Same open-source fonts via `next/font/google`; load Archivo with `axes: ['wdth']` so `font-stretch: 62%` works |
| Starfield / gradient backdrop behind the section | Provided by the page-level sky component (separate spec) |
| Icons | None in this section (chips are plain text pills, bullets are the `›` character) |
| Room view reached by the CTA | Separate room spec; our CTA should call the same `enterRoom` path |

No raster images, photos, or downloads are part of this section.

---

## 10. Implementation plan

Recommended files (Next.js App Router, Tailwind v4, motion):

```
components/sections/homelab/
  HomelabSection.tsx      server   section shell, data-sec="dusk", grid, labels, lists
  RackFrontDiagram.tsx    server   pure SVG from geometry + parts config (deterministic)
  rack/                   server   BlankPanel, PatchStrip, Shelf, SwitchFace, MiniPcFace, DriveFace, VentStrip, Handles, Plinth, Callout, Led
  HardwareList.tsx        server
  ServiceList.tsx         server
  HardeningChips.tsx      server
  IncidentList.tsx        server
  SeeInRoomButton.tsx     client   onClick → seeInRoom()
components/ui/
  BlurFade.tsx            client   motion.div wrapper (shared by all sections)
  SectionHeading.tsx      server   eyebrow + h2.display.sec-title + lede, wrapped in BlurFade
lib/
  homelab-data.ts                  HomelabData + HardwarePart records (shared with room view and terminal)
  rack-geometry.ts                 W, H, U, slot helpers, patchX(i) = 11 + 50/12·i, swX(i) = 11 + 4.6·i, PART_LOCAL
  rng.ts                           mulberry32(seed)
  view-store.ts                    setView / enterRoom / yg:view event (shared with room + nav)
```

CSS to add in `globals.css`:

```css
@theme inline { --color-sec: var(--sec, #e6d9b5); }
[data-sec="dusk"] { --sec: var(--dusk); }
.display { font-family: var(--font-archivo), "Arial Narrow", system-ui, sans-serif; text-transform: uppercase; font-weight: 900; font-stretch: 62%; line-height: .9; }
.sec-title { color: #f7f4ec; font-size: clamp(2.6rem, 13vw, 5.5rem); }
.lab-mono { font-family: var(--font-geist-mono), ui-monospace, monospace; }
/* .lab-led-act / -disk / -pulse + keyframes + reduced-motion block from 4.2 */
```

Gotchas:
- Hydration: LED durations come from a seeded PRNG evaluated at module scope, so server and client produce identical inline styles. Do not use `Math.random()`.
- Keep `toFixed(2)` on durations/delays so SSR and CSR strings match exactly.
- SVG `<text>` sizes are in user units (e.g. `fontSize={3.8}`); only add `className="lab-mono"` where noted, others inherit Geist from `body`.
- `fill-sec` / `stroke-sec` only work if `--color-sec` is a theme color; with `@theme inline` they compile to `fill: var(--sec, #e6d9b5)`.
- The arbitrary `[mask-image:linear-gradient(#000_90%,transparent)]` class compiles to unprefixed `mask-image`; add `-webkit-mask-image` if older Safari matters.
- Tailwind v4 `divide-y` emits `border-bottom` on `:not(:last-child)` children; the last service row has no bottom rule (the list border closes it).
- `font-stretch: 62%` requires the Archivo `wdth` axis to be loaded; otherwise the condensed look silently falls back to normal width.
- BlurFade must not set initial styles on the server for reduced-motion users in a way that blocks content; matching the original means SSR still ships `opacity:0`, so JS is required. Consider a `<noscript>` override if desired (not in the original).
- Callout bubble fill must equal the card background (`#0a0d19`) to read as a ring.
- The section must live inside the `[data-classic]` wrapper so it hides when `html[data-view="room"]`.
- Buttons get `cursor: default` from Tailwind v4 preflight; the original keeps it. Add `cursor-pointer` only if deliberately deviating.

---

## 11. Reference screenshots

All under `C:/Users/krisg/AppData/Local/Temp/claude/C--/decae922-eee1-4676-b27b-70265c1bf4af/scratchpad/ref/homelab/`.

| File | Shows |
|---|---|
| `section-desktop-1440.png` | Full section at 1440, revealed (primary reference) |
| `section-xl-1280.png` | Full section at 1280 (identical layout, narrower margins) |
| `section-lg-1024.png` | Full section at 1024: hardware list single column, right header wraps |
| `section-md-768-revealed.png` | Full section at 768, stacked, both columns revealed |
| `section-md-768.png` | 768 capture taken with a fast programmatic scroll: right column still hidden (opacity 0), useful to see the pre-reveal state |
| `section-sm-640.png` | 640 capture (hardware list 2 columns); right column may be in pre-reveal state |
| `section-mobile-390-revealed.png` | 390 mobile emulation, both columns revealed |
| `section-mobile-390.png` | 390 pre-reveal state of the right column |
| `section-reduced-motion.png` | Section with reduced motion |
| `viewport-top-{desktop-1440,xl-1280,lg-1024,md-768,sm-640,mobile-390}.png` | Viewport scrolled to the section top at each width |
| `hardware-col-desktop-1440.png`, `hardware-col-mobile-390.png` | Left column (label, rack card, hardware list) |
| `services-col-desktop-1440.png`, `services-col-md-768.png`, `services-col-mobile-390.png` | Right column (header, services, chips, stories, CTA); the mobile one includes the fixed header overlapping a row |
| `stacked-services-viewport-md-768.png`, `stacked-services-viewport-mobile-390.png` | Viewport after the stacked right column has revealed |
| `rack-svg-4x.png` | Rack diagram at 4x device pixel ratio for drawing reference |
| `rack-svg-hovered.png` | Diagram while hovered (no change) |
| `rack-led-frame-0..5.png` | Top 60% of the diagram, 250ms apart, LED blink states |
| `cta-rest.png`, `cta-hover.png`, `cta-focus-visible.png` | CTA states |
| `cta-click-00-100ms.png` … `cta-click-05-4000ms.png` | Room view entering after the CTA click (100, 400, 800, 1500, 2500, 4000ms) |
| `reveal-00..09.png` | Section heading / columns entrance frames (frame spacing about 100ms plus capture time) |
| `styles-desktop.json`, `metrics-*.json`, `interact.json`, `reveal.json`, `reduced.json`, `stacked-reveal.json` | Raw computed-style and measurement dumps |

Probe scripts: `scratchpad/tools/homelab-probe.mjs` (modes `styles`, `shots`, `interact`, `reveal`) and `scratchpad/tools/homelab-probe2.mjs` (stacked reveal check).

---

## 12. Open questions / uncertainties

- The U numbers `01` to `06` and most rack screw holes are drawn but fully covered in this front view; it is unclear whether that is intentional. The clone should keep them in the draw order so empty slots in our own stack show them.
- Exact reveal timing was not frame-measured precisely (screenshot capture time dominated the 100ms interval); the 0.5s / easeOut / 14px values come from code.
- Who writes `localStorage["yg-lab"]` (seen after entering the room) was not traced in this area; it belongs to the room / lab spec.
- Mobile Safari was not tested; only Chromium with iPhone UA and touch emulation.
- The CTA uses `behavior: "instant"` scroll then a synthetic click on the hero door on the next frame; if the hero is not mounted (no `[data-room-door]`), it falls back to `setView('room')` without the zoom entrance. That fallback path was not exercised.
- The focus ring appearance is the browser default and will differ across browsers.
