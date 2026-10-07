# Theme A: Phosphor Rain

Rollout spec for theme direction A. It replaces the night sky and the warm putty and dusk palette with a restrained digital rain look: a pure black base, one phosphor green family, white-green lead glyphs with a soft glow, and a canvas of falling glyphs that stays strong in the margins and calm behind text.

Preview: `/dev/theme-a` (dev server only). Preview code: `src/components/theme-preview/a/` (`ThemeA.tsx`, `RainCanvas.tsx`, `rain.ts`, `RainFloor.tsx`, `tokens.ts`, `theme-a.css`) and `src/app/dev/theme-a/page.tsx`. The preview renders the real Header, LandingHero, Projects, Homelab and Footer inside a `.theme-a` wrapper. It approximates two things the rollout does properly: hard-coded colours are overridden with scoped attribute selectors (the rollout edits the sources), and the room still, the project previews and the tech icons are recoloured with an SVG gradient map (the rollout recolours the art and regenerates the bitmaps).

## 1. Principles

1. **Black is the canvas.** Every surface sits between `#000000` and `#030a06`. No navy, no violet, no warm greys.
2. **One family of light.** All colour is phosphor green at different energies: white-green leads, saturated phosphor, mid green, dim green. Section accents are members of that family, not new hues.
3. **Light comes from glyphs.** Glow is reserved for things that emit: lead glyphs, LEDs, lit keycaps, the display name halo, active nav. Static surfaces never glow.
4. **Rain lives in the margins.** The rain is a full-viewport layer behind the page, at low opacity, with a radial vignette that drops it to between an eighth and a third of its strength behind the content column. Text never competes with motion.
5. **Generic, not quoted.** The look is generic "digital rain": unmirrored half-width katakana, digits and operators. No film titles, logos, characters, quotes, colour-coded pills, or recognisable scenes anywhere, including the terminal and room text.
6. **One exception.** `--alert` (`#ff3d5a`) is the only non-green colour and is used only for denial and error semantics (blocked packets, the firewall burst and counter, a failed terminal command). It is never decorative.

## 2. Palette

| Name | Value | Role |
| --- | --- | --- |
| base | `#000000` | page base (top), room backdrop, RoomSky |
| base-2 | `#020403` | page base (bottom of the classic wrapper gradient) |
| footer | `#010302` | footer and rain floor near layer |
| card | `#030a06` | cards, panels, ticket, inspector panel |
| card-raised | `#06110b` | rails, list gutters, rack shelves, keycap top |
| deep | `#04140b` | haze, faint fills, dim surfaces in the room |
| dim | `#0a3d1f` | trail tails, scrollbar thumb, inactive marks, rack labels |
| mid | `#0fd168` | trail body, secondary accent, LED "emerald" |
| phosphor | `#00ff66` | lead halo, primary accent, LEDs, active states |
| soft | `#7dffb0` | soft text accent (replaces putty), keycap legends |
| pale | `#c4ffdb` | pale accent (beacon sections) |
| lead | `#eafff2` | lead glyphs, white text, lit legends |
| title | `#effff4` | display type (name, section titles) |
| foreground | `#d8f5e3` | body text default |
| glow | `rgb(0 255 102 / 0.35)` | standard halo; leads use `rgb(0 255 102 / 0.55)` |
| edge | `rgb(0 255 102 / 0.24)` | 1 px edge light on glass keycaps and cards |
| alert | `#ff3d5a` | denial and error only |

Contrast on `#000` (WCAG): lead 20.1:1, pale 18.7:1, soft 16.8:1, sodium 16.5:1, phosphor 15.5:1, dusk 12.8:1, mid 10.3:1, `#eafff2` at 60% (the `text-white/60` utilities) about 7.1:1, at 45% about 4.3:1. The 45% step is used only for small mono meta labels, as today (white at 45% on the current `#080808` is about the same); raise those to 50% if strict AA is required. Dim (`#0a3d1f`, 1.7:1) is decorative only; never use it for text.

## 3. Token map

### 3.1 `src/styles/base.css` `:root`

| Token | Current | Phosphor Rain |
| --- | --- | --- |
| `--background` | `#080808` | `#000000` |
| `--foreground` | `#f0f0f0` | `#d8f5e3` |
| `--signal` | `#3ecbff` | `#00ff66` (phosphor) |
| `--dusk` | `#a58bff` | `#2ee59d` (mint phosphor) |
| `--beacon` | `#ff5a87` | `#c4ffdb` (pale) |
| `--sodium` | `#ff9d3c` | `#8cff4a` (yellow-green phosphor) |
| `--putty` | `#e6d9b5` | `#7dffb0` (soft) |
| `--card` | `#0a0d19` | `#030a06` |
| `--footer` | `#05070d` | `#010302` |
| `--title` | `#f7f4ec` | `#effff4` |
| new `--lead` | | `#eafff2` |
| new `--phosphor` | | `#00ff66` |
| new `--phosphor-mid` | | `#0fd168` |
| new `--phosphor-dim` | | `#0a3d1f` |
| new `--deep` | | `#04140b` |
| new `--glow` | | `rgb(0 255 102 / 0.35)` |
| new `--edge` | | `rgb(0 255 102 / 0.24)` |
| new `--alert` | | `#ff3d5a` |

