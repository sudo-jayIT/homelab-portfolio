# Theme B: Mint Terminal

> **Status: live.** This theme is rolled out on the site. The preview code (`src/components/theme-preview/b/`, `/dev/theme-b`) was removed after the rollout; the live code is `src/components/sky/RainField.tsx`, `src/components/sky/rain.ts`, `src/components/sky/SkyGrid.tsx`, `src/components/sky/SkyPackets.tsx` and `src/components/chrome/RainDivider.tsx`, with the tokens in `src/styles/base.css`. The colour rule in `docs/OWNER-NOTES.md` overrides parts of this spec, so these were **not applied**: section 3.8 (LED palette and rack chassis shifts), section 3.10 (room scene palette and the window rain; the window keeps its night view), the poster, print and cover regeneration, and the project preview regeneration in 3.12. Panels that lift off a room object keep that object's colours (the CRT panel stays amber phosphor); only their chrome is mint. The terminal's content runs (help text, banner shorts, boot rows) use `--gray-2` instead of `--gray-3` (3.9), because they carry content. Section 9 describes the removed preview.

Preview (removed): `/dev/theme-b`. Preview code was `src/app/dev/theme-b/page.tsx` and `src/components/theme-preview/b/` (`theme-b.css`, `tokens.ts`, `RainField.tsx`, `RainDivider.tsx`, `ThemeBShell.tsx`, `ThemeBRoot.tsx`, `RoomGuard.tsx`).

Mint Terminal replaces the night sky with a quiet "premium developer tool" surface: a near-black green base, one mint accent, neutral green-grays, a faint 1px grid, crisp glass cards with hairline borders and a sparse, slow hex-glyph rain that lives in the side gutters. Glow is almost absent; contrast does the work.

## 1. Principles

1. **One accent.** Mint `#3dfc9a` is the only accent. The four section accents (signal, dusk, beacon, sodium) all resolve to it; the tokens stay so a later variant can split them again. Amber and coral exist only as semantic signals (warning, blocked traffic), never as decoration.
2. **Content first.** The rain is masked away from the 72rem content column (dimmed to 14% and spawning at 12% of the gutter rate), so text never sits on moving glyphs.
3. **Hairlines, not glows.** Borders are 1px at 7.5% to 12% mint-white. No `shadowBlur`, no neon halos; LED halos shrink and dim.
4. **Same system, new skin.** Layout, keycap travel (3px lip, same hover and press offsets), parallax variables, BlurFade reveals, view switching and every DOM contract stay as they are. Only colours, the sky layers and a few decorative pseudo-elements change.
5. **Generic digital rain.** The glyph set is uppercase hex plus operators, so the rain reads as a scrolling hex dump. No film titles, characters, logos, quotes or katakana.

## 2. Palette

| Role | Token (new, in base.css `:root`) | Value |
|---|---|---|
| Base | `--background` | `#050807` |
| Raised base (placeholders, inset wells) | `--raised` | `#070b09` |
| Card glass | `--card-glass` | `rgba(11, 17, 14, 0.8)` with `backdrop-filter: blur(8px)` |
| Card solid (gradients, SVG fills) | `--card` | `#0a0f0d` |
| Hairline | `--line` | `rgba(214, 255, 233, 0.075)` |
| Hairline strong (card borders) | `--line-strong` | `rgba(214, 255, 233, 0.12)` |
| Accent | `--mint` | `#3dfc9a` |
| Accent hover | `--mint-hi` | `#7dffbf` |
| Lead glyph, LED white, packet core | `--mint-head` | `#d4ffe8` |
| Title ink | `--title` | `#eef5f1` |
| Body text | `--foreground` | `#e3ebe7` |
| Gray 1 (key legends, strong secondary) | `--gray-1` | `#c3cdc8` |
| Gray 2 (muted text) | `--gray-2` | `#8a958f` |
| Gray 3 (disabled, terminal comments) | `--gray-3` | `#56605b` |
| Gray 4 (dividers on solid) | `--gray-4` | `#262d2a` |
| Warning (disk LED, PDU rocker) | `--warn` | `#f3c969` |
| Alert (blocked packet, errors) | `--alert` | `#ff6b6b` |
| Footer | `--footer` | `#040605` |

Contrast against `#050807` (computed, WCAG relative luminance): `--title` 18.2:1, `--foreground` 16.6:1, mint 14.9:1, `--gray-1` 12.3:1, `--gray-2` 6.5:1, `--gray-3` 3.1:1. `--gray-3` is for decoration and disabled states only, never body text. Mint legends on the primary keycap face (`#202825` to `#151b18`) reach 11.2:1 to 13.0:1.

## 3. Token map

### 3.1 `src/styles/base.css` `:root`

