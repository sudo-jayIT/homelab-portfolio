# Theme C: Depth Rain

Rollout spec for replacing the night sky theme with a modern digital rain theme. Preview: `/dev/theme-c` (dev only). Preview sources: `src/components/theme-preview/c/` (`tokens.ts`, `rain-engine.ts`, `DepthRain.tsx`, `RackHorizon.tsx`, `ThemeCShell.tsx`, `ThemeCFx.tsx`, `theme-c.css`) and `src/app/dev/theme-c/page.tsx`.

## 1. Direction

The page lives inside a deep, green-black void filled with falling glyph rain at three depths. The far layer is tiny, soft and slow, like rain seen through fog; the mid layer carries most of the texture; the near layer is sparse, large, sharp and fast. All three move with the pointer (parallax) and with scroll (each layer shifts at its own rate), using the existing `SkyMotion` variables. Moving the pointer also acts as a lens: rain near the cursor brightens and the idle glyph grid behind it faintly shows through.

The palette runs emerald to teal, with cyan as a restrained secondary accent (about one drop in ten, one section accent, the horizon beacons). Surfaces are green-black, never pure black or navy. Keycaps become deep green-black with glowing emerald legends; the primary (light) key becomes an emerald key with a dark legend. A very subtle scanline and grain overlay unifies the screen, and section titles assemble with a short glitch-in.

Rules the theme keeps:

* The glyph set is hex digits and code punctuation (a packet dump), not katakana. No film titles, logos, characters, quotes or allusions anywhere: not in copy, terminal commands, alt text, file names or easter eggs. The look is generic digital rain.
* Rare vertical words in the rain come only from the owner's own stack: `PVE1` to `PVE4`, `QDEVICE`, `OPNSENSE`, `TAILSCALE`, `PGVECTOR`, `HNSW`, `SPLUNK`, `WIRESHARK`, `PROXMOX`, `NFS`, `IMMICH`, `MCP`, `VLAN`, `ACL`, `SSH`.
* Layout, motion system, interaction system and the view switch stay as they are. Only colors, the sky layers, the divider and the small effects listed here change.

## 2. Palette

### 2.1 Core values

| Name | Value | Use |
|---|---|---|
| void | `#020605` | page background, top of the backdrop |
| backdrop stops | `#020605` 0%, `#03100c` 30%, `#041411` 65%, `#051a16` 88%, `#07201b` 100% | classic wrapper gradient |
| card | `#06120e` | every card surface |
| card inset | `#040e0b` | preview placeholder strip, inset wells |
| footer | `#010604` | footer and near horizon silhouette |
| title | `#eafff5` | section titles, landing name |
| foreground | `#e3f5ec` | body text base |
| putty (mint) | `#a8f0cf` | neutral accent (prompt, hotspots, footer hover icons) |
| emerald 200 / 300 / 400 / 500 / 600 / 700 / 800 / 900 | `#b4f7d9` / `#6ff2bf` / `#3ee89f` / `#19c784` / `#0f9e69` / `#0b7350` / `#0a4a35` / `#07291e` | primary scale |
| teal 300 / 400 / 500 / 700 | `#5fe3d3` / `#2fd6c0` / `#14b3a3` / `#0c5f58` | secondary scale |
| cyan 300 / 400 | `#9be8f5` / `#5fd8ec` | restrained accent |
| phosphor | `#a6f06b` | yellow-green, one section accent and the CRT highlight |
| lead | `#e6fff4` | lead glyph core |
| line | `rgba(140,255,210,0.10)` | default hairline border (was `white/10`) |
| line soft | `rgba(140,255,210,0.065)` | dividers (was `white/[0.04]` to `white/[0.07]`) |
| glass | `rgba(2,8,6,0.80)` | header glass |
| ring | `rgba(111,242,191,0.75)` | focus ring |
| alert red | `#ff6b7d` | functional only: blocked packets, firewall alerts, terminal errors |

### 2.2 Contrast (computed, WCAG 2.x, against void / card / backdrop bottom)

| Text | void | card | bottom |
|---|---|---|---|
| title `#eafff5` | 19.52 | 18.28 | 16.34 |
| foreground `#e3f5ec` | 17.98 | 16.84 | 15.05 |
| putty `#a8f0cf` | 15.55 | 14.56 | 13.02 |
| signal `#3ee89f` | 12.85 | 12.04 | 10.76 |
| dusk `#2fd6c0` | 11.16 | 10.45 | 9.34 |
| sodium `#a6f06b` | 14.84 | 13.90 | 12.42 |
| beacon `#5fd8ec` | 12.15 | 11.38 | 10.17 |
| white/55 body copy | 6.26 | 6.22 | 5.92 |
| white/45 meta | 4.46 | 4.52 | 4.40 |
| key legend `#6ff2bf` on the dark key face | 12.89 | | |
| `#02140c` on the emerald light key face | 10.78 | | |

White at 45% sits just under 4.5:1 on void and the backdrop bottom. The rollout should raise those meta labels (`text-white/45`, `text-white/40`) to `/50` or use `--putty` at 60% where they carry information. The rain sits behind text, so the near and mid layers dim their middle columns (section 6.1) to keep copy readable.

## 3. Token and color mapping

Every existing token and hard-coded color family, with its Depth Rain value. "Keep" means the value stays as is.

### 3.1 `src/styles/base.css` `:root`