Section accents stay four tokens so `[data-sec]` plumbing, `text-sec`, `bg-sec/10`, `border-sec/40` and the ticket mixes keep working unchanged. They differ by energy and a small hue shift (phosphor 144 degrees, mint 155, pale 142 at high lightness, yellow-green 99), which is deliberate: sections read as one system, not four brands.

| Section | Accent | New value |
| --- | --- | --- |
| 01 Projects, 07 Contact | signal | `#00ff66` |
| 02 Homelab, 05 About | dusk | `#2ee59d` |
| 03 Websites, 06 Photography (if kept) | sodium | `#8cff4a` |
| 04 Experience | beacon | `#c4ffdb` |

### 3.2 `@theme inline` (base.css)

| Entry | Current | Phosphor Rain |
| --- | --- | --- |
| `--color-background` | `var(--background)` | unchanged |
| `--color-foreground` | `var(--foreground)` | unchanged |
| `--color-putty` | `#e6d9b5` (inlined) | `var(--putty)` so `text-putty`, `text-putty/70` and `group-hover:text-putty` follow the token |
| `--color-sec` | `var(--sec, #e6d9b5)` | `var(--sec, #7dffb0)` |
| `--color-signal`, `--color-dusk`, `--color-beacon`, `--color-sodium` | `var(--x)` | unchanged |
| new `--color-phosphor`, `--color-lead`, `--color-alert` | | `var(--phosphor)`, `var(--lead)`, `var(--alert)` |

Add a non-inline `@theme` block for two Tailwind palette entries the components use directly. Tailwind v4 emits `text-white/60` as `color-mix(in oklab, var(--color-white) 60%, transparent)`, so one override tints every white utility (text, borders, dividers, rails) with a hint of green without touching a single component:

```css
@theme {
  --color-white: #eafff2;
  --color-emerald-400: #00ff66;
}
```

The preview verifies this: it redefines both on `.theme-a`, and every `text-white/*`, `border-white/*`, `bg-white/[0.03]` and status dot follows.

### 3.3 Global rules in base.css

| Rule | Current | Phosphor Rain |
| --- | --- | --- |
| `::selection` | `#e6d9b54d` | `background: rgb(0 255 102 / 0.28); color: #fff` |
| `.sec-title` colour | `#f7f4ec` | `var(--title)` plus `text-shadow: 0 0 0.45em rgb(0 255 102 / 0.14)` |
| `.name-line` colour and shadow | `#f7f4ec`, `0.035em 0.045em #05070d` | `var(--title)`, `0 0 0.05em rgb(0 255 102 / 0.32), 0 0 0.5em rgb(0 255 102 / 0.14)` (the hard offset shadow is invisible on black, so the halo replaces it) |
| `.dot-grid` | `#ffffff1f` dots | `rgb(0 255 102 / 0.16)` dots |
| `html` | none | add `color-scheme: dark; scrollbar-color: #0a3d1f #000` |
| `src/app/layout.tsx` body classes | `bg-[#080808] text-[#f0f0f0]` | `bg-black text-[#d8f5e3]` (or drop them; `body` already reads the tokens) |

### 3.4 Hard-coded colour families

| Family | Where | Phosphor Rain |
| --- | --- | --- |
| Card navy `#0a0d19` | `MagicCard` `SURFACE`, `Projects` preview fade (`to-[#0a0d19]`), Homelab rack card and services list, callout bubble fill, `Websites` card, `.ticket` | `var(--card)` (`#030a06`); replace every literal with the token |
| Placeholder navy `#080b14` | `Projects` "screenshot coming soon" strip | `#010603` |
| Near-black `#080808` | header glass, mobile menu, `Lightbox` backdrop, `About` portrait fade, layout body | `#000` base; glass values in 3.6 |
| Footer navy `#05070d` | `Footer` wrapper, skyline near fill, `.name-line` shadow, OG card | `var(--footer)` (`#010302`) |
| Classic wrapper gradient | `ClassicShell` `BACKDROP` | `linear-gradient(180deg, #000 0%, #010201 55%, #020403 100%)` |
| Room sky gradient | `RoomSky` `bg-[linear-gradient(180deg,#06080f,#070a13)]` | `#000` flat |
| Putty `#e6d9b5` / `#e6d9b5xx` | hotspot fill and stroke (`lab.css`), hint markers, lab tooltip (`border-putty/25 text-putty`), music card label, OG prompt | soft `#7dffb0` for text; hotspots `fill: rgb(0 255 102 / 0.08); stroke: rgb(0 255 102 / 0.85)`, rack hover fill `rgb(0 255 102 / 0.03)`; markers: back `rgb(0 5 2 / 0.62)`, stroke `rgb(0 255 102 / 0.5)`, dot and ring `#00ff66` |
| Focus ring `#efe8d4b3` | `.key:focus-visible`, `.mini-room:focus-visible` | `rgb(0 255 102 / 0.75)` |
| Status green `emerald-400` | footer status dot, Websites "live" dot, Homelab service pulses | `#00ff66` via `--color-emerald-400`, plus `box-shadow: 0 0 6px rgb(0 255 102 / 0.8)` |
| Panel near-blacks `#0b0d0c`, `#0b0e0d`, `#0c0d0e` | music card, inspector panel, tooltip, frame mats in panels | `#030a06` panels, `#010302` frames; borders `rgb(0 255 102 / 0.12)` |
| Scrims `#030504`, `#050706` | room focus dim, `#hero` background, top fade | `#000` at the same alphas |