| Token | Current | Mint Terminal | Notes |
|---|---|---|---|
| `--background` | `#080808` | `#050807` | Also replace `bg-[#080808]` on `<body>` in `layout.tsx` with `bg-background`. |
| `--foreground` | `#f0f0f0` | `#e3ebe7` | `text-[#f0f0f0]` on `<body>` becomes `text-foreground`. |
| `--signal` | `#3ecbff` | `#3dfc9a` | Projects, Contact. |
| `--dusk` | `#a58bff` | `#3dfc9a` | Homelab, About. |
| `--beacon` | `#ff5a87` | `#3dfc9a` | Experience. |
| `--sodium` | `#ff9d3c` | `#3dfc9a` | Websites, Photography. |
| `--putty` | `#e6d9b5` | `#3dfc9a` | Putty was the "light" accent; mint takes its role. |
| `--card` | `#0a0d19` | `#0a0f0d` | Solid card colour. |
| `--footer` | `#05070d` | `#040605` | |
| `--title` | `#f7f4ec` | `#eef5f1` | |
| new | | see section 2 | `--raised`, `--card-glass`, `--line`, `--line-strong`, `--mint`, `--mint-hi`, `--mint-head`, gray ramp, `--warn`, `--alert`, keycap tokens (3.5). |

### 3.2 `@theme inline`

| Entry | Current | Mint Terminal |
|---|---|---|
| `--color-putty` | literal `#e6d9b5` | `var(--putty)` (so one token drives every `*-putty` utility) |
| `--color-sec` | `var(--sec, #e6d9b5)` | `var(--sec, #3dfc9a)` |
| `--color-signal/dusk/beacon/sodium` | `var(--…)` | unchanged (they follow the tokens) |
| new | | `--color-mint: var(--mint)`, `--color-line: var(--line)`, `--color-card: var(--card)`, `--color-raised: var(--raised)` so components can drop arbitrary hex values |

### 3.3 Global rules in base.css

| Rule | Current | Mint Terminal |
|---|---|---|
| `::selection` | `#e6d9b54d` | `rgba(61, 252, 154, 0.28)`, `color: #fff` |
| `.sec-title` colour | `#f7f4ec` | `var(--title)` |
| `.name-line` colour | `#f7f4ec` | `var(--title)` |
| `.name-line` text-shadow | `0.035em 0.045em #05070d` | `0.035em 0.045em #0b1812` (same geometry) |
| `.dot-grid` | `#ffffff1f` dots, 28px | `rgba(61, 252, 154, 0.14)` dots, 28px |
| `.lab-led-*`, `lab-caret`, view switching | | unchanged |

### 3.4 Hard-coded colour families

| Family | Where | Mint Terminal |
|---|---|---|
| Card navy `#0a0d19` | `MagicCard.tsx` (`SURFACE`), `Projects.tsx` (`to-[#0a0d19]`), `Homelab.tsx` (two cards, callout fill), `Websites.tsx`, `work.css` `.ticket` | Cards use `var(--card-glass)` plus `backdrop-filter: blur(8px)` and `box-shadow: inset 0 1px 0 rgba(214,255,233,0.035)`; gradients and SVG fills use `var(--card)` |
| Placeholder well `#080b14` | `Projects.tsx` | `var(--raised)` |
| Page black `#080808` | `layout.tsx`, `Header.tsx` glass, `MobileMenu.tsx`, `About.tsx`, `Lightbox.tsx` | `var(--background)` (glass alphas below) |
| Night gradient | `ClassicShell.tsx` `BACKDROP` (`#06080f` to `#1c1530`), `RoomSky.tsx` (`#06080f` to `#070a13`) | Flat `var(--background)`; depth comes from the grid, rain and a 4.5% top wash |
| Footer navy `#05070d` | `Footer.tsx` wrapper, `Skyline.tsx` near fill, `.name-line` shadow | `var(--footer)` |
| White hairlines | `border-white/[0.06]`, `/[0.04]`, `/[0.07]`, `border-white/10` | `border-line` (0.075) for dividers, `border-line-strong` (0.12) for card edges |
| Tailwind `emerald-400` | Homelab service LEDs, footer status dot | `bg-mint` |
| Tailwind `slate-*` | room panels, badge, map | keep neutral but shift to the green-gray ramp (`slate-400` to `--gray-2`, `slate-300` to `--gray-1`, `slate-600/700` to `--gray-3/4`) |

### 3.5 Keycaps (`src/styles/keys.css`)

Geometry, travel and timings stay. Colours only:

| Part | Current | Mint Terminal |
|---|---|---|
| `.key` text | `#ffffffdb` | `var(--gray-1)` `#c3cdc8`; hover `#fff` |
| `.key` face | `linear-gradient(#2c3035, #1c1f23)` | `linear-gradient(#1b211e, #111513)` |
| `.key` shadow | `inset 0 1px #ffffff1a, 0 3px #0a0b0d, 0 6px 14px #0000008c` | `inset 0 1px rgba(255,255,255,.07), inset 0 0 0 1px rgba(214,255,233,.05), 0 3px #060908, 0 6px 14px rgba(0,0,0,.55)` |
| `.key:hover` shadow | lip 4px, drop 8px 18px | same offsets, inner rim `.09` |
| `.key:active` shadow | lip 0 | same, rim `.05` |
| `.key-light` (primary) | putty `linear-gradient(#efe8d4, #d4cab1)`, text `#2a2620`, lip `#9a8f77` | charcoal `linear-gradient(#202825, #151b18)`, text mint, `inset 0 1px rgba(61,252,154,.22), inset 0 0 0 1px rgba(61,252,154,.2), 0 3px #040605, 0 6px 14px rgba(0,0,0,.55)` |
| `.key-light:hover` | text `#1a1712` | text `--mint-hi`, rim `.3/.34`, lip 4px |
| `.key-light:active` | | rim `.16/.22`, lip 0 |
| Monogram keys (`.key-icon`) | key text | mint legend on the plain charcoal cap |
| `.key-legend` | 50% of key text | mint at 55% |
| Focus ring (`.key`, `.mini-room`) | `#efe8d4b3` | `rgba(61, 252, 154, 0.75)`, same 2px width and offsets |

Primary and secondary are now told apart by the mint rim and legend instead of a light face, which keeps every cap in one material.

### 3.6 Header glass and menus

| Part | Current | Mint Terminal |
|---|---|---|
| Scrolled header | `bg-[#080808]/85 backdrop-blur-xl border-white/[0.06]` | `rgba(5, 8, 7, 0.72)` with the same blur, `border-line` |
| Mobile menu | `bg-[#080808]/95` | `rgba(5, 8, 7, 0.95)`, `border-line` |
| Active nav link | `text-white` | `text-white` plus a 14 x 2px mint tick 9px below the label (pseudo-element, no layout change) |
| Mobile active link | `text-putty` | mint (via the token) |

### 3.7 Chips, cards, spotlight, ticket

| Part | Current | Mint Terminal |
|---|---|---|
| Tech chip (icon) | `bg-white/[0.04] border-white/10 text-white/75` | unchanged colours; border `line-strong` |
| Tech chip (accent) | `bg-sec/10 text-sec border-sec/20` | follows `--sec` (mint); no change in markup |
| Hardening chips (Homelab) | `bg-sec/10 border-sec/25 text-sec` | follows `--sec` |
| MagicCard surface | `#0a0d19` | `--card-glass` (see 3.4) |
| MagicCard border | `border-white/10`, hover `border-sec/40` | `line-strong`, hover `border-sec/40` (mint) |
| MagicCard spotlight | 350px `--sec` at 10% | 350px mint at 8% (slightly lower, mint is brighter than the old accents; the preview still shows 10% because the strength is inline in MagicCard) |
| Ticket (Experience) surface | `#0a0d19`, border `#ffffff1a` | `--card-glass`, `--line-strong` |
| Ticket stub tint | `--sec` at 9%, tear line `--sec` at 55% | mint at 7%, tear line mint at 40% |
| Ticket barcode | white at 40% | `--mint-head` at 30% |
| Homelab rack card, services card | `bg-[#0a0d19]` | `--card-glass` |
| Service row index column | `bg-white/[0.03]` | `rgba(61, 252, 154, 0.025)` |

### 3.8 Rack and LED palette

`LED` in `src/components/lab/contracts.ts` (used by the room scene, the homelab diagram and the inspector):

| Key | Current | Mint Terminal | Use |
|---|---|---|---|
| `green` | `#4ade80` | `#3dfc9a` | link and activity |
| `emerald` | `#34d399` | `#2fe08b` | secondary activity |
| `cyan` | `#22d3ee` | `#6ff7c0` | WAN cable, packets |
| `blue` | `#60a5fa` | `#a8ffd6` | storage activity |
| `amber` | `#fbbf24` | `#f3c969` | disk, PDU (only warm colour left) |
| `red` | `#fb7185` | `#ff6b6b` | blocked packet, alert |
| `white` | `#f1f5f9` | `#e9fff3` | power |
| `warm` | `#fdba74` | `#d6f5e3` | room fill light (becomes a cool white) |

Glow gradients (`lab-glow-*`): stops `0.7 / 0.22 / 0` become `0.55 / 0.14 / 0`. Pools (`lab-pool-*`): `0.16 / 0.05 / 0` become `0.12 / 0.04 / 0`. Flat halos (homelab diagram) drop from 20% to 14% opacity.

Rack hardware (`src/lib/rack.tsx`, `Box3D.tsx`, `objects/Rack.tsx`): chassis grays stay neutral but shift one step greener (`#121416` to `#111513`, `#1c1f22` to `#1a1f1d`, `#2b2f33` to `#29302d`); the PDU rocker `#fb923c` becomes `--warn`; the red PDU marking `#b91c1c` stays (it is a hardware detail, not an accent); label tapes `#eeece4` become `#dfe9e4`; the rack plinth label stays dark text on light tape. The rack data (12U, device order, U positions) is untouched by the theme.