| Token | Now | Depth Rain |
|---|---|---|
| `--background` | `#080808` | `#020605` |
| `--foreground` | `#f0f0f0` | `#e3f5ec` |
| `--signal` | `#3ecbff` | `#3ee89f` (emerald) |
| `--dusk` | `#a58bff` | `#2fd6c0` (teal) |
| `--beacon` | `#ff5a87` | `#5fd8ec` (cyan) |
| `--sodium` | `#ff9d3c` | `#a6f06b` (phosphor) |
| `--putty` | `#e6d9b5` | `#a8f0cf` (mint) |
| `--card` | `#0a0d19` | `#06120e` |
| `--footer` | `#05070d` | `#010604` |
| `--title` | `#f7f4ec` | `#eafff5` |
| new `--line`, `--line-soft`, `--glass`, `--ring`, `--card-inset` | none | values from 2.1 |
| new `--emerald-200` to `--emerald-900`, `--teal-*`, `--cyan-*`, `--lead` | none | values from 2.1 |

### 3.2 `@theme inline` (base.css)

| Entry | Now | Depth Rain |
|---|---|---|
| `--color-putty` | literal `#e6d9b5` | `var(--putty)` (must become a var, or `text-putty` stays cream) |
| `--color-sec` | `var(--sec, #e6d9b5)` | `var(--sec, var(--putty))` |
| `--color-signal`, `--color-dusk`, `--color-beacon`, `--color-sodium`, `--color-background`, `--color-foreground` | vars | keep (they follow 3.1) |
| new `--color-card`, `--color-line`, `--color-emerald-*`, `--color-teal-*`, `--color-cyan-*` | none | add, so components can write `bg-card`, `border-line`, `text-emerald-300` instead of hex |
| fonts | Geist, Geist Mono, Archivo | keep (section 5) |

### 3.3 Section accents (`[data-sec]` in base.css, `SECTIONS[*].accent` in site.ts)

Accent keys stay the same, only the values change, so no content file edits are needed.

| Key | Now | Depth Rain | Sections today |
|---|---|---|---|
| `signal` | sky blue `#3ecbff` | emerald `#3ee89f` | Projects, Contact |
| `dusk` | violet `#a58bff` | teal `#2fd6c0` | Homelab, About |
| `sodium` | orange `#ff9d3c` | phosphor `#a6f06b` | Websites, Photography |
| `beacon` | pink `#ff5a87` | cyan `#5fd8ec` | Experience |

If the concurrent content work drops or reorders sections, the mapping still holds per key.

### 3.4 Global rules (base.css)

| Rule | Now | Depth Rain |
|---|---|---|
| `::selection` | `#e6d9b54d` | `rgba(62,232,159,0.30)` |
| `body` | `var(--background)` | keep (follows token); `layout.tsx` body `bg-[#080808] text-[#f0f0f0]` becomes `bg-background text-foreground` |
| `.sec-title` color | `#f7f4ec` | `var(--title)`; add `text-shadow: 0 0 .45em rgba(62,232,159,.12)` |
| `.name-line` color and shadow | `#f7f4ec`, `0.035em 0.045em #05070d` | `var(--title)`, `0.035em 0.045em #04241a, 0 0 .5em rgba(62,232,159,.14)` (a deep emerald extrusion) |
| `.dot-grid` | `#ffffff1f` dots | `rgba(110,242,191,0.14)` |
| running text over the rain (new) | none | `p` and `li` inside the classic wrapper get `text-shadow: 0 0 3px rgba(2,6,5,.95), 0 0 12px rgba(2,6,5,.9)`, a dark halo that carves the rain out from under copy without a visible box |
| view switch, scroll locks, parallax, LED keyframes | | keep |

### 3.5 Keycaps (`src/styles/keys.css`, `src/styles/hero.css`)

| Part | Now | Depth Rain |
|---|---|---|
| `.key` legend | `#ffffffdb`, hover `#fff` | `#6ff2bf` with `text-shadow: 0 0 10px rgba(62,232,159,.35)`; hover `#b4f7d9` |
| `.key` face | `linear-gradient(#2c3035, #1c1f23)` | `linear-gradient(#10211b, #07130f)` |
| `.key` shadow | `inset 0 1px #ffffff1a, 0 3px #0a0b0d, 0 6px 14px #0000008c` | `inset 0 1px rgba(150,255,215,.12), inset 0 0 0 1px rgba(62,232,159,.07), 0 3px #010805, 0 6px 14px rgba(0,0,0,.6)` |
| `.key:hover` shadow | `0 4px`, `0 8px 18px` | same offsets plus `0 0 22px -4px rgba(62,232,159,.30)` |
| `.key:active` | `inset 0 1px #ffffff0f, 0 0 #0a0b0d, 0 1px 3px #00000080` | `inset 0 1px rgba(150,255,215,.08), 0 0 #010805, 0 1px 3px rgba(0,0,0,.5)` |
| `.key-light` face and legend | `linear-gradient(#efe8d4, #d4cab1)`, `#2a2620` (hover `#1a1712`) | `linear-gradient(#6ff2bf, #22c487)`, `#02140c` (hover `#010b07`), no text-shadow |
| `.key-light` shadow | `inset 0 1px #fffc, 0 3px #9a8f77` | `inset 0 1px rgba(230,255,244,.8), 0 3px #0a6a48`; hover adds `0 0 26px -4px rgba(62,232,159,.5)` |
| focus ring (`.key`, `.mini-room`) | `2px solid #efe8d4b3` | `2px solid rgba(111,242,191,.75)` |
| `.key-legend` | opacity .5 | keep (inherits the legend color) |
| `.mini-room-shadow` | `#0009` | `rgba(0,4,2,.7)` |
| door under-glow (new) | none | `.mini-room::before`, radial `rgba(47,214,192,.12)` to `rgba(62,232,159,.045)` |

### 3.6 Header and mobile menu (`src/components/chrome/Header.tsx`, `MobileMenu.tsx`)