### 3.5 Keycaps (`src/styles/keys.css`)

Black glass with a green legend and a thin green edge light; the primary variant is the same glass lit from inside. Geometry, transitions and the press travel are unchanged.

| State | Property | Current | Phosphor Rain |
| --- | --- | --- | --- |
| `.key` | color | `#ffffffdb` | `rgb(125 255 176 / 0.92)` |
| | background | `linear-gradient(#2c3035, #1c1f23)` | `linear-gradient(180deg, #0d1711 0%, #060b08 52%, #030504 100%)` |
| | box-shadow | `inset 0 1px #ffffff1a, 0 3px #0a0b0d, 0 6px 14px #0000008c` | `inset 0 0 0 1px rgb(0 255 102 / 0.24), inset 0 1px 0 rgb(200 255 222 / 0.16), 0 3px 0 #010201, 0 3px 0 1px rgb(0 255 102 / 0.07), 0 6px 14px rgb(0 0 0 / 0.85), 0 0 18px -6px rgb(0 255 102 / 0.28)` |
| `.key:hover` | color | `#fff` | `#eafff2` plus `text-shadow: 0 0 8px rgb(0 255 102 / 0.6)` |
| | box-shadow | depth 4px, 8px 18px | edge `0.42`, depth `0 4px 0 #010201`, skirt `0.1`, `0 8px 18px rgb(0 0 0 / 0.85)`, glow `0 0 24px -4px rgb(0 255 102 / 0.38)` |
| `.key:active`, `[aria-pressed]` | box-shadow | depth 0 | edge `0.55`, `0 0 0 #010201`, `0 1px 3px rgb(0 0 0 / 0.8)`, glow `0 0 14px -4px rgb(0 255 102 / 0.5)` |
| `.key:focus-visible` | outline | `2px solid #efe8d4b3` | `2px solid rgb(0 255 102 / 0.75)` |
| `.key-light` | color | `#2a2620` | `#eafff2` plus `text-shadow: 0 0 7px rgb(0 255 102 / 0.55)` |
| | background | `linear-gradient(#efe8d4, #d4cab1)` | `linear-gradient(180deg, #11432a 0%, #0a2a1a 55%, #061b11 100%)` |
| | box-shadow | `inset 0 1px #fffc, 0 3px #9a8f77, 0 6px 14px #0000008c` | `inset 0 0 0 1px rgb(0 255 102 / 0.72), inset 0 1px 0 rgb(200 255 222 / 0.38), 0 3px 0 #02140a, 0 3px 0 1px rgb(0 255 102 / 0.14), 0 6px 14px rgb(0 0 0 / 0.85), 0 0 26px -6px rgb(0 255 102 / 0.6)` |
| `.key-light:hover` | color, shadow | `#1a1712`, depth 4px | `#fff`; edge `0.9`, highlight `0.45`, `0 4px 0 #02140a`, glow `0 0 34px -6px rgb(0 255 102 / 0.75)` |
| `.key-light:active` | box-shadow | depth 0 | edge `0.95`, `0 0 0 #02140a`, glow `0 0 20px -4px rgb(0 255 102 / 0.7)` |
| `.key-legend` | opacity | `0.5` | unchanged (inherits the green legend) |

The HUD keys, the "Enter as guest" key and the music card stop key inherit all of this. `.mini-room .key` (hero.css) keeps its transition and lift; only `.mini-room:focus-visible` changes its outline colour as above.

### 3.6 Header glass and menus (`Header.tsx`, `MobileMenu.tsx`)

| Element | Current | Phosphor Rain |
| --- | --- | --- |
| Scrolled header | `border-white/[0.06] bg-[#080808]/85 backdrop-blur-xl` | `bg-[rgb(0_5_2/0.8)] backdrop-blur-xl border-b border-[rgb(0_255_102/0.12)] shadow-[0_18px_40px_-30px_rgb(0_255_102/0.45)]` |
| Nav link idle and hover | `text-white/60 hover:text-white` | unchanged classes (tinted through `--color-white`) |
| Nav link active | `text-white` | `text-phosphor [text-shadow:0_0_12px_rgb(0_255_102/0.55)]` |
| Mobile menu panel | `border-white/[0.06] bg-[#080808]/95` | `border-[rgb(0_255_102/0.1)] bg-[rgb(0_5_2/0.95)]` |
| Mobile active link | `text-putty` | unchanged class (follows the putty token) |
| Burger | `border-white/10 text-white/70` | unchanged |

### 3.7 Chips, cards, spotlight, ticket

| Item | Current | Phosphor Rain |
| --- | --- | --- |
| Tech chip (icon) | `bg-white/[0.04] text-white/75 border-white/10` | unchanged classes |
| Accent chip, hardening chip | `bg-sec/10 text-sec border-sec/20` (`/25`) | unchanged classes |
| Card border at rest | `border-white/10` | `border-[rgb(0_255_102/0.11)]` on MagicCard, Homelab cards, Websites cards |
| MagicCard hover border | `border-sec/40` | `border-sec/45` plus `shadow-[0_0_30px_-12px_color-mix(in_oklab,var(--sec)_60%,transparent)]` |
| MagicCard spotlight | 350 px, `--sec` at 10% over `#0a0d19` | 350 px, `--sec` at 10% over `var(--card)` (same code, new surface) |
| Ticket body | `#0a0d19`, border `#ffffff1a` | `var(--card)`, border `rgb(0 255 102 / 0.11)` |
| Ticket stub tint | `--sec` 9%, dashed tear `--sec` 55% | `--sec` 7%, dashed tear `--sec` 45% (green tints read stronger on black) |
| Ticket barcode | `#fff` at 0.4 | `var(--lead)` at 0.35 |
| Projects preview fade | `to-[#0a0d19]` | `to-[var(--card)]` |