### 3.9 Terminal and intro (`src/components/lab/terminal/*`, `IntroControls`, `HudKeys`)

| Part | Current | Mint Terminal |
|---|---|---|
| Console background | `bg-black` | `#030605` |
| Body text | `#cfcfcf` | `--gray-1` |
| Strong text | `text-white/85` | `--title` at 90% |
| `[  OK  ]` and service bullets | `#5fd07a`, `#7bd88f` | mint |
| Comments, muted lines | `#8a8a8a` | `--gray-3` |
| Error lines | `#ff8a8a` | `--alert` |
| Prompt user@host | putty | mint |
| Caret | `#e8e8e8` block | mint block, same `lab-caret` 1.05s steps(1) |
| Scrollbar | `rgba(255,255,255,0.18)` | `rgba(61, 252, 154, 0.22)` |
| Footer row, hints | `text-white/35`, `border-white/[0.08]` | `--gray-3`, `--line` |
| "Enter as guest" | `.key-light` | follows 3.5 |
| HUD and intro keys | `.key` | follows 3.5 |

The intro's backdrop is the room rain (section 4), so the console boots over falling glyphs instead of stars.

### 3.10 Room scene palette (`src/components/lab/art/**`)

The room becomes a graphite studio lit by mint and cool white. Values below replace `TONES` and the literals in each object file.

| Element | Current | Mint Terminal |
|---|---|---|
| Wall A tones | `#30363c / #1a1e22 / #262b31` | `#2b322f / #161b19 / #212825` |
| Wall B tones | `#30363c / #262b31 / #15181c` | `#2b322f / #212825 / #121614` |
| Floor slab | `#1a1511 / #2a221b / #211a14` (wood) | `#121614 / #1d2320 / #171c1a` (sealed concrete) |
| Floor fill, alternate planks, seams | `#1a1511`, `#1d1813`, `#0f0c09` | `#111513`, `#141917`, `#0a0d0c` (keep plank geometry; reads as long concrete panels) |
| Rug | `#1b1a2c`, borders `#3a3656 / #2a2740` | `#111916`, borders `#1f3a2d / #172a21` |
| Wood (desk top) | `#2a2119 / #1b1510 / #140f0b` | smoked graphite laminate `#222826 / #161a19 / #101312` |
| Record cabinet, plinth, pot | `#3a2a1d…`, `#3d2c21…` | `#262d2a / #1d2321 / #161b19` |
| Metal | `#3b444d / #272e35 / #1c2127` | `#39423f / #262d2b / #1b201f` |
| Chassis, plastic, fabric, camera | near-neutral grays | same values shifted one step greener (hue about 150, saturation under 8%) |
| CRT body (putty tones, `#6f6958`, keys `#d8d0bb/#c9c0a9`) | beige | graphite monitor `#3a4240 / #2c3331 / #222826`, keys `#3a4340 / #2f3633` with mint legends where drawn |
| `PUTTY`, `TAG_TEXT` | `#e6d9b5`, `#efe6cc` | mint, `--mint-head` |
| `PHOSPHOR`, `PHOSPHOR_DIM` | `#ffb347`, `rgba(255,179,71,.45)` | `#3dfc9a`, `rgba(61, 252, 154, 0.45)` |
| CRT screen (base and lit) | `#0b0904`, `#1a0f03` | `#020604`, `#03100a` |
| CRT glow gradient | `#ffb347` at 0.16 | mint at 0.10 |
| Scanlines | `rgba(0,0,0,0.35)` | unchanged |
| `RIM` | `rgba(160,255,230,.08/.15)` | `rgba(61, 252, 154, 0.07 / 0.13)` |
| Lamp shade and mouth | `#3b3127 / #4a3e31`, glow `#fde2b8` | `#2a312e / #343c39`, glow `#e9fff3` at 0.5 |
| Spotlight beam | `#e6f0ff` 0.3 / 0.08 / 0.02 | `#e9fff3` 0.24 / 0.06 / 0.015 |
| Wall wash strip | `LED.warm` band 0.05, strip 0.55 | mint band 0.035, strip 0.45 |
| Pools | room warm + blue, desk amber, rack cyan | room `warm` (now cool white) + `blue` (pale mint), desk switches from `amber` to `green` (the CRT is mint now), rack `cyan` (seafoam) |
| Picture light | white glow 0.28 | unchanged (white is neutral) |
| Lens gradient (camera) | `#3b4a6b / #141b2b / #05070b` | `#2f4a3f / #121c18 / #040706` |
| Cables | jacket `#0c1211`; WAN cyan, desk amber | jacket unchanged; WAN seafoam, desk mint |
| Packets | white, cyan, amber cores | `--mint-head`, seafoam, mint |
| Firewall alert | red, label `#fecdd3` | `--alert`, label `#ffd0d0` (semantic, stays warm) |
| Rubber band ball | seven bright hues | mint, seafoam, pale mint, `--gray-1`, `--gray-2`, white, one `--warn` band |
| Plant | `#1a3424…#2a5036` leaves | keep, cooled slightly (`#183226…#28503a`); pot graphite |
| Desk papers, resume, badge card | paper whites | paper `#eef2f0`; badge band colours come from content (`EXPERIENCE[].badge.band`) and stay, slightly desaturated by the theme if needed |
| Phone | `#0f172a` screen | `#050807` screen, mint notification bar |
| Map frame | `#0f1a24`, lines `#94a3b8`, labels `#e2e8f0` | `#08110d`, lines `#5f7a6c`, labels `--mint-head`, pins mint |
| Certificates | paper `#e9e6de`, seals `#c2533b` | paper `#e6ece9`, seals mint on graphite (no issuer logos) |
| Vinyl label, sleeve spines | reds and purples | label mint on graphite, spines in the gray ramp with one mint spine |