| Part | Now | Depth Rain |
|---|---|---|
| glass background | `bg-[#080808]/85 backdrop-blur-xl` | `bg-[rgba(2,8,6,0.8)]` (token `--glass`), blur kept |
| glass border | `border-white/[0.06]` | `rgba(62,232,159,0.12)` |
| active nav link | `text-white` | `text-emerald-300` plus `0 0 12px rgba(62,232,159,.4)` text glow |
| inactive links | `text-white/60 hover:text-white` | keep |
| burger | `border-white/10 text-white/70` | `border-line`, keep text |
| mobile menu sheet | `bg-[#080808]/95` | `rgba(2,8,6,0.95)` |

### 3.7 Cards, chips and surfaces

| Part | File | Now | Depth Rain |
|---|---|---|---|
| MagicCard surface | `ui/MagicCard.tsx` (`SURFACE`) | `#0a0d19` | `var(--card)` |
| MagicCard spotlight | same | 350 px, `--sec` 10% | keep formula (now emerald/teal per section); default fallback `var(--putty)` |
| MagicCard border | same | `border-white/10`, hover `border-sec/40` | `border-line`, hover keep |
| project preview fade | `sections/Projects.tsx` | `to-[#0a0d19]` | `to-card` |
| placeholder strip | same | `dot-grid bg-[#080b14]` | `dot-grid bg-card-inset` (dot grid follows 3.4) |
| icon chip | same | `bg-white/[0.04] border-white/10 text-white/75` | `bg-[rgba(110,242,191,0.045)] border-line`, keep text |
| accent chip | same | `bg-sec/10 text-sec border-sec/20` | keep (follows accent) |
| Homelab cards | `sections/Homelab.tsx` | `bg-[#0a0d19]`, `border-white/10`, divider `white/[0.07]`, index column `bg-white/[0.03]` | `bg-card`, `border-line`, `divide-line-soft`, `bg-[rgba(110,242,191,0.03)]` |
| Homelab callout bubbles | same (SVG) | `fill="#0a0d19"` | `var(--card)` |
| Websites cards | `sections/Websites.tsx` | `#0a0d19` | `bg-card` |
| section top borders | all sections | `border-white/[0.06]` | `border-line-soft` |
| About photo frame | `sections/About.tsx` | frame `#0c0d0e`, mat `#e9e6de`, clip `#2b2f33` | frame `#050c0a`, mat `#e3efe9`, clip `#16221d` |
| Lightbox and About gradient | `Lightbox.tsx`, `About.tsx` | `#080808` | `var(--background)` |
| service status dots, footer status dot | Homelab, Footer | `bg-emerald-400` | `bg-[var(--signal)]` (same family, now on token) |

### 3.8 Experience ticket (`src/styles/work.css`)

| Part | Now | Depth Rain |
|---|---|---|
| `.ticket` background and border | `#0a0d19`, `#ffffff1a` | `var(--card)`, `var(--line)` |
| `.ticket-stub` tint | `--sec` 9%, dashed tear `--sec` 55% | keep formula (now cyan, the Experience accent); solid fallbacks become `var(--sec, var(--putty))` |
| `.ticket-bars` | `#fff` bars at .4 | `#b4f7d9` bars at .35 |
| badge bands (`content/experience.ts`) | `#14532d`, `#312e81`, `#7c2d12` | real employer colors are fine as data; for the theme use `#0b7350`, `#0c5f58`, `#0a4a35` unless the owner wants the employer's own color on the badge |

### 3.9 Homelab rack and LED palette

`src/lib/rack.tsx`, `src/components/lab/Box3D.tsx`, `src/components/sections/Homelab.tsx`, `src/components/lab/contracts.ts`.

| Family | Now | Depth Rain |
|---|---|---|
| rack frame and rails (`FRAME #d6dadd`, top band `#e2e5e7`, rails `#121416`, lips `#1d2023`) | light steel and graphite | frame `#c9d6d0` (cool steel with a green cast), rails `#0f1714`, lips `#18221e` |
| device faces (`#0b0c0e` to `#262a2e`, ports `#050607`, `#060708`, `#040506`) | neutral graphite | shift each by the same small green cast: `#0a0f0d` to `#212a26`; ports `#030605` |
| labels and silkscreen (`#e5e7eb`, `#cbd5e1`, `rgba(255,255,255,.4 to .7)`, `#8a9196`) | gray-white | `#d5ece2`, `#b6d4c7`, `rgba(220,255,240,.4 to .7)`, `#7f948b` |
| power cord `CORD #eef1f3` | white | keep (cables read as real objects) |
| plinth (`#14171a`, highlight `white/.14`, label `#eeece4` with `#111` text) | | `#0b1310`, `rgba(140,255,210,.14)`, label `#e3efe9` with `#05100b` |
| carry handles (`#2a2e33`) | | `#17221e` |
| amber accent on switch (`#fb923c`), red pull tab (`#b91c1c`), brown SSD (`#3b1d08`, `#5b3413`) | warm | switch accent `#3ee89f`; red pull tab keep (real hardware color); SSD `#123527` / `#1d4d3a` |
| `LED.green` | `#4ade80` | `#3ee89f` |
| `LED.emerald` | `#34d399` | `#19c784` |
| `LED.cyan` | `#22d3ee` | `#5fd8ec` |
| `LED.blue` | `#60a5fa` | `#2fd6c0` (teal; blue leaves the palette) |
| `LED.amber` | `#fbbf24` | `#d9f06b` (pale phosphor; still reads as "activity/warning") |
| `LED.red` | `#fb7185` | `#ff6b7d` (functional alert, keep red) |
| `LED.white` | `#f1f5f9` | `#e6fff4` |
| `LED.warm` | `#fdba74` | `#c8f5dc` (jade lamp light) |
| inspector box (`Box3D.tsx` `#4ade80`, `#60a5fa`, `#b91c1c`, steel `#c9ced1` to `#e4e7e9`) | | `LED.*` values above; steel `#bccbc4` to `#dbe8e2` |