### 3.8 Rack and LED palette

`LED` in `src/components/lab/contracts.ts` drives the room LEDs, glows and floor pools, the section diagram and the inspector models, so one table recolours all of them.

| `LedColor` | Current | Phosphor Rain | Meaning |
| --- | --- | --- | --- |
| green | `#4ade80` | `#00ff66` | link and port activity |
| emerald | `#34d399` | `#0fd168` | secondary activity |
| cyan | `#22d3ee` | `#66ffcc` | WAN cable, inbound packets |
| blue | `#60a5fa` | `#39d98a` | storage activity, room fill pool |
| amber | `#fbbf24` | `#c6ff5e` | disk activity, desk cable |
| red | `#fb7185` | `#ff3d5a` (alert) | blocked traffic only |
| white | `#f1f5f9` | `#eafff2` | power, picture lights |
| warm | `#fdba74` | `#b9f5c8` | lamp, wall wash |

Rack faces (`src/lib/rack.tsx`, `src/components/lab/Box3D.tsx`, `src/components/lab/art/objects/Rack.tsx`). The owner's rack is a black 12U 10-inch rack, so the light grey frame goes away:

| Part | Current | Phosphor Rain |
| --- | --- | --- |
| Frame posts and bottom band `FRAME` | `#d6dadd` | `#101914` |
| Top band | `#e2e5e7` | `#101914` with a 0.6 px `rgb(0 255 102 / 0.18)` top edge |
| Wordmark and U numbers | `#111`, `#8a9196`, holes `#7d8489` | `#0fd168` text, `#0a3d1f` holes |
| Device bodies (switch `#262a2e`, PC `#121417`, blank `#0e1012`, SSD `#6a6f74`) | as listed | switch `#0c140f`, PC and blank `#070c09`, SSD `#1a241e` (keep the relative steps, drop the blue cast) |
| Ports and vents `#050607`, `#060708` | | `#000` |
| Light metal faces (`#a2a8ae`, `#aeb3b9`, `#b7bcc1`, `#b9bec4`, `#8d9399`) | brushed aluminium | `#1d2b23` |
| USB port inserts `#1d4ed8`, `#2563eb` | blue | `#0f5a30` |
| Gold accents `#c8a24a` | gold | `#c6ff5e` |
| Carry handles `#2a2e33` with a white 0.18 highlight | grey | `#101914` with a `rgb(0 255 102 / 0.18)` highlight |
| Patch cords `CORD` `#eef1f3` | white | `#0fd168` at 0.85 (cords become lit fibre) |
| Plinth label `#eeece4` with `#111` text | | `#0a3d1f` label, `#00ff66` text |
| Model strip `#b91c1c` | red | `#0fd168` (no off-family colour on hardware) |
| PDU rocker `#fb923c` | orange | `#c6ff5e` |
| Rack glass `rgba(175,205,220,0.09)` | blue glass | `rgb(0 255 102 / 0.05)` |
| Homelab section plinth `#14171a` | | `#050a07` |
| Callout lines, dots, bubbles | `stroke-sec`, bubble `#0a0d19` | unchanged classes, bubble `var(--card)` |

### 3.9 Terminal and intro (`src/components/lab/terminal/*`, `IntroControls`, `HudKeys`)

| Item | Current | Phosphor Rain |
| --- | --- | --- |
| Console text | `#cfcfcf` | `#b8f5cc` |
| Strong text (`text-white`, `text-white/85`) | white | unchanged classes (tinted) |
| Dim text, headers (`#8a8a8a`) | grey | `#3f9a62` |
| Service and OK marks (`#7bd88f`, `#5fd07a`) | greens | `#00ff66` with `text-shadow: 0 0 6px rgb(0 255 102 / 0.5)` |
| Error line (`#ff8a8a`) | pink | `var(--alert)` |
| Caret (`border-[#e8e8e8]` underline) | grey underline | `#00ff66` block caret, 0.6 em wide, same `lab-caret` 1.05 s steps(1) |
| Scrollbar | `rgba(255,255,255,0.18)` | `rgb(0 255 102 / 0.25)` |
| Console surface, borders | near-black, `border-white/10` | `#000` at 0.92 with `border-[rgb(0_255_102/0.14)]` |
| Intro back and skip links | `text-white/40` | unchanged classes |
| Landing prompt | `text-putty` user@host | unchanged class, plus a phosphor block caret after the command (`::after`, `lab-caret`, static under reduced motion) |

Terminal copy needs a pass for theme-neutral wording only if a line could read as a film reference (none do today). Do not add any.

### 3.10 Room scene palette (`src/components/lab/art/**`)

The room keeps its geometry, hotspots, timing and light layering. It is repainted as a dark room lit only by screens, LEDs and a green window. Material tones (`TONES` in `config.ts`) map to a green-black ramp that keeps each tone's relative lightness (top lightest, right darkest).