**Window content.** The night sky, stars, moon, back skyline, towers, front skyline and lit windows in `objects/WindowView.tsx` are removed. The opening shows rain instead:

* Base layer: `lab-sky` becomes a vertical gradient `#020504` to `#04100a` to `#072016`. On it, 9 glyph columns in window-local units (96 x 78), two depths: near columns 1.4 units wide made of 1.5-unit dashes with 1.1-unit gaps (mint, alpha rising to 0.85 at the head, a 1.6-unit `--mint-head` lead cell), far columns 1.1 units wide at 0.45.
* Lit layer: the columns get a `lab-rain` class that translates them down by one period in 2.4s linear infinite (two depths: 44 and 60 local units per period). Under reduced motion the animation is off and the still pose is used. The moon glow (`lab-glow-white` circle) is removed; a faint mint wash (`lab-glow-green` at 0.12) sits behind the glass.
* Mullions stay (`#0b0d0f` to `#0a0d0c`), so the window still reads as a window.

The preview approximates this on the bitmap with a clipped, animated pseudo-element (see section 9).

**Poster and print art direction.**

* Print (`/lab/print.webp`, `scripts/assets/panels.mjs print`): keep the photo composition (the print panel still lifts off a matching picture) but swap the warm gradient map for a mint one: `#050807` to `#16302a` to `#7fd8ac` to `#eef5f1`, keep 12% of the original colour, cool white picture light instead of lamplit falloff.
* Poster (`/lab/poster.webp`): monochrome mint on graphite. Suggested subject: a typographic "hex dump" grid or a topographic contour field, set in Geist Mono and Archivo. No film imagery, no lighthouse scene. The SVG fallback gradients (`lab-print-warm`, `lab-poster-sea`) become `#0b1612` to `#1f4a37` to `#08110d` and `#07110d` to `#13261e` to `#050a08`.
* Music cover (`/lab/cover.webp`): same direction as the poster.

### 3.11 Room UI (`src/styles/lab.css`, `LabHero.tsx`, `MusicCard.tsx`, `RackInspector.tsx`, panels)

| Part | Current | Mint Terminal |
|---|---|---|
| Hotspot hover | fill `#e6d9b51a`, stroke `#e6d9b5e6`; rack fill `#e6d9b508` | fill `rgba(61,252,154,.08)`, stroke `rgba(61,252,154,.85)`; rack `.03` |
| Markers | back `#0607089e`, stroke `#e6d9b580`, dot and ring `#e6d9b5` | back `rgba(5,8,7,.62)`, stroke mint 0.5, dot and ring mint |
| Tooltip | `border-putty/25 bg-[#0b0d0c]/95 text-putty` | follows the putty token; bg `--card` at 95% |
| Lab section, top fade, focus scrim | `#050706`, `#030504/80` | `--background`, `rgba(2, 4, 3, 0.8)` |
| Music card | `#0b0d0c`, putty keys `#e6d9b5 / #cdbf98 / #2a2620` | `--card`, keycap system (3.5) |
| Rack inspector | `#0b0e0d`, slate radial 0.10 | `--card`, mint radial 0.06 |
| CRT panel | amber phosphor family (`#ffb347`, `#ffcf8a`, `#130b02`, beige bezel `#a39a83 / #ddd4bd`) | mint phosphor (`#3dfc9a`, `#a8ffd6`, `#02100a`), graphite bezel `#2c3331 / #3a4240` |
| Map, phone, badge, cert panels | slate and paper families | as in 3.10 |
| `panels.css` preview backdrop | `rgba(3,5,4,.68)` over the still | unchanged values, new still |

### 3.12 Other sections and images