Because `Led`, `ledTiming`, the glow and pool gradients all read `LED`, changing `contracts.ts` recolors the room, the homelab diagram and the inspector together.

### 3.10 Terminal and intro (`src/components/lab/terminal/*`)

| Part | Now | Depth Rain |
|---|---|---|
| console text | `#cfcfcf` | `#bfe9d6` |
| caret | `border-[#e8e8e8]` | `#9ff5d3` |
| dim lines, nmap header, closed ports | `#8a8a8a` | `#5f8f7c` |
| `[ OK ]` and service bullet | `#5fd07a`, `#7bd88f` | `#3ee89f` |
| error ("nice try.") | `#ff8a8a` | keep |
| highlights `text-white/85` | | keep |
| scrollbar thumb | `rgba(255,255,255,.18)` | `rgba(110,242,191,.2)` |
| console surface (engine: `#050706`, `#0b0d0c`, `#030504`) | already green-black | keep |
| intro banner, prompt user | `text-putty` | follows `--putty` |

The terminal copy must not gain film references or allusions of any kind. Commands stay as they are.

### 3.11 Room UI (`src/styles/lab.css`, `LabHero.tsx`, `MusicCard.tsx`)

| Part | Now | Depth Rain |
|---|---|---|
| hotspot hover fill / stroke | `#e6d9b51a` / `#e6d9b5e6`, rack `#e6d9b508` | `rgba(168,240,207,.10)` / `rgba(168,240,207,.9)`, rack `rgba(168,240,207,.03)` |
| marker back / ring / dot | `#0607089e`, `#e6d9b580`, `#e6d9b5` | `rgba(1,6,4,.62)`, `rgba(168,240,207,.5)`, `#a8f0cf` |
| tooltip | `bg-[#0b0d0c]/95 border-putty/25 text-putty` | keep surface; putty follows token |
| section and dim scrim | `#050706`, `#030504/80` | keep |
| music card | `bg-[#0b0d0c]/95`; label `#e6d9b5`, `#cdbf98`, `#2a2620` | keep surface; label `#a8f0cf`, `#6ff2bf`, `#05100b` |

### 3.12 Room scene palette (B3 art, `src/components/lab/art/**`)

The room keeps its geometry, objects and lighting logic. It moves from a warm lamplit night to a dark room lit mostly by green screens and teal LEDs, with one soft jade lamp so it still feels lived in.

**Material tones (`config.ts` `TONES`, top / left / right):**

| Tone | Now | Depth Rain |
|---|---|---|
| `chassis` | `#1c232a` `#12181e` `#0c1014` | `#18221f` `#101815` `#0a110e` |
| `wood` (desk) | `#2a2119` `#1b1510` `#140f0b` | smoked oak `#211e18` `#16140f` `#100e0b` |
| `metal` | `#3b444d` `#272e35` `#1c2127` | `#34403b` `#232d29` `#19221e` |
| `plastic` | `#191e23` `#101418` `#0b0e11` | `#151c19` `#0e1412` `#0a0f0d` |
| `putty`, `puttyDark` (CRT and keyboard shells) | `#a39b86` family, `#8a8371` family | pale sage `#93a69b` `#7c8f84` `#62746a`; dark `#7c8f84` `#68796f` `#526158` |
| `fabric` | `#22262c` `#181b20` `#121418` | `#1b2420` `#131a17` `#0e1411` |
| `slab` (floor slab edge) | `#1a1511` `#2a221b` `#211a14` | `#121512` `#1e221d` `#171a16` |
| `wallA` | `#30363c` `#1a1e22` `#262b31` | `#26302c` `#141b18` `#1d2622` |
| `wallB` | `#30363c` `#262b31` `#15181c` | `#26302c` `#1d2622` `#111714` |
| `rackCab` | `#17191b` `#0f1113` `#0a0b0c` | `#131915` `#0c110f` `#080b0a` |
| `recordWood`, `plinth`, `pot` | warm browns `#3a2a1d` to `#271b14` | keep wood but desaturate 30% toward `#2b261d` family |
| `camBody`, `camDial`, `sill`, `phone`, `spotBracket`, `spotHead` | graphite `#0b0c0d` to `#343a41` | same small green cast as `chassis` |
| `RIM` | `rgba(160,255,230,.08 / .15)` | keep (already mint) |

**Constants:** `PUTTY #e6d9b5` becomes `#a8f0cf`; `TAG_TEXT #efe6cc` becomes `#d5f7e6`; `PHOSPHOR #ffb347` becomes `#45f0a0` (green phosphor) and `PHOSPHOR_DIM` becomes `rgba(69,240,160,.45)`; `PACKET_CORE #ecfdf5` keep; `FRAME #0c0d0e` becomes `#050c0a`.

**Floor, rug, walls (`objects/Shell.tsx`, `WallArt.tsx`):**

| Part | Now | Depth Rain |
|---|---|---|
| floor planks and seams | `#1a1511`, rows `#1d1813`, seams `#0f0c09` | `#121411`, `#151813`, seams `#0a0c0a` |
| rug | violet `#1b1a2c`, borders `#3a3656`, `#2a2740` | deep teal `#0a1c19`, borders `#1f4a40`, `#163a32` |
| baseboard | `#0e1113` | `#0b100e` |
| outlet plate | `#c9ccd0` with `#1a1c1e` | `#b9c7c0` with `#141a17` |
| shelf lips `#2b2f33` | | `#1c2622` |