| Tone | Current top / left / right | Phosphor Rain top / left / right |
| --- | --- | --- |
| `wallA` | `#30363c` / `#1a1e22` / `#262b31` | `#0d1611` / `#070c09` / `#0a120d` |
| `wallB` | `#30363c` / `#262b31` / `#15181c` | `#0d1611` / `#0a120d` / `#050906` |
| `slab` | `#1a1511` / `#2a221b` / `#211a14` | `#050806` / `#0a100c` / `#070b08` |
| `wood` | `#2a2119` / `#1b1510` / `#140f0b` | `#0f1712` / `#09100b` / `#060a07` |
| `recordWood`, `plinth`, `pot` | browns | same ramp as `wood`, one step lighter for `recordWood` |
| `chassis` | `#1c232a` / `#12181e` / `#0c1014` | `#0e1712` / `#08100b` / `#050a07` |
| `metal` | `#3b444d` / `#272e35` / `#1c2127` | `#1a2a20` / `#111c15` / `#0c140f` |
| `plastic`, `fabric`, `camBody`, `camDial`, `phone`, `spotBracket`, `spotHead`, `sill`, `rackCab` | dark greys | the `chassis` ramp (`camDial`, `sill` use `metal`) |
| `putty`, `puttyDark` (CRT shell, keyboard) | `#a39b86` family | `#1d2b23` / `#16221b` / `#101912` and one step darker; the beige computer becomes a dark green-grey shell so the screen is the brightest object |

Other room colours:

| Element | Current | Phosphor Rain |
| --- | --- | --- |
| Floor planks | `#1a1511`, alternate `#1d1813`, seams `#0f0c09` | `#040705`, alternate `#060a07`, seams `#000` |
| Rug | `#1b1a2c`, borders `#3a3656`, `#2a2740` | `#030a06`, borders `#0a3d1f`, `#072613` |
| `RIM` mint edges | `rgba(160,255,230,0.08 / 0.15)` | `rgb(0 255 102 / 0.07)` sides, `0.14` tops |
| Baseboard | `#0e1113` | `#030504` |
| Wall wash and LED strip | `LED.warm` at 0.05 / 0.55 | phosphor at 0.04 / 0.45 (a green floor-line strip) |
| Lamp shade, mouth glow | `#3b3127`, `#4a3e31`, `#fde2b8`, glow warm | shade `#0f1712` / `#16221b`, mouth `#eafff2` at 0.5, glow `lab-glow-warm` (now pale green) |
| Picture lights | white glow 0.28, fixture `#2b2f33` | `lab-glow-white` (now white-green) 0.22, fixture `#0e1712` |
| Spot beam `#e6f0ff` 0.3 to 0.02 | cool white | `#b9ffd4` at 0.22 to 0.015 |
| Floor halo `lab-halo` `#12302b` | hidden | unchanged (hidden) |
| Pools (warm r95, blue r120, amber r95, cyan r105) | per `LED` | follow the new `LED` map; reduce pool stop opacity 0.16 to 0.12 so the floor stays black |
| Lens gradient `#3b4a6b` to `#05070b` | blue glass | `#1a3a28` to `#000` |
| Packets (`PACKET_CORE` `#ecfdf5`) | white cores | `#eafff2` cores with phosphor halos; blocked packet and `data-fw-alert` burst stay `--alert`; alert box `rgba(20,6,8,0.92)` becomes `rgb(12 2 5 / 0.92)` with `#ffb3c0` text |
| Cable jackets `#0c1211`, sheen | | `#020604`, sheen `rgb(0 255 102 / 0.07)` |
| Hotspots, markers, tooltip | putty | see 3.4 (putty row) |

Window content (`WindowView.tsx`): the night skyline becomes **rain seen through the glass**. Replace the sky gradient (`#080c1a` to `#3a2a44`), stars, moon, the two building rows and the four towers with: a `#000` to `#020a05` fill; 12 to 14 vertical glyph columns (window-local x every 7 units, 3.2 unit glyphs, seeded) drawn in dim green with the bottom 40% of each column fading out; the lit layer (`WindowLights`) adds one lead glyph per column in `#eafff2` with the `lab-glow-white` halo and replaces the 23 lit windows. Six columns (index % 4 === 0) step their lead glyph down one cell every 0.9 s using the existing `lab-led-pulse` timing slots (CSS only, no new loop). Mullions `#0b0d0f` become `#0a120d`. Under reduced motion the columns are static.

CRT (`Desk.tsx`, `DeskItems.tsx`, `CrtPanel.tsx`): `PHOSPHOR` `#ffb347` and `PHOSPHOR_DIM` amber become `#00ff66` and `rgb(0 255 102 / 0.45)`; screen background `#0b0904` / `#1a0f03` becomes `#010603`; `crtGlow` becomes phosphor at 0.16; the bezel follows the new `putty` tone; badge text `#4a4538` becomes `#0a3d1f`. The CRT panel keeps its layout: frame gradient `#ddd4bd` to `#b9ae95` becomes `#1d2b23` to `#0e1712`, screen `#130b02` becomes `#010603`, text `#ffb347` / `#ffcf8a` become `#00ff66` / `#b8f5cc`, selection inverse `bg-[#00ff66] text-[#010603]`, scanlines unchanged.