* About (`About.tsx`): `#080808` to `--background`; frame `#0c0d0e / #2b2f33` stay neutral; the warm photo sheen `rgba(255,240,214,0.14)` becomes `rgba(214,255,233,0.10)`.
* Photography, ExpandableGallery, Lightbox: `#080808` to `--background`. Photos are untouched.
* Project previews (`public/previews/*.png`, `scripts/assets/work.mjs`): the generated mock screens still use navy surfaces and violet or red highlights. Regenerate them on `#0a0f0d` surfaces with mint highlights so the cards do not carry the old palette (visible in the preview screenshots).
* OG and Twitter cards (`src/lib/og-card.tsx`): night sky to a flat `#050807` with the 64px grid and a few static glyph columns at the edges; name in `--title`, role line in mint.

## 4. What replaces each sky element

| Sky element (`SkyLayers.tsx`, `sky-data.ts`, `Skyline.tsx`) | Replacement | Parallax and motion |
|---|---|---|
| Three tiled star fields (`par-wrap`, scroll wrap) | Removed. The 1px grid (64px cells, lines `rgba(214,255,233,0.032)`, intersection dots mint 0.13) on the page-tall shell layer, centred so lines land on the page centre and on both 72rem column edges | Scrolls natively with the page (no `will-change` on a page-tall layer). The grid fades out above the divider |
| Milky way band | Removed. A top wash: `radial-gradient(70% 55% at 50% 0%, rgba(61,252,154,0.045), transparent 70%)` plus a 45% base floor at the viewport bottom | Static, inside the sticky layer |
| Twelve twinkles | Eight grid "pings": 3px mint squares with a 2px 12% ring on gutter intersections, using the existing `sky-twinkle` keyframes with per-node duration (4.2 to 6.1s) and delay | Reduced motion: the existing sky.css rule stops the loop; a theme rule holds them at 50% |
| Constellations (two, with labels) | Removed, no replacement (keeps the gutters for rain) | |
| Moon | Removed, no replacement | |
| Two satellites (drift east and west, blinking beacon) | Two packets: a 3px `--mint-head` head with a 56px mint tail, on straight horizontal runs (`b-drift-east` 96s, `b-drift-west` 128s; the old drift keyframes rose diagonally) | `.par` with `--d` 30 and 22, `.sky-moving` so reduced motion hides them |
| Two shooting stars | Burst drops: every 12 to 22s one idle gutter column gets a drop at 16 to 24 rows per second with a 26 to 36 row trail | Canvas only; none under reduced motion |
| Classic sky as a whole | `RainField` canvas in the same sticky `h-lvh` slot, wrapped in `.par` (`--d` 6, `--s` 0) | Pointer parallax only; the rain is the far plane and does not drift on scroll |
| Room sky (`RoomSky.tsx`) | Rollout only (the preview has no room view): the same `RainField`, fixed full viewport, a third `room` profile: full-width rain (no column mask) dimmed to 35% inside an ellipse around the room's projected bounds | Same pause rules; the canvas is not intersecting while the room view is hidden, so its loop stops on its own |
| Skyline divider | `RainDivider`: the rain "settles" into two separated bands of static glyph rows (far: 3 rows of 11px glyphs, 4% to 14% filled, 56px up; near: 2 rows of 13px glyphs, 12% to 30% filled, at the bottom), a 1px mint floor line and a blinking 8 x 15px block cursor in the beacon's slot. Seeded, server rendered, three text nodes per row (dim, mid, bright) | Root keeps `data-sky-vars`; bands are `.par-x` with `--d` 7 and 17 like the city layers; the cursor uses `sky-blink` |
| Footer | `#040605`, hairlines in `--line`, monogram key with mint legend, status dot mint (`animate-pulse` kept), Connect link hover mint | |

The page stops using `sky-drift-east`, `sky-drift-west`, `sky-shoot` and the star data; `sky-twinkle` and `sky-blink` stay.

## 5. Typography

* Display (Archivo 900, `font-stretch` 62% and per-line hero stretch) stays: the name lockup and section titles are tuned to it, and changing weight or face would break the fitted widths. Colour moves to `--title`.
* Mono labels stay Geist Mono, uppercase, 0.2em tracking, now in mint for section kickers.
* New: the hero prompt (`user@host:~$ whoami`) ends in a mint block caret, 0.6 x 1.15em, `lab-caret` 1.05s steps(1), off under reduced motion. Implemented as a pseudo-element, so the markup does not change.
* The rain uses Geist Mono 500 at 14px on 20 x 22px cells (desktop) and 12px on 16 x 18px cells (below 768px).
* Optional, not in the preview: tech chips in Geist Mono 11px. It reads more "terminal" but widens chips and can add a chip row on narrow cards, so it needs a layout pass first.

## 6. Motion

### 6.1 Rain parameters (`tokens.ts`, `RAIN`)