**Lights and glows (`objects/Defs.tsx`, `RoomLights.tsx`, `config.ts` `POOLS`):**

| Part | Now | Depth Rain |
|---|---|---|
| floor halo (`lab-halo`, hidden today) | `#12302b` | keep |
| lens gradient | `#3b4a6b` to `#05070b` | `#2c4a42` to `#030806` |
| glow and pool gradients | per `LED` color | follow 3.9 (warm pool becomes jade, blue pool becomes teal) |
| `POOLS` | warm, blue, amber, cyan | jade (`warm`), teal (`blue`), emerald (`amber` slot now pale phosphor; switch the desk pool to `green`), cyan |
| CRT glow (`lab-crt-glow`) | `#ffb347` at .16 | `#45f0a0` at .16 |
| scan pattern | `rgba(0,0,0,.35)` | keep |
| spotlight beam | `#e6f0ff` .3 to .02 | `#d8fff0` .26 to .02 |
| vinyl sheen | white | keep |
| lamp shade and mouth (`objects/Lamp.tsx`) | `#3b3127`, `#4a3e31`, mouth `#fde2b8` | `#25302b`, `#2f3b35`, mouth `#d6f7e6` |
| cable jackets (`Cables.tsx`) | `#0c1211` | keep |
| blocked count label | `#fecdd3` | `#ffc2ca` (alert family) |
| packets | white core, cyan and amber trails | white core, cyan and emerald trails |

**Window content (`objects/WindowView.tsx`): rain instead of the night skyline.**

* Sky gradient (`lab-sky`, `#080c1a` to `#141a33` to `#3a2a44`) becomes `#020806` to `#04140f` to `#0a2a20`.
* Stars and the moon are removed.
* Base layer: 9 static glyph columns (SVG `text`, Geist Mono, 3.2 units, `#0f9e69` at .55, 6 to 12 glyphs each, seeded) plus the two building rows kept as dark silhouettes (`#06110d` back, `#030806` front) so the window still reads as "outside".
* Lit layer: the 23 lit windows become emerald and cyan (`#3ee89f` and `#5fd8ec` instead of `#fcd9a0` and `#dbeafe`; six still pulse), and three of the glyph columns get a lead glyph (`#e6fff4`) that falls with a CSS `translateY` loop (6 to 9 s, linear, inside the clip). Reduced motion: no loop, leads parked mid-column.
* Mullions `#0b0d0f` become `#070b09`.

**CRT (`objects/Desk.tsx`, `panels/CrtPanel.tsx`):** amber phosphor becomes green phosphor. Bezel `#6f6958` / `#1d1a14` becomes `#62746a` / `#121815`; screen `#0b0904` / `#1a0f03` becomes `#020a06` / `#03140c`; screen text and bars `#ffb347` become `#45f0a0`, highlight `#ffcf8a` becomes `#b4f7d9`, selection `bg-[#ffb347] text-[#130b02]` becomes `bg-[#45f0a0] text-[#03140c]`. CRT panel case `#ddd4bd` to `#b9ae95` becomes `#c3d2ca` to `#93a69b`; brand label `#5b5546` becomes `#4c5c53`; power LED `#4ade80` becomes `LED.green`.

**Desk items (`objects/DeskItems.tsx`):** paper (`#f1efe9`, `#d9d6cf`, lines `#b8b4ab`) cools to `#e9f2ee`, `#cfdcd5`, `#a9b8b0`. Badge blues (`#1e3a8a`, `#1d4ed8`) become the employer badge band color (3.8). The band ball keeps its multicolor bands (a real object), but desaturated 25% so it does not out-shout the screens. Phone `#0f172a` becomes `#06120e`.

**Poster and print art direction:**

* Poster (`/lab/poster.webp`, fallback `lab-poster-sea` lighthouse): replace with an original typographic poster: a black field, a large emerald hex dump block in Geist Mono with one line highlighted, and a small caption naming the owner's own network ("pve1 to pve4 · OPNsense · Tailscale"). No film art, no katakana, no figures. Fallback gradient `#0f1d33` family becomes `#04140f` to `#0a2a20`.
* Print (`/lab/print.webp`, warm gradient map of photo 1): regenerate with a cool duotone map: `#020806` to `#0f5b45` to `#c8f5dc`, 10% original color kept. Fallback `lab-print-warm` becomes the same three stops. Picture light (`#f2d99a`, `#ffd9a0`) becomes `#d6f7e6`.
* Map (`#0f1a24`, slate strokes `#94a3b8`, `#e2e8f0`, `#cbd5e1`, pin `#fca5a5`): `#06120e`, strokes `#5f8f7c`, labels `#d5ece2`, `#b6d4c7`, pin `#ff6b7d`.
* Certificates: paper `#e9e6de` becomes `#e3efe9`, ink `#1f2328` keep, rules `#b5b1a8` become `#a9b8b0`. Wordmark and seal colors in `content/about.ts` are issuer colors; keep them if they are real issuer marks drawn as plain text, otherwise use `#0b7350` / `#0c5f58`.

**Panels (`src/components/lab/panels/*`):** scrims `#0c0d0e` become `#050c0a`; `PhonePanel` `#1b2a44` becomes `#0a1c19`; `CameraPanel` accent `#0095f6` becomes `#5fd8ec`, its graphite family follows `chassis`; `RecordPanel` graphite follows `chassis`; `MapPanel` follows the map row; `BadgePanel` slate becomes the rack label family; `panels.css` preview backdrop `#10141a` / `#050706` becomes `#06120e` / `#020605`.

### 3.13 Room still