Poster and print art direction (`WallArt.tsx`, `scripts/assets/panels.mjs`): no new subjects. The poster keeps an original illustration but is re-rendered as a two-tone phosphor print (black, `#0a3d1f`, `#0fd168`, `#eafff2` highlights). The framed print uses the same gradient map as the preview's room still (luminance to black, deep green, phosphor, mint, white-green, 17 stops in `ThemeA.tsx`) instead of the warm umber map. Frame mats `#ecebe7` / `#e9e6de` become `#d9eadf` (pale mint paper) so frames still read as paper under green light. The SVG fallbacks `lab-print-warm` and `lab-poster-sea` become dim-to-mid green ramps.

Certificates (wall and panel): keep paper `#e9e6de` as `#dfeee4`, seal and wordmark colours come from content; render them through `--phosphor-mid` when the content colour is not set.

Desk props (rubber band ball, record sleeve and label, book spines, plant, camera, chair): multi-colour props take a four-step green ramp keyed by each source colour's luminance (`#04140b`, `#0a3d1f`, `#0fd168`, `#7dffb0`). The plant leaves stay green (`#0a3d1f` to `#0fd168` steps). The record label `#c2c6cb` becomes `#d9eadf`.

`public/room/room-still.webp` must be re-rendered (`node scripts/assets/room-still.mjs`) after the art changes. The preview approximates the result with an SVG gradient map on the image (`filter: url(#ta-phosphor)`); the real rollout recolours the art so LEDs stay crisp and the window shows rain.

### 3.11 Room panels (`src/components/lab/panels/**`), briefly

Panel frames `#0c0d0e` become `#010302`; `PANEL_SHADOW` stays black; map panel `#0f1a24`, nodes `#132231` / `#2c4257`, link `#5b7690` become `#010603`, `#06110b` / `#0a3d1f`, `#0fd168`; phone panel gradient `#1b2a44` to `#0b1020` becomes `#06110b` to `#000`; badge panel keeps its light card (an ID badge is paper) with the barcode in `#04140b`; camera panel body gradient follows the `chassis` ramp, its status LED is phosphor, and its blue follow button `#0095f6` becomes a `.key-light`.

### 3.12 OG and Twitter images (`src/lib/og-card.tsx`)

Background becomes `#000` with a static rain field (seeded columns of glyphs, same tiers as the canvas) at 0.5 opacity behind the title, prompt user in `#7dffb0`, name in `#effff4`, no moon, no violet horizon; the skyline row becomes the rain floor towers in `#010302`. Update the alt text to drop "starry night sky".

### 3.13 Section art and icons

* Project previews (`public/previews/*.png`, generated by `scripts/assets/work.mjs`): regenerate in the theme palette (black cards, `#0a3d1f` hairlines, `#0fd168` labels, `#eafff2` headings) instead of navy. If a preview is ever a real screenshot, show it through the gradient map at rest; the preview applies the map to every preview image to show the result.
* Tech chip icons (Devicon artwork): render through the same gradient map so a multi-colour mark does not break the one-family rule. The preview does this with `filter: url(#ta-phosphor)`. The mark itself is not redrawn or altered.
* Website screenshots (`public/sites/*.webp`) and photography: keep true colour, since they are the owner's work product; frame them with `var(--card)` and `rgb(0 255 102 / 0.11)` borders.

## 4. What replaces each sky element

| Current element | Phosphor Rain replacement |
| --- | --- |
| Three tiled star fields (`STAR_TILES`, `.par-wrap`) | The canvas rain (one fixed full-viewport canvas). No tiles. |
| Milky way band | Phosphor haze: `radial-gradient(90% 55% at 50% -12%, rgb(0 255 102 / 0.07), transparent 62%)` plus a bottom `rgb(15 209 104 / 0.05)` bloom, fixed. |
| Twelve twinkling stars (`.sky-twinkle`) | Glints: single cells that flash to the lead tier and fade (0.6 to 1.3 s sine, about 0.5 per second per 1000 cells), drawn by the canvas. |
| Two constellations (Ursa Major, Cassiopeia) and their labels | Removed. No replacement text; the margins belong to the rain. |
| Moon | Removed. The top haze provides the light source. |
| Two drifting satellites | Removed. |
| Two shooting stars | Surges: every 6 to 12 s one idle drop near the left or right edge falls at 2.1 times the top speed with a 1.7 times longer trail and a full-strength lead. |
| `RoomSky` (fixed, room view) | The same `RainCanvas`, mounted once in the room layer at `--rain-opacity: 0.45` behind the room. Both views share one engine. |
| Skyline divider (`Skyline.tsx`) | Rain floor (`RainFloor.tsx` in the preview): the same box (`h-32 md:h-44`), two `.par-x` layers (`--d` 7 and 17), towers as black blocks whose windows are seeded dim glyphs, a lit lead glyph on some roofs, a blinking phosphor beacon on the tallest tower (same 2.2 s blink curve), a green horizon glow and a 1 px phosphor horizon line on the footer edge. The near fill equals `--footer`. |
| Footer | `--footer` (`#010302`) background, `rgb(0 255 102 / 0.1)` top border, glyph icons hover to soft green, status dot phosphor. |

## 5. Typography

No family changes. Archivo (condensed display, `wdth` axis), Geist and Geist Mono stay, so the name lockup, `fontStretch` tuning and every measured layout carry over.