| Parameter | Value |
|---|---|
| Glyph set | `0123456789ABCDEF` (twice, so hex dominates) plus `: . / < > { } [ ] = + * # $ % ~ ^` |
| Cell (desktop) | 20px column pitch, 22px rows, 14px glyphs |
| Cell (below 768px) | 16px, 18px, 12px |
| Speed | 2.2 to 5.6 rows per second (about 50 to 125 px/s; a 900px viewport takes 7 to 18s) |
| Trail | 7 to 18 rows; each lit cell fades at speed / trail per second |
| Rest between drops | 2.5 to 14s divided by the column's spawn weight |
| Gutter mask | per column, by distance from the 72rem content column edge: inside the column alpha 0.14 and spawn 0.12; full alpha and spawn from 110px outside the edge; smoothstep between 40px inside and 110px outside, so the 40px next to the text stays quiet. Below 768px the whole width is content: alpha 0.20, spawn 0.26, with a wider feather (140px inside to 24px outside) so the screen edges still carry rain |
| Trail alpha | 0.5 times brightness squared times the column alpha |
| Lead glyph | `--mint-head` at 0.92 times the column alpha |
| Bursts | every 12 to 22s, 16 to 24 rows per second, trail 26 to 36 |
| Prewarm | 9 simulated seconds before the first paint, so the page never loads empty |
| Frame cap | 30 fps (the rain moves whole rows, so higher rates add cost and no smoothness) |

### 6.2 Trail and lead behaviour

* Each column holds at most one drop. The lead glyph advances one whole row at a time; every cell it enters lights to full brightness with a fresh glyph, then fades at that drop's rate. Trails are cells left behind, not a translucent smear, so the background stays clean.
* The lead glyph is drawn in `--mint-head` and re-rolls its glyph about 9 times per second while it waits in a cell; trail glyphs swap with a 0.7 per second chance, so old trails shimmer slightly as they fade.
* No blur, glow or `shadowBlur` anywhere in the rain.

### 6.3 Reduced motion

* `RainField` paints one seeded static field (`mulberry32(0x5eedb)`, 42% of gutter columns hold a frozen drop with a lead glyph and a fading trail) and starts no loop. It repaints only on resize, on a change of the media query and once when the mono font finishes loading.
* Packets are hidden (`.sky-moving`), pings stop on their resting opacity, the hero caret and the window rain stop, the divider cursor stops (`sky-blink` rule in sky.css).
* Switching the preference at runtime switches modes without a reload.

### 6.4 Interplay with the existing motion system

* SkyMotion is unchanged. `data-sky-vars` sits on the sticky rain layer and on the divider root; neither gets a React `style` prop.
* Keycap travel, the door's tilt, float and settle, BlurFade reveals, header fade and the view switch are untouched.

## 7. Performance

* One canvas, viewport sized, absolutely positioned in a fixed-height sticky box: no layout shift, no resize of the page when it initialises.
* DPR capped at 2. Typed arrays for cell and column state, no allocation per frame. About 3,000 cells at 1440 x 900; a frame draws only lit cells. Measured on the preview (headless Chrome, dev build): about 260 `fillText` calls per frame at 1440 x 900, 180 at 390 x 844 and 910 at 2560 x 1440 (wide gutters). One `clearRect`, two `fillStyle` changes and no `shadowBlur` per frame.
* Measured draw cadence: 27.5 frames per second (the 30 fps cap on a 165 Hz headless clock), at DPR 1 and 2. Idle on the hero at 1440 x 900, DPR 2, the rain costs about 9 ms of script per second; total main-thread task time was 161 ms/s against 137 ms/s for the current night-sky page under the same conditions (dev build, so both numbers are inflated; the delta is what matters).
* The loop runs at most 30 fps and stops when the tab is hidden (`visibilitychange`; verified: zero draws while hidden), when the canvas leaves the viewport (`IntersectionObserver`, which also covers `display: none` in the room view) and under reduced motion.
* Removing the star fields removes three full-viewport backgrounds made of hundreds of radial gradients each and the milky way mask, which should cut paint work during parallax noticeably.
* Glass cards use `backdrop-filter: blur(8px)`. There are about a dozen on the full page and they sit over a near-static grid, but on low-end devices the blur can be dropped (the 80% opaque surface reads the same).
* The landing door's window rain in the rollout is an SVG transform loop inside the room art (compositor friendly). The preview's `background-position` loop repaints only the small clipped window region.

## 8. Room recolour and still

1. Apply 3.8 and 3.10 in `contracts.ts` (`LED`), `art/config.ts` (`TONES`, `RIM`, `PUTTY`, `TAG_TEXT`, `PHOSPHOR*`, `POOLS` colour keys), `art/objects/*` literals and `Defs.tsx` gradients.
2. Replace `WindowView.tsx` contents with the rain columns (base) and the `lab-rain` loop (lit layer); add `lab-rain` keyframes and its reduced motion rule to `lab-art.css`.
3. Regenerate the wall rasters (`node scripts/assets/panels.mjs print` with the mint gradient map, new poster and cover).
4. Regenerate the still: `node scripts/assets/room-still.mjs` with `/dev/room-still` served; check the opaque bounds still read x 10..1689, y 10..1449.
5. The landing door then needs no CSS grade; remove nothing else.