`/room/room-still.webp` is a raster of the room. After the B3 art recolor, rerun `node scripts/assets/room-still.mjs` (dev server must serve `/dev/room-still`) and check the opaque bounds (x 10..1689, y 10..1449). The preview approximates the result with an SVG filter on the landing door image (`#tc-room-tint`: luminance through an emerald gradient map, 82% map plus 18% original). The real recolor should look close, but with the lamp jade, the CRT green and the window full of rain; delete the filter once the still is regenerated.

### 3.14 OG and Twitter card (`src/lib/og-card.tsx`)

The navy to dusk gradient (`#06080f`, `#0b0f1d`, `#121129`, `#1c1530`) becomes the backdrop stops in 2.1; the moon (`#e7ecf4`) is replaced by 14 static glyph columns drawn as text in emerald at .25 to .6, with lead glyphs `#e6fff4`; the name uses `--title`, the role line `--putty`; the footer strip `#05070d` becomes `#010604`.

## 4. What replaces each sky element

| Sky element (today) | Depth (`--d` / `--s`) | Depth Rain replacement |
|---|---|---|
| Star tile A (560 px) | 6 / 0.02 | far rain canvas: 9 px glyphs, 0.6x backing (naturally soft), 30 fps, `--d 5`, scroll 0.035 |
| Star tile B (760 px) | 13 / 0.045 | mid rain canvas: 14 px glyphs, `--d 13`, scroll 0.10, pointer lens and grid reveal |
| Star tile C (900 px) | 22 / 0.08 | near rain canvas: 22 px glyphs, crisp, `--d 28`, scroll 0.24 |
| Milky way band | 9 / 0 | depth fog between far and mid (two teal and emerald radial washes plus a light top and bottom darkening), `--d 9` |
| 12 twinkles (two stacked copies) | 18 / 0.065 | removed; lead glyph flicker and the rare token words carry the "sparkle" |
| Constellations (Ursa Major, Cassiopeia) | 15 / 0.03 | removed; their role as discoverable detail moves to the token words that spell the owner's stack |
| Moon | 26 / 0.035 | removed; replaced by a static teal haze at the top of the stage (`radial-gradient(110% 60% at 50% -12%, rgba(47,214,192,.11), transparent 62%)`) |
| Two satellites | 44, 34 / 0 | removed |
| Two shooting stars | 30 / 0 | removed; the cyan drops (about 10%) give the occasional fast bright streak |
| Skyline divider (two city layers, lit windows, red antenna beacon, violet glow) | 7, 17 (x only) | rack horizon (`RackHorizon.tsx`): a seeded row of server cabinets instead of buildings. Near row (`#010604`): full height (46 x 86 to 100 units), half height (46 x 56 to 66), wide (60 x 74 to 84) and short (36 x 30 to 40) cabinets with 2 to 5 unit gaps, each with a door inset (`#03100b`, emerald hairline), unit seams every 6 units, a lit top edge and LED rows on about 42% of units (emerald, 16% cyan; 20% blink with `lab-act`, 14% pulse with `lab-pulse`). Far row (`#04130e`): narrower cabinets with teal top edges and faint seams. Two thin masts with a pulsing cyan beacon replace the red antenna. Teal horizon glow. Same parallax depths, same heights (`h-32 md:h-44`), near fill equals the footer |
| Footer | | `#010604` background, `border-line-soft` borders, `text-white/50` labels (raise to /55, see 2.2), hover icon `text-putty` (mint). The status dot stays emerald |
| Room sky (`RoomSky`, fixed) | same layers | `DepthRain fixed`, same three layers; its loop is paused while the classic view is showing (display none means not intersecting), and the classic one is paused in the room |
| Classic backdrop gradient (`ClassicShell`) | | backdrop stops in 2.1 |
| Room sky backdrop `linear-gradient(#06080f, #070a13)` | | `linear-gradient(#020605, #03100c)` |

Two screen effects are new and sit over everything (pointer-events none, z 60 and 61, above the header):

* Scanlines: `repeating-linear-gradient(180deg, transparent 0 2px, rgba(0,10,6,.55) 2px 3px)` at opacity .085 (about 4.7% darkening on one row in three).
* Grain: an SVG `feTurbulence` tile (180 px, mint) at opacity .05, shifted in 5 steps per 0.8 s with `transform` only.

## 5. Typography

No family changes: Archivo (condensed `.display`) for titles and the name, Geist for body, Geist Mono for labels and the rain atlas. The rain needs a monospace face with even digit widths, which Geist Mono provides. Changes are color and glow only:

* `.sec-title` and `.name-line` get the faint emerald glow and the deep emerald name extrusion from 3.4.
* Section kickers stay mono, uppercase, `tracking-[0.2em]`, in `--sec`.
* Keycap legends gain a soft emerald text glow (3.5).
* Optional, not in the preview: render the landing prompt (`guest@host:~$ whoami`) with a blinking block caret using the existing `lab-caret` keyframes.

## 6. Motion

### 6.1 Rain layers (source of truth: `RAIN_LAYERS` in `tokens.ts`)