* Display name: `--title` (`#effff4`) with a two-layer halo (`0 0 0.05em` at 0.32, `0 0 0.5em` at 0.14). The `name-in` entrance is unchanged.
* Section titles: `--title` with a single 0.45 em halo at 0.14.
* Eyebrows, labels, chips: unchanged sizes and tracking; colour from `--sec`.
* Body copy: unchanged classes; `--color-white` gives it the green-white cast.
* Rain glyphs (canvas, rain floor, window rain, OG card) use the platform Japanese UI font for every glyph, digits included, so all strokes share one weight: `"MS Gothic", "Yu Gothic", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans Mono CJK JP", "Noto Sans JP", "Osaka", monospace`. Mixing Geist Mono digits into the katakana was tested and rejected: the digits read heavier and larger than the katakana. No web font is added for the rain.

## 6. Motion

### 6.1 Rain parameters

| Parameter | Desktop (768 px and up) | Mobile (below 768 px) |
| --- | --- | --- |
| Glyph size | 17 px | 15 px |
| Cell (column x row pitch) | 16 x 20 px | 14 x 18 px |
| Drop slots per column | 2 | 2 |
| Density (share of slots falling) | 0.34 | 0.28 |
| Fall speed | 7 to 17 rows/s, times `0.6 + 0.4 * depth` | 6 to 15 rows/s, same scaling |
| Trail length | 9 to 26 rows, times `0.75 + 0.25 * depth` | 8 to 22 rows |
| Depth per drop | `0.38 + 0.62 * r^0.8` (alpha and speed) | same |
| Redraw cap | 30 fps | 30 fps |
| Glyph mutation | 0.035 swaps per cell per second | same |
| Glints | 0.5 per second per 1000 cells, max 16 live | 0.4 |
| Surges | every 6 to 12 s | every 7 to 14 s |
| Canvas opacity | 0.62 | 0.5 |
| Calm-centre mask | `radial-gradient(ellipse 58% 62% at 50% 52%, alpha 0.12 at the centre, 0.3 at 55%, 1 at the edge)` | `ellipse 70% 48% at 50% 50%`, 0.2 at the centre, 0.4 at 60%, 1 at the edge |
| Header fade mask | alpha 0.25 at the top to 1 at 9 rem | 7 rem |

Glyph set: the 56 half-width katakana from U+FF66 to U+FF9D, digits 0 to 9, and `: . = * + - < > |`. Glyphs are drawn unmirrored.

### 6.2 Trail and lead behaviour

* Drops fall in whole cells: the head enters a new row and writes a fresh random glyph there, so the trail shows what the head drew.
* Tiers by distance from the head: row 0 lead (`#eafff2` with a two-pass glow, alpha `0.55 + 0.45 * depth`), rows 1 and 2 bright (`#00ff66`, small glow), then mid (`#0fd168`) to 60% of the trail, then dim (`#0a3d1f`) to the tail. Alpha falls along the trail with `(1 - t)^0.9`, the dim tier is boosted 2.2 times so tails stay visible.
* The lead flickers: about one frame in four shows a random glyph in place of its own.
* Idle gaps are sized so that, on average, `density` of all slots are falling; a finished drop respawns above the viewport after a random gap.

### 6.3 Reduced motion

Under `prefers-reduced-motion: reduce` the canvas draws one static glyph field (the initial drop distribution, frozen, no glints, no flicker) and never starts a loop. The media query is watched, so changing the OS setting switches modes live. The rain floor beacon and the prompt caret stop blinking. All existing reduced-motion rules (parallax off, door tilt and float off, LED blinks off) are unchanged.

### 6.4 Interplay with the existing motion system

* SkyMotion keeps driving `--px`, `--py`, `--sy`: the door tilt and float, the rain floor `.par-x` layers and the hero parallax are unchanged. The canvas itself does not parallax (it is the fixed backdrop).
* `BlurFade`, `name-in`, the keycap press, MagicCard spotlight, LED blinks, the intro timing and every room tween are unchanged.

## 7. Performance

* One canvas, fixed, sized in CSS (`100%` x `100lvh`), so it never affects layout and the mobile URL bar does not resize it. A `ResizeObserver` rebuilds the grid only when its CSS size changes.
* Device pixel ratio capped at 2. At 1440 x 900 and DPR 2 the grid is 90 columns x 45 rows.
* All glyphs are rasterised once per tier into an atlas canvas (75 glyphs x 4 tiers); a frame is one `clearRect` plus 1:1 `drawImage` copies with `globalAlpha`. No `fillText` or `shadowBlur` in the frame loop.
* Measured on the preview (dev build, headless Chrome, 5 s windows): about 27 to 28 drawn frames per second; 1440 x 900 averages 770 to 870 blits per frame at a median of 0.5 to 0.6 ms of script per frame (p95 0.8 ms, max 1.0 ms); 390 x 844 averages about 200 blits at 0.2 ms (p95 0.3 ms). Raster and composite time is extra and depends on the GPU; headless software rendering added roughly 90 to 175 ms of main-thread task time per second, which a GPU-composited browser should mostly move off the main thread.
* Drop and grid state live in typed arrays; no allocation per frame.
* `requestAnimationFrame` with a 30 fps cap. The loop stops on `visibilitychange` (hidden) and restarts with a fresh clock on return, so there is no catch-up burst.
* Under reduced motion there is no loop at all.
* Do not place `backdrop-filter` over the canvas except the header (64 px tall, and the rain is masked to 25% there). Cards are opaque `--card`, never blurred glass, so the GPU never re-blurs a moving layer per card.
* The room view should stop the rain while a focus panel is open (`html[data-lab-focus]`, the 80% scrim hides it) and while the rack inspector is open; resume on close. The engine exposes `start` and `stop` for this.
* The atlas uses system fonts only, so it is built synchronously on the first resize and never waits for a web font.