## 9. Preview notes

* `/dev/theme-b` renders the real `Header`, `LandingHero`, `Projects`, `Homelab` and `Footer` inside `.theme-b`. Every theme rule is scoped under `.theme-b` in `theme-b.css`, imported from `ThemeBRoot`.
* Hard-coded colours are overridden from outside: tokens on `.theme-b`; keycaps in `@layer components`; hard-coded utilities in `@layer utilities` with higher specificity; SVG fills through attribute selectors (`[fill="#4ade80"]`), which beat presentation attributes; inline colours (MagicCard surface, footer wrapper) with `!important` on `background-color` only, so the inline spotlight `background-image` keeps working.
* The landing still is graded, not re-rendered: the image is desaturated (`saturate(.3) brightness(.9) contrast(1.08)`) with a 0.5px mint rim; a low-saturation mint layer (`hsl(152 26% 46%)`, `mix-blend-mode: color`, 75%) is masked by the still's own alpha; the window opening (wall A, u 236 to 332, v 26 to 104, projected to 74.2% to 86% x and 26.2% to 47% y of the bitmap) is covered by a clipped, animated rain layer. All three share the image's 7s float. This is an approximation; section 8 is the real recolour.
* `RoomGuard` blocks "step inside" and "see it in the room" (the preview has no room view) and shows a short note. It is not part of the rollout.
* A small "theme b · mint terminal" badge sits bottom left from 640px up; preview only.

## 10. Files the rollout touches

Foundation and chrome:

* `src/styles/base.css` (tokens, `@theme inline`, selection, `.sec-title`, `.name-line`, `.dot-grid`)
* `src/app/layout.tsx` (body background and text classes)
* `src/styles/keys.css`
* `src/styles/sky.css` (drop `sky-drift-*` and `sky-shoot` once unused; add `b-drift-*` equivalents and the ping, packet and divider rules, or move them to `chrome.css`)
* `src/styles/chrome.css`, `src/styles/hero.css` (focus ring)
* `src/components/chrome/ClassicShell.tsx` (flat base, grid layer, divider), `Header.tsx`, `MobileMenu.tsx`, `Footer.tsx`
* `src/components/chrome/Skyline.tsx` and `skyline-data.ts` (replace with the divider; keep the export name or update `ClassicShell`)
* `src/components/sky/ClassicSky.tsx`, `RoomSky.tsx` (host `RainField`), `SkyLayers.tsx` and `sky-data.ts` (remove), new `src/components/sky/RainField.tsx` and rain tokens (move from `theme-preview/b`)
* `src/components/ui/MagicCard.tsx` (`SURFACE`, spotlight strength), `src/lib/og-card.tsx`, `src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx` (if they carry colours)

Sections:

* `src/components/sections/Projects.tsx`, `Websites.tsx`, `Experience.tsx`, `src/styles/work.css` (ticket)
* `src/components/sections/Homelab.tsx`, `src/lib/rack.tsx`, `src/styles/homelab.css`
* `src/components/sections/About.tsx`, `Photography.tsx`, `ExpandableGallery.tsx`, `Lightbox.tsx`, `src/styles/about.css`

Room:

* `src/components/lab/contracts.ts` (`LED` only; no geometry or id changes)
* `src/components/lab/art/config.ts`, `art/objects/*.tsx` (Shell, WindowView, WallArt, Desk, DeskItems, Lamp, Plant, Record, Rack, Camera, Cables, Chair, Defs), `src/styles/lab-art.css`
* `src/styles/lab.css`, `src/components/lab/LabHero.tsx`, `MusicCard.tsx`, `RackInspector.tsx`, `Box3D.tsx`, `IntroControls.tsx`, `HudKeys.tsx`
* `src/components/lab/terminal/Terminal.tsx`, `lines.tsx`, `commands.tsx`
* `src/components/lab/panels/*` (CRT, map, phone, badge, cert, poster, print, record, resume, focus shell; whichever exist after the current refactor), `src/styles/panels.css`
* Assets: `public/room/room-still.webp`, `public/lab/print.webp`, `public/lab/poster.webp`, `public/lab/cover.webp`, `public/previews/*.png` (and their generators in `scripts/assets/`)

Docs: `docs/BUILD-NOTES.md` (theme section, sky section, colour names in the file map).

## 11. Open decisions

* Whether the four section accents stay collapsed to mint (as previewed) or get subtle mint-family offsets (for example seafoam `#6ff7c0` for Homelab and About) to help orientation on long scrolls.
* Whether the room keeps the plank seams (as concrete panels) or switches to square floor tiles on the 64-unit grid, which echoes the page grid but changes the floor drawing.
* Poster subject (hex dump typography or contour field).