| | Far | Mid | Near |
|---|---|---|---|
| glyph size | 9 px | 14 px | 22 px |
| column / row pitch | 11 / 11 px | 19 / 17 px | 34 / 26 px |
| fall speed | 34 to 62 px/s | 95 to 165 px/s | 230 to 360 px/s |
| trail | 10 to 22 cells | 12 to 26 cells | 9 to 18 cells |
| live drops per column | 0.80 | 0.45 | 0.30 |
| peak body alpha | .60 | .56 | .72 |
| body color | teal 500 `#14b3a3` | emerald 500 `#19c784` | emerald 400 `#3ee89f` |
| cyan drop share | 8% (`#5fd8ec`) | 10% (`#5fd8ec`) | 12% (`#9be8f5`) |
| backing scale | 0.6x (soft by upscaling) | clamp(dpr, 1, 1.5) | clamp(dpr, 1, 2) |
| frame rate | 30 fps | display rate | display rate |
| body glow | none | 0.18 glyph | 0.12 glyph |
| pointer parallax `--d` | 5 | 13 | 28 |
| scroll rate (px per px scrolled) | 0.035 | 0.10 | 0.24 |
| pointer lens | none | 150 px, gain 1.1, idle grid reveal up to .16 | 190 px, gain 0.9 |
| token words | none | 5% of new drops | 8% of new drops |
| center dimming | none | center columns at 70%, full strength from 86% of the half width outward | center columns at 42%, same ramp |

Column count is `ceil((width + 96) / pitch)`, so density scales with the viewport. Measured drop counts: 112 far, 36 mid and 14 near at 1440 x 900; 36, 12 and 5 at 390 x 844.

### 6.2 Glyph set

`0123456789ABCDEF` (weighted 3x) plus `< > / \ | { } [ ] = + * : ; # $ % &`. Letters G to Z exist in the atlas only to spell token words. No katakana, no mirrored glyphs.

### 6.3 Lead glyph and trail

* Each column owns a fixed strip of glyph cells. A drop is a brightness wave falling through that strip: cell alpha is `peak * (1 - d / trail) ^ 1.6`, where `d` is the distance behind the head.
* The lead glyph (`#e6fff4` with a baked emerald glow) crossfades between the two cells around the exact head position, so the head glides while glyphs stay on the grid. A soft bloom sprite (32% alpha) follows the exact head position.
* The lead cell swaps its glyph every 60 to 120 ms. Trail cells shimmer (about 2.2 swaps per drop per second); idle cells mutate at 0.06 per second.
* Token words are written down the column ahead of a new drop and locked until its trail has passed, so the word lights up letter by letter, then dissolves back into hex.
* Drops respawn above the top at a random column once the tail leaves the bottom.

### 6.4 Pointer and scroll

* Pointer parallax is pure CSS: each canvas carries `.par` with its `--d`, driven by `--px` / `--py` from `SkyMotion` (160 ms eased). Canvases overhang the stage by 48 px per side so edges never show.
* Scroll parallax happens inside the frame loop: each layer shifts its grid (drops included) by `--sy * scroll`. Scrolling down lifts the near rain fastest, which reads as depth and briefly slows the apparent fall.
* The lens is placed from the same eased `--px` / `--py`, corrected for each canvas's own parallax offset. When the pointer leaves the page `SkyMotion` parks it at exactly 0,0; the lens then fades out (5 per second).
* Touch: no pointer parallax or lens (as today); scroll parallax still works.

### 6.5 Glitch-in on section titles

* Trigger: once, when 15% of the `h2.sec-title` is visible (the same moment `BlurFade` reveals the heading). 60 ms delay, 620 ms, `steps(1, end)` per keyframe.
* Main text: assembles through clipped horizontal slices with sideways jitter of up to 0.06 em, clean by 72%.
* Two split copies (`::before` emerald 400, `::after` cyan 400, text from `data-text`) flash offset slices of up to 0.08 em and are gone by 62 to 68%.
* Rollout: add a small client `GlitchTitle` used by `SectionHeading` (it sets `data-text` and flips `data-glitch` from an IntersectionObserver), and move the keyframes into base.css. Reduced motion: no attribute, no pseudo content, no animation.

### 6.6 Other motion

* Canvas fade-in: 0.7 s after the first frame is drawn (no flash of empty canvas, no layout shift).
* Horizon LEDs: existing `lab-act` (1.2 s) and `lab-pulse` (3.2 s); beacons 2.4 s ease-in-out.
* Grain: 0.8 s, 5 steps, transform only.
* Everything else (name-in, door float and tilt, keycap press, BlurFade, header fade) is unchanged.

### 6.7 Reduced motion

* The rain loop never starts; one static frame is drawn (drops frozen mid-fall, so it reads as a glyph field), and redrawn on resize.
* `SkyMotion` is already off, so there is no parallax and no lens.
* No glitch, no grain movement, no LED blinking on the horizon, no canvas fade transition.

## 7. Performance

* One atlas per layer (body, cyan and lead variants of 54 glyphs, 16 columns). A frame is one `clearRect` and `drawImage` calls per lit cell: at 1440 x 900 roughly 1,000 to 2,500 per frame across the three layers. No `fillText`, no `shadowBlur` and no per-frame gradients in the loop.
* Canvases are cleared every frame, so there is no trail residue (the classic translucent-fill trick leaves 8-bit ghosts on transparent canvases).
* The far layer renders at 0.6x resolution and 30 fps; DPR is capped at 2 (mid at 1.5).
* Measured in headless Chrome on the development machine: 0.82 ms of script per frame at 1440 x 900 and 0.20 ms at 390 x 844 (simulation plus drawing, all three layers). Cumulative layout shift on load and through a full scroll: 0.
* Pointer parallax is compositor-only (`translate` on `will-change` layers). Scroll and lens values are read with `el.style.getPropertyValue`, which does not force style recalculation; `getBoundingClientRect` runs only while the lens is active.
* The loop stops when the tab is hidden (`visibilitychange`) and when the stage is not intersecting the viewport, which covers scrolling past the classic wrapper and `display: none` in the other view.
* Adaptive quality: an exponential average of the frame script cost is checked every 90 frames; above 7 ms, every layer drops 20% of its drops (floor: 35% of the seeded count).
* The scanline and grain overlays are full-screen but static or transform-animated, with normal blending (no `mix-blend-mode`).
* Resize reseeds the grid and drops; DPR or font changes rebuild the atlas. Fonts: the atlas waits for `document.fonts.ready`.
* Room view: only one `DepthRain` should run at a time (the hidden one is paused by its IntersectionObserver).