## 8. Files the rollout touches

| File | Change |
| --- | --- |
| `src/styles/base.css` | `:root` tokens (3.1), `@theme` entries (3.2), selection, titles, name line, dot grid, `html` colour scheme (3.3) |
| `src/app/layout.tsx` | body background and text classes |
| `src/styles/keys.css` | keycap system (3.5) |
| `src/styles/sky.css` | remove star, satellite and shooting star rules; add rain canvas, haze, floor and beacon rules (from the preview's `theme-a.css`) |
| `src/styles/chrome.css` | header glass and active nav glow if not done in classes |
| `src/styles/hero.css` | `.mini-room:focus-visible` outline |
| `src/styles/lab.css` | hotspot, marker and tooltip colours |
| `src/styles/work.css` | ticket body, border, stub mix, barcode |
| `src/styles/lab-art.css` | none required (music notes inherit) |
| `src/styles/panels.css` | preview backdrop gradient |
| `src/components/sky/SkyLayers.tsx`, `sky-data.ts` | replaced by the rain (delete or reduce to a re-export) |
| `src/components/sky/ClassicSky.tsx`, `RoomSky.tsx` | render the haze and `RainCanvas` (one engine per view; the room instance at 0.45 opacity) |
| new `src/components/sky/RainCanvas.tsx`, `src/components/sky/rain.ts`, `src/components/sky/rain-tokens.ts` | promoted from the preview |
| `src/components/chrome/ClassicShell.tsx` | `BACKDROP` gradient |
| `src/components/chrome/Skyline.tsx`, `skyline-data.ts` | replaced by the rain floor (promote `RainFloor.tsx`) |
| `src/components/chrome/Header.tsx`, `MobileMenu.tsx` | glass, border, active link (3.6) |
| `src/components/chrome/Footer.tsx` | wrapper background token |
| `src/components/ui/MagicCard.tsx` | `SURFACE` to `var(--card)`, rest border, hover glow |
| `src/components/ui/Led.tsx` | none (reads `LED`) |
| `src/components/lab/contracts.ts` | `LED` map (3.8) |
| `src/components/sections/Projects.tsx` | preview fade and placeholder colours |
| `src/components/sections/Homelab.tsx` | card surfaces, plinth, callout bubble fill |
| `src/components/sections/Websites.tsx`, `Experience.tsx`, `About.tsx`, `Contact.tsx`, `Lightbox.tsx`, `ExpandableGallery.tsx` | literal `#0a0d19`, `#080808`, warm photo-light gradients to tokens |
| `src/lib/rack.tsx`, `src/components/lab/Box3D.tsx`, `src/components/lab/RackInspector.tsx` | rack and device colours (3.8), inspector panel and stage glow |
| `src/components/lab/art/config.ts` | `TONES`, `RIM`, `PUTTY`, `TAG_TEXT`, `PHOSPHOR`, `PHOSPHOR_DIM`, `PACKET_CORE`, `FRAME` |
| `src/components/lab/art/objects/*.tsx` | Defs gradients, Shell (floor, rug, wash), Lamp, WindowView (rain), WallArt (frames, fallbacks), Desk and DeskItems (CRT, props), Rack, Record, Plant, Chair, Camera, Cables (3.10) |
| `src/components/lab/LabHero.tsx`, `FocusLayer.tsx`, `MusicCard.tsx`, `HudKeys.tsx`, `IntroControls.tsx` | scrims, tooltip, music card surface |
| `src/components/lab/terminal/Terminal.tsx`, `lines.tsx`, `commands.tsx` | terminal colours (3.9) |
| `src/components/lab/panels/*.tsx` | panel colours (3.11) |
| `src/lib/og-card.tsx`, `src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx` | rain title card and alt text (3.12) |
| `scripts/assets/panels.mjs` | print gradient map, poster re-render |
| `scripts/assets/work.mjs`, `public/previews/*.png` | project preview art in the theme palette (3.13) |
| `public/room/room-still.webp`, `public/lab/print.webp`, `public/lab/poster.webp` | regenerated |
| `docs/BUILD-NOTES.md` | theme section, sky and skyline replaced, new files |

Order: tokens and `@theme` (one commit, most of the site flips), keycaps and chrome, rain canvas and floor replacing the sky and skyline, sections, room art and the still, terminal and panels, OG images.

## 9. Open decisions

* Accent distinctness: sections are told apart by energy and a small hue shift only. If stronger section identity is wanted, the fallback is to vary the eyebrow treatment (for example a lit lead glyph before the index) rather than adding hues.
* The single alert colour. A pure monochrome alternative renders denials as inverse video (`#000` on `#00ff66`) instead of red.
* Rain strength on the room view behind the isometric scene (0.45 proposed) should be checked against the intro terminal for legibility.