## 8. Rollout: files to touch

| Owner | File | Change |
|---|---|---|
| Foundation | `src/styles/base.css` | 3.1, 3.2, 3.3, 3.4; glitch keyframes (6.5); scanline and grain classes; reduced-motion rules |
| Foundation | `src/app/layout.tsx` | body `bg-background text-foreground`; add a `themeColor` viewport export of `#020605` |
| Foundation | `src/app/page.tsx` | mount the overlay component after `<Footer />` |
| Foundation | `src/components/ui/MagicCard.tsx` | `SURFACE` to `var(--card)`, fallback to `var(--putty)` |
| Foundation | `src/components/ui/SectionHeading.tsx` | use `GlitchTitle` for the h2 |
| Foundation | `src/components/ui/GlitchTitle.tsx` (new) | from `ThemeCFx` glitch logic |
| Foundation | `src/lib/og-card.tsx` | 3.14 |
| Foundation | `src/components/lab/contracts.ts` | `LED` palette (3.9) |
| B1 chrome | `src/styles/keys.css`, `src/styles/hero.css` (focus ring is in hero.css, owned by B2) | 3.5 |
| B1 chrome | `src/styles/sky.css` | drop star, satellite and shooting star rules; keep `sky-blink` only if still used |
| B1 chrome | `src/components/sky/SkyLayers.tsx`, `sky-data.ts` | replace with `DepthRain` (from `src/components/theme-preview/c/`, moved to `src/components/sky/`) plus `rain-engine.ts` and the tokens |
| B1 chrome | `src/components/sky/ClassicSky.tsx`, `RoomSky.tsx` | render `DepthRain` (sticky) and `DepthRain fixed`; keep `data-room-sky` on the room wrapper |
| B1 chrome | `src/components/chrome/ClassicShell.tsx` | backdrop stops (2.1) |
| B1 chrome | `src/components/chrome/Skyline.tsx`, `skyline-data.ts` | replace with `RackHorizon` |
| B1 chrome | `src/components/chrome/Header.tsx`, `MobileMenu.tsx`, `Footer.tsx` | 3.6, footer row in section 4 |
| B2 hero | `src/styles/hero.css`, `src/components/hero/LandingHero.tsx` | door glow and shadow (3.5); no filter once the still is regenerated |
| B3 room art | `src/components/lab/art/config.ts`, `objects/*.tsx`, `src/styles/lab-art.css` | 3.12 |
| B3 room art | `scripts/assets/room-still.mjs`, `public/room/room-still.webp` | regenerate (3.13) |
| B4 engine | `src/styles/lab.css`, `src/components/lab/LabHero.tsx`, `MusicCard.tsx` | 3.11 |
| B5 terminal | `src/components/lab/terminal/*.tsx` | 3.10 |
| B6 panels | `src/components/lab/panels/*.tsx`, `src/styles/panels.css`, `scripts/assets/panels.mjs`, `public/lab/poster.webp`, `public/lab/print.webp` | 3.12 panels, poster and print |
| B7 homelab | `src/lib/rack.tsx`, `src/components/lab/Box3D.tsx`, `src/components/sections/Homelab.tsx` | 3.7, 3.9 |
| B8 work | `src/components/sections/Projects.tsx`, `Websites.tsx`, `Experience.tsx`, `src/styles/work.css` | 3.7, 3.8 |
| B8 work | `scripts/assets/work.mjs`, `public/previews/**`, `public/sites/**` | regenerate the generated preview art (architecture diagrams, report cover) in the theme palette: card `#06120e` panels, emerald and teal strokes, cyan for one highlight, no navy or violet. Real screenshots stay untouched |
| B9 about | `src/components/sections/About.tsx`, `Lightbox.tsx`, `Contact.tsx` (and `Photography.tsx` if it stays) | 3.7 |
| Content | `src/content/experience.ts`, `src/content/about.ts` | badge and wall colors only if the owner wants theme colors instead of issuer or employer colors |
| Docs | `docs/BUILD-NOTES.md` | rename "night sky" to the rain stage, list the new files and the overlay |

After the rollout, delete `src/components/theme-preview/c/`, `src/app/dev/theme-c/` and the room tint filter.

## 9. How the preview differs from a rollout

* Overrides are scoped under `.theme-c` in `theme-c.css`. Tailwind arbitrary classes (`bg-[#0a0d19]`, `bg-[#080808]/85`, `to-[#0a0d19]`) are re-targeted with escaped class selectors, and two inline style surfaces (MagicCard, footer wrapper) need `!important`. A rollout edits the source values instead.
* `--color-putty` is a literal in `@theme inline`, so the preview re-targets `.text-putty`. The rollout makes it `var(--putty)`.
* The room still is recolored with an SVG filter (3.13), not regenerated. The generated project preview images get a softer version of the same filter (`#tc-preview-tint`, 55% map); the rollout regenerates them instead (section 8, B8).
* The rack diagram, LEDs, terminal and room are not recolored in the preview; their values are specified above.
* The preview shows Header, LandingHero, Projects, Homelab and Footer. Websites, Experience, About and Contact follow the same card, chip and accent rules.
* `section#hero` is a stub: the door flips to room view and the stub flips back.
* `/dev/theme-c/stage` shows the rain stage alone with keycaps, a glitching section heading and one card per accent, with no content imports. It stays usable while content files are mid-edit.
