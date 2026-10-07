# 02. Global chrome, night sky, and platform setup

Area key: `chrome`. Covers the fixed header and mobile menu, the keyboard-key button system, the parallax night sky (room and classic variants), the skyline divider and footer, global CSS, shared section patterns, and the Next.js platform setup (fonts, metadata, images, libraries).

All values below were read from the production stylesheet, the RSC payload of the prerendered page, the client bundle, and verified with headless Chrome `getComputedStyle` probes at 1440x900 and 390x844 unless marked otherwise.

---

## 1. Overview

The site is a single long page that sits inside a dark, quiet night sky. A thin fixed header floats over everything: a square "keycap" monogram on the left, plain text section links in the middle, and a cream keycap "Resume" button on the right. Buttons across the site are styled as physical mechanical keyboard keys with a visible bottom edge that depresses 3px when pressed.

Behind the content, a sticky sky fills the viewport: three tiled star fields at different depths, a diagonal milky way band, twelve twinkling stars, two line-drawn constellations, a softly glowing moon, two tiny satellites drifting across over minutes, and two rare shooting stars. Every layer drifts a few pixels opposite to the mouse (eased with a 160ms time constant) and slides up at its own fraction of the scroll speed, so the sky reads as deep and alive but never busy. As the page scrolls, the backdrop gradient slowly warms from deep navy to dusky purple, and the page ends on a two-layer city skyline silhouette with lit windows and a blinking antenna light that merges into an opaque footer.

Sections have no backgrounds of their own; they are separated only by 6% white hairlines, and each opens with a small colored mono eyebrow ("01.WORK") above a huge condensed uppercase Archivo title. Each section has an accent color (signal blue, dusk violet, sodium orange, beacon pink) injected through a `--sec` CSS variable.

---

## 2. Structure

### 2.1 Document tree (server vs client)

```
html[lang=en][data-view="classic"]  .{geist var} .{geist-mono var} .{archivo var} .h-full .antialiased  (suppressHydrationWarning)
  body.min-h-full.bg-[#080808].text-[#f0f0f0]
    script (inline, layout)   legacy boot flag, see 5.6
    noscript > style "#boot-intro{display:none}"   (legacy, no #boot-intro element exists)
    script (inline, page)     room-intro decision, see 5.6
    <Nav/>                    CLIENT  -> header (fixed)
    main
      div[data-room-sky][data-sky-vars][aria-hidden]  ROOM SKY (fixed, visible only in room view)
      <LabHero/>              CLIENT  -> section#hero (room experience; other spec)
      div.relative.z-10.overflow-clip   CLASSIC WRAPPER (gradient backdrop)
        <SkyMotion/>          CLIENT  (renders null; drives CSS vars)
        div.pointer-events-none.absolute.inset-0[aria-hidden]
          div[data-sky-vars].sticky.top-0.h-lvh.overflow-hidden   CLASSIC SKY (layers 1 to 12)
        div.relative          landing hero section + all 7 sections (other specs)
        div[data-sky-vars][aria-hidden].pointer-events-none.relative.h-32.md:h-44   SKYLINE DIVIDER
    div[data-classic].relative.z-10 (style background #05070d)
      footer
```

Client component references in the RSC payload (everything else is a Server Component and arrives as static HTML): `Nav`, `LabHero`, `SkyMotion`, `HeroRoom`, `BlurFade`, `MagicCard`, `Image` (next/image), lucide `Icon` base, `Homelab`, `ExpandableGallery`, plus Next internals.

Paint order: inside `main`, the room sky is `position: fixed` with `z-index: auto`; the classic wrapper and the footer wrapper are `relative z-10`. The classic sky container is `absolute inset-0` and the content `div.relative` comes after it in DOM order, so content paints above the sky without any z-index.

Critical: the classic wrapper uses `overflow: clip` (Tailwind `overflow-clip`), not `overflow: hidden`. `clip` does not create a scroll container, so the inner `position: sticky` sky keeps working. Using `overflow-hidden` here breaks the sticky sky.

### 2.2 Header (`Nav`, client)

```
header  .fixed.top-0.left-0.right-0.z-50.transition-all.duration-300  + state classes (see 3.3)
  nav.max-w-6xl.mx-auto.px-6.h-16.flex.items-center.justify-between.gap-4
    a[href="#hero"][aria-label="<Owner name>, back to top"].key.key-sm.key-icon.text-[12px].font-bold.tracking-tight   "YG" monogram
    ul.hidden.items-center.gap-7.{lg:flex | sm:flex before hydration}
      li > a[href="#<id>"].text-sm.transition-colors.duration-200.{text-white/60 hover:text-white | text-white}
      (7 items)
    div.flex.items-center.gap-3
      a[href="/resume.pdf"][target=_blank][rel="noopener noreferrer"].key.key-sm.key-light.hidden.sm:inline-flex   "Resume ↗"
      button[type=button][aria-label="Open menu"|"Close menu"][aria-expanded].inline-flex.items-center.justify-center.w-9.h-9.rounded-lg.border.border-white/10.text-white/70.hover:text-white.transition-colors.{lg:hidden | sm:hidden before hydration}
        lucide Menu (size 17) | lucide X (size 17)
  (when open) div.border-t.border-white/[0.06].bg-[#080808]/95.backdrop-blur-xl.px-6.py-4.{lg:hidden}
    ul.space-y-1
      li > a.block.py-2.5.text-[15px].transition-colors.{text-white/70 hover:text-white | text-putty}   (7 items)
      li.pt-2.sm:hidden > a.key.key-sm.key-light "Resume ↗"
```

Measured at 1440: nav box x 144 to 1296 (1152 wide), 64px tall. YG key 36x36 at x 168, y 14. Link list 578px wide, starts x 405.7, links 14px/20px. Resume key 86.4x36 at x 1185.6. Measured at 390: menu button 36x36 at x 330, y 14; open panel is 402.5px tall (header becomes 467.5px).

Breakpoint behavior of the link list and burger is decided by `useView()` (see 5.1): before hydration the server snapshot is `null`, so the classes are `sm:flex` / `sm:hidden`; after hydration they become `lg:flex` / `lg:hidden` in both views. Verified after hydration: 640, 768, 1023 show burger + Resume; 1024 shows links + Resume, no burger.

### 2.3 Classic sky (server-rendered, inside the classic wrapper)

The sticky container is the element that carries `data-sky-vars`, so `--px`, `--py`, `--sy` cascade to all layers. Layers in DOM order (back to front):

| # | Element | Classes / position | Parallax `--d` | Scroll `--s` | Content |
|---|---|---|---|---|---|
| 0 | wrapper backdrop | on classic wrapper: `linear-gradient(180deg, #06080f 0%, #080b16 30%, #0b0f1d 65%, #121129 88%, #1c1530 100%)` over the full wrapper height (9674px at 1440, 14475px at 390) | none | scrolls with page | navy to dusk purple |
| 1 | star tile A | `div.par-wrap.absolute.-inset-x-10.-top-10`, `height: calc(100lvh + 560px + 5rem)`, `background-size: 560px 560px`, `--wrap: 560px` | 6 | 0.02 | 44 pin-prick stars |
| 2 | star tile B | same, `calc(100lvh + 760px + 5rem)`, 760px tile, `--wrap: 760px` | 13 | 0.045 | 30 stars |
| 3 | star tile C | same, `calc(100lvh + 900px + 5rem)`, 900px tile, `--wrap: 900px` | 22 | 0.08 | 14 brighter stars |
| 4 | milky way | `div.par.absolute.-inset-10.opacity-70`, 70 stars on a 700x600 tile + full-size band gradient, masked | 9 | 0 | diagonal band |
| 5 | twinkle stars | `div.par-wrap.absolute.inset-x-0.top-0.h-[200lvh]`, `--wrap: 100lvh`; two children `div.absolute.inset-x-0.h-lvh` at `top: 0lvh` and `top: 100lvh`, each holding the same 12 spans | 18 | 0.065 | 12 twinkling stars (x2 copies for seamless wrap) |
| 6 | Ursa Major | `svg.par.absolute.left-[1.2%].top-[64%].hidden.min-[1400px]:block` | 15 | 0.03 | constellation |
| 7 | Cassiopeia | `svg.par.absolute.left-[5%].top-[5.25rem].min-[1400px]:left-auto.min-[1400px]:right-[1.5%].min-[1400px]:top-[40%]` | 15 | 0.03 | constellation |
| 8 | moon | `div[data-moon].par.absolute.right-[9%].top-24.h-14.w-14.rounded-full.bg-[#e7ecf4].opacity-80.shadow-[0_0_60px_18px_rgba(200,214,240,0.10)].md:top-28.md:h-16.md:w-16` | 26 | 0.035 | moon + 2 craters |
| 9 | satellite east | `div.sky-moving.sky-drift-east.par.absolute.left-0.top-[24%]`, inline `animation-duration:110s; animation-delay:-35s` | 44 | 0 | 22x10 svg |
| 10 | satellite west | `div.sky-moving.sky-drift-west.par.absolute.left-0.top-[68%].scale-75`, inline `140s`, `-90s` | 34 | 0 | 22x10 svg |
| 11 | shooting star 1 | `div.sky-moving.par.absolute.-rotate-[24deg]` at `left:72%; top:14%` > `span.sky-shoot.block.h-px.w-28.bg-gradient-to-r.from-white/90.to-transparent`, inline `17s`, delay `3s` | 30 | 0 | streak |
| 12 | shooting star 2 | same at `left:38%; top:44%`, inline `23s`, delay `12s` | 30 | 0 | streak |

The `-inset-x-10 -top-10` (40px) overscan and the extra `+ wrap + 5rem` height exist so that pointer offsets (max `d` px) and scroll offsets (up to one tile) never expose an edge.

### 2.4 Room sky (server-rendered, fixed)

`div[aria-hidden][data-room-sky][data-sky-vars].pointer-events-none.fixed.inset-0.overflow-hidden` with inline `background: linear-gradient(180deg, #06080f 0%, #070a13 100%)` and the identical 12 child layers (same star data). CSS: `[data-room-sky]{visibility:hidden}` and `html[data-view="room"] [data-room-sky]{visibility:visible}`. It is the backdrop of the lab room (`#hero` gets `background: 0 0` so the sky shows through). Animations keep running while hidden.

### 2.5 Skyline divider (server-rendered, last child of the classic wrapper)

```
div[aria-hidden][data-sky-vars].pointer-events-none.relative.h-32.md:h-44      (128px / 176px)
  div.absolute.inset-0.bg-[radial-gradient(70%_100%_at_50%_100%,rgba(140,90,160,0.2),transparent_70%)]
  svg[viewBox="0 0 1200 150"][preserveAspectRatio="xMidYMax slice"].par-x.absolute.-left-8.top-0.h-full.w-[calc(100%+4rem)]  --d:7   far city, fill #0c1122
  svg[same].par-x  --d:17   near city, fill #05070d, + 78 window rects + 1 blinking beacon circle
```

### 2.6 Footer (server-rendered)

```
div[data-classic].relative.z-10  style="background:#05070d"
  footer.border-t.border-white/[0.06].py-14.px-6
    div.max-w-6xl.mx-auto
      div.grid.grid-cols-1.md:grid-cols-3.gap-12.mb-12
        div
          a[href="#hero"][aria-label="Back to top"].key.key-sm.key-icon.mb-4.text-[12px].font-bold.tracking-tight  "YG"
          p.text-white/60.text-sm.leading-relaxed.max-w-[220px]   (owner blurb)
        div
          p.text-white/50.text-xs.uppercase.tracking-widest.font-mono.mb-5   "Navigation"
          ul.space-y-2.5 > li > a.text-white/60.hover:text-white.text-sm.transition-colors   (6 links, no Homelab)
        div
          p (same as above)  "Connect"
          ul.space-y-3 > li > a.flex.items-center.gap-2.5.text-white/60.hover:text-white.text-sm.transition-colors.group
              svg|lucide.w-4.h-4.group-hover:text-putty.transition-colors.shrink-0  + label
      div.pt-6.border-t.border-white/[0.04].flex.flex-col.sm:flex-row.items-center.justify-between.gap-3
        p.text-white/50.text-xs.font-mono   "© {year} {owner name}"
        div.flex.items-center.gap-2
          span.w-1.5.h-1.5.rounded-full.bg-emerald-400.animate-pulse
          p.text-white/50.text-xs.font-mono   "Open to opportunities"
```

Measured: footer 432px tall at 1440 (851px at 390), padding 56px top and bottom. Connect links: GitHub, LinkedIn, Instagram open in a new tab (`target=_blank rel="noopener noreferrer"`); Email is a `mailto:` with no target. Icons: GitHub, LinkedIn and Instagram are inline brand SVGs (`viewBox 0 0 24 24`, `fill=currentColor`); Email is lucide `mail`.

### 2.7 Shared section shell

```
section#<id>[data-sec="signal|dusk|beacon|sodium"].py-24.md:py-32.px-6{.border-t.border-white/[0.06] on all but #projects}
  div.max-w-6xl.mx-auto            (#contact uses max-w-4xl)
    BlurFade.mb-12.md:mb-16        heading block (client, motion)
      p.text-sec.text-xs.font-mono.tracking-[0.2em].uppercase.mb-3
        span.opacity-70.mr-2  "{index}."
        "{kicker}"
      h2.display.sec-title  "{title}"
      p.text-white/65.text-lg.mt-5.max-w-lg  "{lede}"   (optional)
    ...section body (other specs), items individually wrapped in BlurFade with delay
```

---

## 3. Styling

### 3.1 Tokens

`:root` (unlayered):

| Token | Value | Use |
|---|---|---|
| `--background` | `#080808` | body background |
| `--foreground` | `#f0f0f0` | body text |
| `--signal` | `#3ecbff` | accent for #projects, #contact |
| `--dusk` | `#a58bff` | accent for #homelab, #about |
| `--beacon` | `#ff5a87` | accent for #experience |
| `--sodium` | `#ff9d3c` | accent for #websites, #photography |

Accent plumbing (unlayered): `[data-sec="signal"]{--sec:var(--signal)}`, same for dusk, beacon, sodium.

Tailwind v4 theme additions (inferred from compiled utilities; `@theme inline` so values inline into utilities):

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-putty: #e6d9b5;                 /* text-putty, text-putty/70, /80, border-putty/25, decoration-putty/40 */
  --color-sec: var(--sec, #e6d9b5);       /* text-sec, bg-sec/10, border-sec/20,/25,/40,/60 ... */
  --color-signal: var(--signal);          /* bg-signal/80 */
  --color-dusk: var(--dusk);
  --color-beacon: var(--beacon);          /* bg-beacon/80 */
  --color-sodium: var(--sodium);          /* bg-sodium/80 */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

Opacity modifiers compile to `color-mix(in oklab, <color> N%, transparent)` with a hex/lab fallback.

Other fixed colors used by the chrome: card surface `#0a0d19`; footer `#05070d`; header glass `#080808` at 85% (scrolled) or 95% (menu panel); hairlines `rgba(255,255,255,0.06)` (sections, header, footer) and `0.04` (footer bottom bar); key focus ring `rgba(239,232,212,0.7)`; selection `rgba(230,217,181,0.3)`.

### 3.2 Typography

| Role | Family | Size | Weight | Other |
|---|---|---|---|---|
| Body default | Geist (`--font-geist-sans`) | 16px, line-height 1.5 (24px) | 400 | `-webkit-font-smoothing: antialiased` |
| Mono (`font-mono`) | Geist Mono (`--font-geist-mono`) | per utility | | |
| `.key` | Geist Mono, `ui-monospace, monospace` | 13px (sm 12px, xs 11px) | 600 (xs 500) | `white-space: nowrap; user-select: none` |
| `.display` | Archivo (`--font-archivo`), `"Arial Narrow", system-ui, sans-serif` | per use | 900 | `font-stretch: 62%; text-transform: uppercase; line-height: 0.9` |
| `.sec-title` | `.display` | `clamp(2.6rem, 13vw, 5.5rem)` = 41.6px min, 88px max (reached at 677px viewport); 50.7px at 390 | 900 | color `#f7f4ec`, line-height 79.2px at 88px |
| Eyebrow | Geist Mono | 12px / 16px | 400 | `letter-spacing: 0.2em` (2.4px), uppercase, color `var(--sec)`, margin-bottom 12px; index span opacity 0.7, margin-right 8px |
| Lede | Geist | 18px / 28px | 400 | `rgba(255,255,255,0.65)`, margin-top 20px, max-width 512px |
| Nav link | Geist | 14px / 20px | 400 | `rgba(255,255,255,0.6)`, active `#fff` |
| Mobile menu link | Geist | 15px / 22.5px | 400 | `rgba(255,255,255,0.7)`, active `#e6d9b5` (putty), padding 10px 0 |
| Footer column label | Geist Mono | 12px | 400 | uppercase, `tracking-widest` (0.1em), `rgba(255,255,255,0.5)`, mb 20px |
| Footer link | Geist | 14px | 400 | `rgba(255,255,255,0.6)` hover `#fff` |
| Footer bottom text | Geist Mono | 12px | 400 | `rgba(255,255,255,0.5)` |
| Constellation label | Geist Mono (`font-mono uppercase` on svg text) | 11 SVG units (7.15px rendered at 0.65 scale) | 400 | `letter-spacing: 2` units (1.3px), fill `rgba(210,222,255,0.3)` |

### 3.3 Header states

| State | Condition | Classes | Computed |
|---|---|---|---|
| Top | `scrollY <= 20` and menu closed, or room view and menu closed | `bg-transparent` | background transparent, no blur, no border, 64px tall |
| Scrolled | `scrollY > 20` and not room view | `border-b border-white/[0.06] bg-[#080808]/85 backdrop-blur-xl` | `background-color: rgba(8,8,8,0.85)` (lab 2.19 / 0.85), `backdrop-filter: blur(24px)`, `border-bottom: 1px solid rgba(255,255,255,0.06)`, height 65px |
| Menu open | menu state true (any scroll, any view) | same as Scrolled | same |
| Hidden | `html[data-lab-intro]`, `html[data-lab-focus]`, or `html[data-lab-zoomed]` | unlayered CSS | `opacity: 0; pointer-events: none` |

Gotcha that must be reproduced: the stylesheet has an unlayered rule `header { transition: opacity .6s }`. Unlayered CSS beats Tailwind's `@layer utilities`, so `transition-all duration-300` on the header is dead. Computed: `transition-property: opacity; transition-duration: 0.6s; transition-timing-function: ease`. The background, blur and border therefore switch instantly at the 20px threshold; only the opacity hide/show is animated (measured 0.995 at 0ms, 0.010 at 500ms, 0 at 1000ms after entering the zoomed room).

The header never hides on scroll down; there is no scroll-direction logic.

### 3.4 Keyboard-key buttons (`@layer components`)

Because these live in `@layer components`, any Tailwind utility on the same element wins (for example `text-[12px] font-bold tracking-tight` on the YG key, `pr-6` on another key).

Base `.key`:

| Property | Value |
|---|---|
| display | `inline-flex`; `align-items: center; justify-content: center; gap: 0.5rem; position: relative` |
| height | `2.75rem` (44px) |
| padding | `0 1.25rem` (20px) |
| border-radius | `8px` |
| font | Geist Mono, 13px, weight 600, `white-space: nowrap`, `user-select: none` |
| color | `#ffffffdb` (rgba 255,255,255,0.86) |
| background | `linear-gradient(#2c3035, #1c1f23)` (top to bottom) |
| box-shadow | `inset 0 1px #ffffff1a, 0 3px #0a0b0d, 0 6px 14px #0000008c` (inset 10% white top highlight; solid 3px dark bottom edge; 55% black drop) |
| transition | `transform .1s, box-shadow .1s, color .15s` (default `ease`) |

States:

| State | color | transform | box-shadow |
|---|---|---|---|
| `:hover` | `#fff` | `translateY(-1px)` | `inset 0 1px #ffffff1a, 0 4px #0a0b0d, 0 8px 18px #0000008c` |
| `:active`, `[aria-pressed="true"]` | unchanged | `translateY(3px)` | `inset 0 1px #ffffff0f, 0 0 #0a0b0d, 0 1px 3px #00000080` |
| `:disabled` | | | `opacity: .35; pointer-events: none` |
| `:focus-visible` | | | `outline: 2px solid #efe8d4b3; outline-offset: 3px` |

Net travel from hover to pressed is 4px; the bottom edge collapses from 4px to 0, which sells the "key press". Measured on the YG key: rest y 14, hover y 13, pressed y 17.

Variants:

| Class | Overrides |
|---|---|
| `.key-light` | color `#2a2620`; background `linear-gradient(#efe8d4, #d4cab1)`; shadow `inset 0 1px #fffc, 0 3px #9a8f77, 0 6px 14px #0000008c`. Hover: color `#1a1712`, shadow `inset 0 1px #fffc, 0 4px #9a8f77, 0 8px 18px #0000008c`. Active/pressed: shadow `inset 0 1px #fff9, 0 0 #9a8f77, 0 1px 3px #00000080` (transform from `.key`) |
| `.key-sm` | `border-radius: 7px; height: 2.25rem (36px); padding: 0 .85rem (13.6px); font-size: 12px` |
| `.key-xs` | `border-radius: 6px; height: 1.75rem (28px); padding: 0 .6rem (9.6px); font-size: 11px; font-weight: 500` |
| `.key-icon` | `width: 2.25rem (36px); padding: 0` (square; combine with `.key-sm`) |
| `.key-legend` | small corner legend inside a key: `position:absolute; top:3px; right:6px; font-size:9px; font-weight:400; line-height:1; opacity:.5` |

Context overrides elsewhere: `.mini-room .key { transition: transform .15s, box-shadow .15s }` and `.mini-room:hover .key { transform: translateY(-2px) }`. Reduced motion: `.key, .key:hover, .key:active { transition: none; transform: none }` (shadows still change).

### 3.5 Burger button

Not a key. `36x36`, `border: 1px solid rgba(255,255,255,0.1)`, `border-radius: 8px`, color `rgba(255,255,255,0.7)`, hover `#fff` (Tailwind `transition-colors`, 150ms `cubic-bezier(0.4,0,0.2,1)`), lucide icon 17px, stroke 2, `aria-hidden`.

### 3.6 Shared card and chip styles

| Pattern | Classes / values |
|---|---|
| MagicCard (spotlight card) | `relative overflow-hidden rounded-xl border border-white/10 p-6 transition-colors duration-300`; background `#0a0d19`; on hover add `border-sec/40` and background `radial-gradient(350px circle at {x}px {y}px, color-mix(in srgb, var(--sec, #e6d9b5) 10%, transparent), transparent 70%), #0a0d19` where x,y is the mouse position relative to the card (updated on every `mousemove`) |
| Large link card | `group relative block rounded-2xl border border-white/10 bg-[#0a0d19] overflow-hidden transition-colors duration-300 hover:border-sec/40` |
| Contact tile | `flex items-center gap-4 p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-sec/40 hover:bg-white/[0.05] transition-all duration-200 group`; icon well `p-2.5 rounded-lg bg-white/[0.04] group-hover:bg-sec/10 transition-colors`; icon `w-5 h-5 text-sec/80 group-hover:text-sec` |
| Tech chip with logo | `inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-white/[0.04] text-white/75 border border-white/10` + `img.w-3.5.h-3.5` (devicon). Measured 26px tall, radius full |
| Neutral tag (pill) | `text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-white/75` |
| Neutral tag (square) | `text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-white/75` |
| Accent pill | `inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-sec/10 text-sec border border-sec/20` |
| Accent tag (square) | `text-xs px-2.5 py-1 rounded-lg bg-sec/10 border border-sec/25 text-sec` |
| Mini mono label | `text-white/50 text-xs uppercase tracking-widest font-mono` |
| Live dot | `w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse` (`#00d294`) |
| Dot grid placeholder | `.dot-grid { background-image: radial-gradient(circle, #ffffff1f 1px, #0000 1px); background-size: 28px 28px }` on `bg-[#080b14]` |

### 3.7 Global CSS (unlayered, in source order)

| Rule | Purpose |
|---|---|
| `:root { --background ... --sodium }` | tokens |
| `@keyframes gradient` (0% `background-position:0%`, 50% `100%`, 100% `0%`) | unused leftover; no element references it |
| `html { scroll-behavior: smooth }`; reduced motion: `auto` | anchor scrolling |
| `::selection { background: #e6d9b54d }` | putty at 30% |
| `.sky-twinkle`, `.sky-blink`, `.sky-drift-east`, `.sky-drift-west`, `.sky-shoot` + keyframes | sky animations (4.2) |
| reduced motion: `.sky-moving{display:none}`, `.sky-twinkle,.sky-blink{animation:none}` | |
| `.par`, `.par-wrap`, `.par-x` (+ `will-change: transform`), `@supports not (translate: 0 mod(10px,3px))` fallback, reduced-motion `translate: none` | parallax system (4.1) |
| `.display`, `.name-block`, `.name-line`, `@keyframes name-in`, `html[data-been-inside] .name-line > span { animation: none }` | display type; name lockup (landing spec) |
| `[data-sec=...]`, `.sec-title` | section accents and titles |
| `.ticket`, `.ticket-stub`, `.ticket-bars` | experience ticket cards (other spec) |
| `.no-scrollbar` (`scrollbar-width:none`, `::-webkit-scrollbar{display:none}`) | horizontal scrollers |
| `.mini-room-tilt`, `.mini-room-float`, `.mini-room-shadow`, `.mini-room .key`, `.mini-room:focus-visible` (`outline: 2px solid #efe8d4b3; outline-offset: 6px; border-radius: 12px`) + keyframes `mini-room-settle`, `mini-room-float`, `mini-room-shadow` | landing room thumbnail (other spec) |
| `@keyframes scroll-cue` | landing scroll cue (other spec) |
| `html[data-boot="seen"] #boot-intro {display:none}`, `@keyframes crt-off`, `@keyframes boot-caret` | boot intro; the element is not present in the current build (legacy) |
| `.lab-mono`, `.lab-led-*`, `.lab-hot`, `.lab-mk-*`, `.lab-tip`, `.lab-spin`, `.lab-disc-spin`, `.lab-note` + keyframes `lab-act`, `lab-disk`, `lab-pulse`, `lab-fade-in`, `lab-caret`, `lab-mk-breathe`, `lab-mk-ping`, `lab-spin`, `lab-note` | room experience (other spec) |
| `header { transition: opacity .6s }` and the `html[data-lab-*] header` hide rule | header fade (3.3) |
| `html[data-opening] #hero [data-term] { opacity: 1 !important }` | room intro |
| `html[data-view="classic"] #hero, html[data-view="room"] #hero ~ *, html[data-view="room"] [data-classic] { display: none }` | view switching |
| `[data-room-sky]{visibility:hidden}`, `html[data-view="room"] [data-room-sky]{visibility:visible}` | room sky |
| `#hero { background: 0 0 }`, `#hero > .bg-gradient-to-b, #hero svg[data-cam] > ellipse[fill="url(#lab-halo)"] { display: none }` | lets the room sky show through |
| `html[data-view="room"], html[data-view="room"] body { overscroll-behavior: none; overflow: hidden }`; `html[data-view="room"] #hero { touch-action: none; height: 100svh }` | room scroll lock |
| `html[data-lab-intro], html[data-lab-intro] body { overscroll-behavior: none; overflow: hidden }`; `html[data-lab-intro] #hero ~ *, html[data-lab-intro] footer { visibility: hidden }` | intro lock |
| `html[data-lab-zoomed] #hero { cursor: grab }`, `[data-dragging] { cursor: grabbing }` | room drag cursors |
| `.dot-grid` | placeholder pattern |
| `body { background: var(--background); color: var(--foreground) }` | duplicates the body utilities |

Tailwind keyframes in use: `pulse` (`50% { opacity: .5 }`, `animate-pulse` = `2s cubic-bezier(0.4,0,0.6,1) infinite`).

Scrollbars: no global scrollbar styling. Only arbitrary utilities on inner scrollers: `[scrollbar-width:thin]` with `[scrollbar-color:rgba(255,255,255,0.15)_transparent]`, `0.18`, `rgba(148,163,184,0.3)`, `rgba(255,179,71,0.3)`, and `.no-scrollbar`.

Focus: no global `:focus-visible` rule. `.key`, `.mini-room`, `.lab-hot` define their own. Plain links (nav, footer) show the browser default ring (computed `outline: auto 1px`). Some components use `focus-visible:ring-1`, `focus-visible:ring-[3px]`, `focus-visible:outline-none` utilities.

Cursors: browser defaults (Tailwind v4 preflight leaves buttons at `cursor: default`; links get `pointer`). Explicit: `.lab-hot { cursor: pointer }`, `cursor-pointer`, `cursor-grab`, `active:cursor-grabbing`, `cursor-text` utilities in components, and the room grab/grabbing rules. No custom cursor image.

Tailwind v4 `hover:` utilities are wrapped in `@media (hover: hover)`, so they never stick on touch. The custom `.key:hover` is not wrapped and can stick after a tap on touch devices.

### 3.8 Sky element styling details

Star gradients (tile layers): each star is one `radial-gradient(Spx Spx at X% Y%, rgba(R,G,B,A), transparent)` in the layer's `background-image` list, so a tile is a single painted background with no DOM per star.

| Layer | Stars | Sizes (S) | Alpha range | Color mix |
|---|---|---|---|---|
| Tile A 560px | 44 | 1px x39, 1.6px x5 | 0.18 to 0.55 | cool white `226,232,255` x29, blue `186,214,255` x10, warm `255,228,186` x5 |
| Tile B 760px | 30 | 1px x30 | 0.19 to 0.76 | cool 14, blue 10, warm 6 |
| Tile C 900px | 14 | 1.6px x11, 2.4px x3 | 0.21 to 0.94 (2.4px ones 0.73 to 0.86) | cool 7, blue 5, warm 2 |
| Milky way 700x600 | 70 | 1px x61, 1.6px x9 | 0.18 to 0.50 | cool 41, blue 13, warm 16 |

Positions are uniform in [0, 100)% with 2-decimal rounding; alpha 2 decimals. The milky way layer adds, as its last background (size `100% 100%`): `linear-gradient(118deg, transparent 30%, rgba(160,170,235,0.05) 46%, rgba(190,180,240,0.07) 50%, rgba(160,170,235,0.05) 54%, transparent 70%)`, and the whole layer is masked by `mask-image: linear-gradient(118deg, transparent 28%, rgba(0,0,0,0.6) 44%, #000 50%, rgba(0,0,0,0.6) 56%, transparent 72%)` (with `-webkit-mask-image`), then `opacity: 0.7`. Result: a soft lavender band of denser stars running from lower-left to upper-right at about 62 degrees from horizontal through the viewport center.

Twinkle star span: `sky-twinkle absolute h-[2px] w-[2px] rounded-full bg-[#eef2ff] shadow-[0_0_5px_1px_rgba(210,222,255,0.6)]`, inline `left`, `top` (full-precision %), `animation-delay` (negative seconds) and `animation-duration`. The 12 values (left %, top %, delay s, duration s):

| # | left | top | delay | duration |
|---|---|---|---|---|
| 1 | 0.02 | 14.68 | -2.54 | 3.87 |
| 2 | 51.58 | 75.75 | -2.75 | 3.18 |
| 3 | 5.82 | 91.89 | -5.33 | 3.41 |
| 4 | 75.99 | 14.17 | -3.94 | 4.68 |
| 5 | 80.56 | 28.52 | -5.32 | 3.29 |
| 6 | 94.21 | 32.94 | -1.55 | 6.37 |
| 7 | 23.12 | 36.79 | -5.11 | 4.09 |
| 8 | 89.60 | 71.37 | -1.32 | 5.51 |
| 9 | 13.60 | 48.54 | -4.91 | 3.70 |
| 10 | 61.18 | 46.59 | -4.33 | 4.30 |
| 11 | 65.82 | 47.48 | -2.41 | 4.42 |
| 12 | 19.71 | 29.78 | -3.48 | 4.70 |

Ranges imply roughly `delay = -(rand * 6)s`, `duration = 3 + rand * 3.5s`.

Constellations (shared star style: glow `circle r=4 fill rgba(210,222,255,0.08)` under core `circle r=1.4 fill #e2e8ff opacity .85`; connecting `line stroke rgba(190,205,255,0.16) stroke-width .8`; label `text` at x=0):

| | viewBox | Rendered size (scale 0.65) | Stars (viewBox units) | Lines | Label |
|---|---|---|---|---|---|
| Ursa Major (Big Dipper asterism) | `0 0 184 80` | 119.6 x 52 | bowl (4,10) (6,44) (58,52) (62,20); handle (100,17) (138,12) (176,30) | closed bowl quad, then handle chain from (62,20) | "ursa major", y=76 |
| Cassiopeia (W) | `0 0 132 78` | 85.8 x 50.7 | (4,16) (34,50) (64,22) (96,54) (126,10) | 4-segment zigzag chain | "cassiopeia", y=74 |

Moon: 56px circle (64px from `md`), `#e7ecf4` at `opacity: .8`, glow `box-shadow: 0 0 60px 18px rgba(200,214,240,0.10)`. Two flat craters: `left 22%, top 26%, size 18%, #cfd6e2` and `left 55%, top 55%, size 12%, #d6dce7`. Position `right: 9%`, `top: 96px` (112px from `md`).

Satellite (22x10 svg, rendered 1:1; west copy at `scale: .75`): two solar panels `rect (0,3) 7x4` and `rect (15,3) 7x4` fill `#3a4a6b`, stroke `#6b7fa8` 0.4; body `rect (8.5,2.5) 5x5 rx .8` fill `#9aa6bd`; struts `line` from panel to body at y=5, stroke `#9aa6bd` 0.6; beacon `circle (11,1.2) r=1 fill #fb7185` with `.sky-blink`.

Shooting star: `span` 112x1px (`w-28 h-px`), `linear-gradient(to right, rgba(255,255,255,0.9), transparent)` so the bright head is on the left (the direction of travel). Parent rotated `-24deg` via the Tailwind v4 `rotate` property.

Skyline (viewBox 1200x150, anchored bottom-center, sliced):

* Far layer, fill `#0c1122`, `--d: 7`: 36 flat-topped blocks spanning x -10 to 1236, block tops between y 83 and 120, widths 18 to 47, mostly abutting with occasional 4-unit gaps, plus one gabled roof block around x 1036 to 1078.
* Near layer, fill `#05070d` (identical to the footer, so the city base merges into the footer), `--d: 17`: 32 flat-topped blocks (tops y 105 to 134, widths 18 to 48), 3 small gabled blocks, and 4 landmark towers clustered in the center third: a domed tower (x 470 to 500, walls to y 58, dome crest y 48), a spire tower (x 560 to 594, walls to y 46, apex y 26) with a 1.4-wide antenna mast up to y 10, a crenellated tower (x 652 to 694, top y 54 with two merlons to y 48), and a gabled tower (x 770 to 800, eaves y 52, ridge y 41).
* Windows: 78 rects 2.2x2.8; 54 warm `#fcd9a0` at opacity 0.5, 24 cool `#dbeafe` at 0.4; x from 69 to 1183, y from 59 to 144, concentrated on the landmark towers.
* Beacon: `circle cx=577 cy=10 r=1.6 fill #fb7185 class=sky-blink` on the mast tip.
* Glow behind: `radial-gradient(70% 100% at 50% 100%, rgba(140,90,160,0.2), transparent 70%)`.
* With `xMidYMax slice`: at 1440 the svg box is 1504x176, scale 1.253, about 12px trimmed off the top; at 390 it is 454x128, scale 0.853, only the middle ~532 units (x 334 to 866) are visible, which keeps all four landmarks on screen.

---

## 4. Animation and timing

No ScrollTrigger is used anywhere. Scroll-linked motion is pure CSS driven by three custom properties; reveals use motion's `whileInView`; GSAP is used only inside the room experience.

### 4.1 Parallax system (`SkyMotion` + `.par*` CSS)

CSS (unlayered):

```css
.par, .par-wrap, .par-x { will-change: transform; }
.par {
  translate: calc(var(--px,0) * var(--d,10) * -1px)
             calc(var(--py,0) * var(--d,10) * -1px - var(--sy,0) * var(--s,0) * 1px);
}
.par-wrap {
  translate: calc(var(--px,0) * var(--d,10) * -1px)
             calc(var(--py,0) * var(--d,10) * -1px - mod(var(--sy,0) * var(--s,0) * 1px, var(--wrap)));
}
@supports not (translate: 0 mod(10px, 3px)) {
  .par-wrap { translate: calc(var(--px,0) * var(--d,10) * -1px) calc(var(--py,0) * var(--d,10) * -1px); }
}
.par-x { translate: calc(var(--px,0) * var(--d,10) * -1px) 0; }
@media (prefers-reduced-motion: reduce) { .par, .par-wrap, .par-x { translate: none; } }
```

Meaning: `--px`, `--py` are the eased pointer position in [-1, 1]; each layer shifts opposite to the pointer by up to `--d` px (nearer layers have larger `d`). `--sy` is `scrollY`; `.par` layers slide up by `sy * s` px without bound (the moon and constellations drift up and eventually leave the viewport), `.par-wrap` layers slide up by `sy * s` modulo one tile so the tiled field never runs out. Parallax uses the individual `translate` property so it composes with `transform` keyframes and Tailwind v4 `rotate`/`scale` utilities on the same element.

`SkyMotion` (client, renders `null`), pseudocode:

```ts
useEffect(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0, last = 0;
  const tick = (now: number) => {
    raf = 0;
    const dt = last ? Math.min(now - last, 64) : 16;
    const k = 1 - Math.exp(-dt / 160);          // 160ms time constant
    last = now; x += (tx - x) * k; y += (ty - y) * k;
    const settled = Math.abs(tx - x) < 0.002 && Math.abs(ty - y) < 0.002;
    if (settled) { x = tx; y = ty; last = 0; }
    for (const el of document.querySelectorAll<HTMLElement>('[data-sky-vars]')) {
      el.style.setProperty('--px', x.toFixed(4));
      el.style.setProperty('--py', y.toFixed(4));
      el.style.setProperty('--sy', window.scrollY.toFixed(1));
    }
    if (!settled) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const onMove = (e: PointerEvent) => { if (e.pointerType === 'touch') return;
    tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; kick(); };
  const onLeave = (e: PointerEvent) => { if (e.pointerType === 'touch') return; tx = 0; ty = 0; kick(); };
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('scroll', kick, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  kick();
  return () => { cancelAnimationFrame(raf); /* remove all three listeners */ };
}, []);
```

Measured response to a jump from x=-1 to x=+1: 54ms -0.39, 107ms 0.01, 215ms 0.50, 379ms 0.82, 595ms 0.95, 1082ms 0.998. Scroll is not smoothed; `--sy` is written on the next animation frame after each scroll event.

Elements carrying `data-sky-vars` (all receive the same values): room sky container, classic sticky sky container, the landing `HeroRoom` wrapper (its inner `.par` has `--d: 18; --s: -0.04`, so the room thumbnail sinks slightly as you scroll), and the skyline divider.

Parallax magnitudes (max px at a viewport edge): tiles 6 / 13 / 22, milky way 9, twinkles 18, constellations 15, moon 26, satellites 44 / 34, shooting stars 30, skyline 7 / 17 (x only). Scroll rates: tiles 2% / 4.5% / 8% (wrapping at 560 / 760 / 900 px), twinkles 6.5% (wrapping at 100lvh), constellations 3%, moon 3.5%, landing room -4%. At the bottom of the desktop page (`scrollY` 9206) the moon has moved up 322px and is off screen; Cassiopeia (desktop) has moved 276px and is still visible near the top right.

### 4.2 Sky keyframes

| Class | Animation shorthand | Keyframes | Instances |
|---|---|---|---|
| `.sky-twinkle` | `4s ease-in-out infinite sky-twinkle` (duration overridden inline 3.18 to 6.37s, negative delays) | `0%,100% {opacity:.3} 50% {opacity:1}` | 12 per sky (24 spans incl. wrap copy) |
| `.sky-blink` | `2.2s linear infinite sky-blink` | `0%,86%,100% {opacity:.12} 89%,95% {opacity:1}` (a ~0.13s flash every 2.2s after a 66ms ramp) | satellite beacons, skyline beacon |
| `.sky-drift-east` | `110s linear infinite sky-drift-east` (inline delay -35s) | `0% {transform: translate(-6vw)} 100% {transform: translate(106vw, -14vh)}` | upper satellite, travels right and up |
| `.sky-drift-west` | `140s linear infinite sky-drift-west` (inline delay -90s) | `0% {transform: translate(106vw)} 100% {transform: translate(-6vw, 9vh)}` | lower satellite, travels left and down. Because Tailwind v4 `scale-75` is the `scale` property, it applies after the `transform` translation, so this satellite's whole path is scaled by 0.75 about its origin (effective x 79.5vw to -4.5vw, y +6.75vh) |
| `.sky-shoot` | `opacity: 0; animation: 17s ease-out infinite sky-shoot` (inline 17s/3s and 23s/12s) | `0% {opacity:0; transform:translate(0)} 1.2% {opacity:1} 6% {opacity:0; transform:translate(-300px)} 100% {opacity:0; transform:translate(-300px)}` | 2 streaks |

Shooting star timing (17s instance): first appears 3s after load, fades in over 0.204s, travels 300px along its -24deg axis (274px left, 122px down on screen) while fading out by 1.02s, then waits until the next cycle (every 17s). The 23s instance first fires at 12s: 0.276s in, out by 1.38s. Measured frames for the 17s one (left edge x, y, opacity): 3.0s (1041,103,0), 3.1s (998,122,0.67), 3.2s (958,140,1.0), 3.4s (888,172,0.64), 3.6s (829,198,0.33), 3.8s (787,217,0.11), 4.0s (768,225,0.00). `ease-out` applies per keyframe interval.

Reduced motion: `.sky-moving { display: none }` (both satellites and both shooting stars removed), twinkle and blink animations off (stars stay at full opacity), parallax translate off.

### 4.3 Scroll-linked backdrop change (no dimming)

Nothing dims or fades on scroll. The perceived change comes from: the classic wrapper gradient (fixed to the document, so it scrolls) shifting from `#06080f` at the top through `#080b16` (30%), `#0b0f1d` (65%), `#121129` (88%) to `#1c1530` (100%); the moon and constellations drifting up and out; and the skyline glow `rgba(140,90,160,0.2)` at the very end. Sections are transparent (`background-color: rgba(0,0,0,0)` measured on all seven). The footer wrapper is opaque `#05070d`.

### 4.4 Shared reveal (`BlurFade`, motion)

```tsx
<motion.div
  initial={{ opacity: 0, y: 14 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.15 }}
  transition={reduced ? { duration: 0 } : { duration: 0.5, delay, ease: 'easeOut' }}
  className={className}
/>
```

`reduced` is read once from motion's `prefersReducedMotion` on mount. Despite the name there is no blur. SSR output carries `style="opacity:0;transform:translateY(14px)"` so content is hidden until hydrated and in view. Measured on the #contact heading: 0ms 0 / 14px, 110ms 0.24 / 10.5px, 220ms 0.60 / 5.6px, 329ms 0.82 / 2.5px, 439ms 0.97 / 0.5px, 548ms 1 / none. Usage: every section heading block (delay 0), and section items with delays such as 0, 0.1, 0.2 (other specs give per-item delays).

### 4.5 Other chrome motion

* Header hide/show: `opacity` 0.6s `ease` (3.3).
* Nav link color: 200ms `cubic-bezier(0.4,0,0.2,1)` (Tailwind `transition-colors duration-200`).
* Footer and menu link color: 150ms default Tailwind transition.
* `.key` press: transform/box-shadow 0.1s, color 0.15s.
* Mobile menu: no open/close animation (conditional render).
* Footer live dot: `pulse` 2s.
* MagicCard: border-color 300ms; spotlight follows the cursor with no easing (React state per mousemove).

### 4.6 GSAP

GSAP 3.15.0 core with `gsap.registerPlugin(useGSAP, DrawSVGPlugin, MotionPathPlugin)`, registered in the room (`LabHero`) module. None of the chrome uses GSAP. A console warning on load (`GSAP target [data-dock] not found`) comes from the room code.

---

## 5. Interaction and state

### 5.1 View store (shared module)

A tiny external store on `document.documentElement.dataset.view` (`"room" | "classic"`), with a window event `yg:view`.

* `currentView()`: reads `data-view`, returns `"room" | "classic" | null`.
* `setView(v)`: if changed, sets `data-view`, sets `history.scrollRestoration` to `"manual"` for room or `"auto"` for classic, calls `scrollTo({ top: 0, behavior: "instant" })`, dispatches `yg:view`.
* `useView()`: `useSyncExternalStore(subscribe, currentView, () => null)`.
* Other exports used by the room: `enterRoom`, `findWayOut`, `setDoor`, `takeEntry`, `wayOut` (reads `--px/--py` from the first `[data-sky-vars]` to compensate the door position for parallax), and event names `yg:home`, `yg:pick`.

### 5.2 Header behavior

* Scrolled flag: `scroll` listener (not passive) sets `scrolled = scrollY > 20`.
* Scrollspy: one `IntersectionObserver` per section id with `rootMargin: "-40% 0px -55% 0px"`, `threshold: 0` (a 5% tall band from 40% to 45% of the viewport). When a section intersects the band it becomes active. There is no reset when nothing intersects, so the last section that crossed the band stays active (for example, after jumping straight to the bottom of the page the highlight can remain on an earlier section). Active styling only applies in classic view: desktop `text-white`, mobile panel `text-putty`.
* Hash cleanup: 1500ms after mount, and on every `hashchange`, if `location.hash` is set it is removed with `history.replaceState(null, "", pathname + search)`. Clicking a nav link therefore performs a native smooth anchor scroll (`html { scroll-behavior: smooth }`), and the URL never keeps the hash. Measured: Experience link scrolls from 0 to 5099 in about 1.1s; section top lands at 0 (no `scroll-margin-top`, the 64px header overlaps the section's 96/128px top padding).
* Nav link click handler: closes the menu; in room view it calls `preventDefault()` and dispatches `new CustomEvent("yg:pick", { detail: room })` where `room` is per item: projects `monitor`, homelab `rack`, websites `monitor`, experience `badge`, about `resume`, photography `camera`, contact `phone`.
* YG monogram click: if the view is known (after hydration), `preventDefault()` and close menu; in room view dispatch `new Event("yg:home")`; in classic view `scrollTo({ top: 0, behavior: "smooth" })` (measured about 1.1s from 5099 to 0).
* Resume: plain link to `/resume.pdf` in a new tab (`noopener noreferrer`). The mobile panel copy also closes the menu on click.
* Burger: toggles `open`; label and icon swap (`Open menu` + Menu icon / `Close menu` + X icon), `aria-expanded` mirrors state. No `aria-controls`. No Escape key handling, no outside-click close, no focus trap, no scroll lock (all verified). The menu closes when any menu link is clicked.

### 5.3 Footer links

Footer links are server-rendered plain anchors. The footer YG (`href="#hero"`, `aria-label="Back to top"`) is a no-op in classic view because `#hero` is `display: none` there (verified: no scroll). Footer navigation lists 6 sections (Homelab omitted).

### 5.4 MagicCard

`onMouseMove` stores `{x: clientX - rect.left, y: clientY - rect.top}`; `onMouseEnter`/`onMouseLeave` toggle hover. Mouse events only (no touch spotlight).

### 5.5 Pointer and touch in the sky

Pointer parallax ignores `pointerType === "touch"`; on touch devices only scroll parallax runs. `pointerleave` on `<html>` eases the sky back to center.

### 5.6 Inline boot scripts and persisted state

Layout script (runs before paint): `if (localStorage.getItem('yg-boot') || reducedMotion) html.dataset.boot = 'seen'` (on exception also `'seen'`). Legacy: no `#boot-intro` element exists in the current build.

Page script (runs before paint):

```js
s = JSON.parse(localStorage.getItem('yg-lab') || 'null')   // try/catch
if ((s && s.active) || location.hash || reducedMotion) return;   // stay classic
html.dataset.view = 'room'; html.dataset.labIntro = ''; html.dataset.opening = '';
history.scrollRestoration = 'manual'; scrollTo(0, 0);
```

localStorage keys seen: `yg-lab` = `{"user":"guest","at":<epoch ms>,"active":true}` (written by the room; a legacy plain-string user value is accepted), `yg-lab-hints` (room hints), `yg-boot` (legacy). A first-time visitor without a hash lands in the room intro with the header hidden; "skip intro" goes to classic view. Visiting with any hash (for example `/#x`) or with reduced motion goes straight to classic.

`<html>` data attributes that affect the chrome: `data-view` (room/classic), `data-lab-intro`, `data-opening`, `data-lab-focus`, `data-lab-zoomed` (header hidden), `data-been-inside` (disables the name entrance animation), `data-lab-music`, `data-boot`.

---

## 6. Responsive behavior

| Width | Header | Sky | Sections / footer |
|---|---|---|---|
| < 640 | YG + burger only; Resume lives in the menu panel (`li.pt-2.sm:hidden`) | Cassiopeia top-left at `left 5%, top 84px` (sits just under the header); Ursa Major hidden; moon 56px at `top 96px, right 9%` | `py-24` (96px); `sec-title` 13vw (50.7px at 390); footer single column; bottom bar stacked and centered |
| 640 to 767 | YG + Resume key + burger | same | footer bottom bar becomes a row (`sm:flex-row`) |
| 768 to 1023 | same | moon 64px at `top 112px` | `md:py-32` (128px); footer 3 columns; skyline 176px tall |
| >= 1024 | full link list, Resume, no burger | same | |
| >= 1400 (`min-[1400px]`) | | Ursa Major appears at `left 1.2%, top 64%`; Cassiopeia moves to `right 1.5%, top 40%` | |

Before hydration the link list breakpoint is `sm` (640) instead of `lg` (1024), see 2.2.

Heights use `lvh` (`h-lvh`, `100lvh`, `200lvh`) so the sky does not jump when mobile browser chrome collapses.

Coarse pointer: no pointer parallax (touch ignored); Tailwind hover utilities are gated by `(hover: hover)`; `.key:hover` is not. The stylesheet also defines `[@media(pointer:coarse)]:hidden` and `[@media(pointer:coarse)]:inline-flex` variants, used by the room UI, not the chrome.

---

## 7. Accessibility and reduced motion

* Sky containers, the skyline, satellites and decorative icons are `aria-hidden`.
* Header: semantic `header > nav > ul > li > a`. Nav has no `aria-label`. Monogram link has an aria-label naming the owner plus "back to top". The burger has `aria-label` and `aria-expanded` but no `aria-controls`; the panel is not a dialog and does not trap focus.
* Focus: `.key:focus-visible` ring `2px solid rgba(239,232,212,0.7)`, offset 3px (verified on YG and Resume via keyboard Tab). Text links use the browser default ring.
* Contrast: nav links are 60% white on near-black.
* `prefers-reduced-motion: reduce` effects: no room intro (inline script), `data-boot="seen"`, `SkyMotion` does nothing (no vars written), `.par*` translate none, `.sky-moving` hidden, twinkle/blink static, `scroll-behavior: auto`, `BlurFade` duration 0 (still starts hidden until in view, then appears instantly), `.key` transitions and transforms off, name entrance off, room animations off. Verified with Playwright `reducedMotion: 'reduce'`.
* The `sr-only` full name is provided for the split-letter display name (landing spec).

---

## 8. Content model

```ts
type SectionId = 'projects' | 'homelab' | 'websites' | 'experience' | 'about' | 'photography' | 'contact';
type Accent = 'signal' | 'dusk' | 'beacon' | 'sodium';
type RoomTarget = 'monitor' | 'rack' | 'badge' | 'resume' | 'camera' | 'phone';

interface NavItem { href: `#${SectionId}`; label: string; id: SectionId; room: RoomTarget }

interface SiteChrome {
  monogram: string;            // 2 uppercase letters (owner initials)
  monogramAriaLabel: string;   // "<owner name>, back to top"
  resumeHref: string;          // "/resume.pdf"
  nav: NavItem[];              // 7
}

interface SectionHeading {
  id: SectionId;
  accent: Accent;
  index: string;               // "01".."07"
  kicker: string;              // 1 to 2 words
  title: string;               // 1 to 3 words
  lede?: string;               // 25 to 135 chars, owner prose
  containerMax: '6xl' | '4xl'; // contact uses 4xl
  borderTop: boolean;          // false only for the first section
}

interface FooterContent {
  blurb: string;               // owner prose, ~120 chars, max-width 220px
  navLinks: { href: `#${SectionId}`; label: string }[];   // 6 (homelab omitted)
  connect: { label: string; href: string; icon: 'github' | 'linkedin' | 'instagram' | 'mail'; external: boolean }[]; // 4
  copyrightName: string;
  year: number;                // rendered at build time
  statusText: string;          // "Open to opportunities"
}

interface SkyStar { size: 1 | 1.6 | 2.4; x: number; y: number; rgb: [number, number, number]; alpha: number }
interface SkyTile { tile: number | [number, number]; d: number; s: number; stars: SkyStar[] }
interface TwinkleStar { left: number; top: number; delay: number; duration: number }
```

Section heading data (generic labels, verbatim):

| # | id | accent | kicker | title | lede |
|---|---|---|---|---|---|
| 01 | projects | signal | Work | Projects | none |
| 02 | homelab | dusk | Self-hosted | Homelab | ~130 chars |
| 03 | websites | sodium | Client Work | Websites for Business | ~85 chars |
| 04 | experience | beacon | Background | Experience | none |
| 05 | about | dusk | Story | About | none |
| 06 | photography | sodium | Creative | Photography | ~25 chars + device hint: "Swipe through, tap to open." (`md:hidden`) / "Hover to explore, click to expand." (`hidden md:inline`) |
| 07 | contact | signal | Connect | Contact | ~95 chars |

Rendered eyebrow reads e.g. `01.` + 8px gap + `WORK` (uppercase via CSS).

Generic UI labels (verbatim): nav `Projects`, `Homelab`, `Websites`, `Experience`, `About`, `Photography`, `Contact`; `Resume ↗`; `Open menu` / `Close menu`; footer `Navigation`, `Connect`, `Back to top`, `Open to opportunities`, `© {year} {name}`; contact tile labels `GitHub`, `Email`, `Photography` (mono 12px over a value); sky labels `ursa major`, `cassiopeia` (CSS uppercase).

Metadata shape: title `"<Name> | <Role>"` (~38 chars); description ~170 chars of owner prose (reused for OG and Twitter); image alt ~48 chars describing the room illustration.

---

## 9. Assets

| Asset | Original | Replacement plan |
|---|---|---|
| Fonts | Geist, Geist Mono, Archivo via `next/font/google` | Same (open source, SIL OFL) |
| Icons | lucide-react (`menu`, `x`, `mail`, and others) | Same (ISC) |
| Brand icons (GitHub, LinkedIn, Instagram) | inline 24x24 `fill=currentColor` SVGs | Use a permissively licensed brand icon set (for example simple-icons) or draw simple glyphs |
| Tech logos | devicon SVGs from `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/<name>/<name>-original.svg` via plain `<img>` (React emits `<link rel="preload" as="image">` for the first ten) | Same CDN (MIT) or self-host |
| Star field, moon, constellations, satellites, shooting stars, skyline | generated in code (gradients, divs, tiny SVG primitives) | Rebuild in code from section 3.8 with a seeded generator; draw an original skyline silhouette with the same layer structure, colors and landmark count |
| OG and Twitter image | static `app/opengraph-image.png` and `app/twitter-image.png` (identical, 1200x630 PNG, ~255KB) with `.alt.txt`. Composition: the isometric room illustration centered on a starry navy-to-violet night gradient (edge color about `#06080f`), no text, room occupying roughly the central 60% width | Render an original 1200x630 card: the replacement room art (or a sky + title card) on the same night gradient; keep the `.alt.txt` convention |
| Favicon | `app/favicon.ico`, 256x256, the stock create-next-app icon (black circle, white triangle) | Supply an original favicon (for example a keycap monogram) |
| Resume | `/public/resume.pdf` | Owner supplies their own |
| Room still, photos, previews | owner images (other specs) | Not copied; see those specs |

---

## 10. Implementation plan

### 10.1 Files

```
src/app/layout.tsx          server: fonts, metadata, <html> attrs, inline boot script (optional), body classes
src/app/page.tsx            server: inline view script, <Nav/>, <main>{<RoomSky/>}{<LabHero/>}{<ClassicShell/>}</main>, <Footer/>
src/app/globals.css         @import "tailwindcss"; @theme inline; :root tokens; @layer components {.key*}; unlayered globals (3.7)
src/app/opengraph-image.png + opengraph-image.alt.txt, twitter-image.png + twitter-image.alt.txt, favicon.ico
src/lib/view-store.ts       client module (5.1)
src/lib/cn.ts               clsx + tailwind-merge
src/lib/sky-data.ts         seeded PRNG (mulberry32) + star layer generation, evaluated at module scope on the server
src/components/chrome/Nav.tsx          'use client'
src/components/chrome/Footer.tsx       server
src/components/sky/Sky.tsx             server; variant 'room' | 'classic'
src/components/sky/SkyMotion.tsx       'use client'
src/components/sky/Skyline.tsx         server
src/components/section/SectionShell.tsx    server (section + container)
src/components/section/SectionHeading.tsx  server, renders <BlurFade>
src/components/motion/BlurFade.tsx         'use client'
src/components/cards/MagicCard.tsx         'use client'
```

### 10.2 Fonts (layout)

```ts
import { Geist, Geist_Mono, Archivo } from 'next/font/google';
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const archivo  = Archivo({ variable: '--font-archivo', subsets: ['latin'], axes: ['wdth'] });
// <html lang="en" data-view="classic" suppressHydrationWarning
//   className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}>
// <body className="min-h-full bg-[#080808] text-[#f0f0f0]">
```

All three are variable weight 100 to 900; Archivo exposes `font-stretch` 62% to 125%. Production emits latin, latin-ext and vietnamese faces (Geist also cyrillic; Geist Mono also a symbols range) with only the latin file preloaded, `font-display: swap`, and size-adjusted Arial fallbacks (`size-adjust` 104.76% Geist, 134.59% Geist Mono, 98.7% Archivo). That is the `next/font` default output for `subsets: ['latin']`.

### 10.3 Metadata

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://<your-domain>'),   // original relies on the Vercel production URL fallback
  title: '<Name> | <Role>',
  description: '<~170 chars>',
  openGraph: { title: '<same>', description: '<same>' },
  twitter: { card: 'summary_large_image', title: '<same>', description: '<same>' },
};
```

OG and Twitter images come from the file conventions (they add `og:image` with type, 1200x630, alt; and `twitter:image` likewise). Not present on the original: `og:url`, `og:type`, `og:site_name`, `theme-color`, manifest, apple icon. Viewport is the default `width=device-width, initial-scale=1`.

### 10.4 next.config

Original uses the default image config (deviceSizes `[640, 750, 828, 1080, 1200, 1920, 2048, 3840]`, imageSizes `[32, 48, 64, 96, 128, 256, 384]`, qualities `[75]`, formats `['image/webp']`, no remote patterns). Remote devicons are plain `<img>`, so no `remotePatterns` are needed. The page is fully static (prerendered).

### 10.5 Libraries

`gsap@^3.15` + `@gsap/react` (useGSAP, DrawSVGPlugin, MotionPathPlugin; room only), `motion` (BlurFade and other components), `lucide-react`, `clsx` + `tailwind-merge` (the `cn` helper; add both), Tailwind v4 with `@tailwindcss/postcss`. No analytics scripts.

### 10.6 Gotchas

1. Keep `header { transition: opacity .6s }` unlayered so the background swap stays instant and only the hide fade animates. If you want to "fix" it, note it changes the feel.
2. Use `overflow-clip` on the classic wrapper; `overflow-hidden` kills the sticky sky.
3. Parallax must use the `translate` property, not `transform`, so it composes with keyframe transforms and Tailwind v4 `rotate`/`scale` utilities. Remember the west satellite's path is scaled by `scale-75`.
4. CSS `mod()` needs Chrome 125+, Safari 15.4+, Firefox 118+; keep the `@supports not` fallback.
5. Render the sky as Server Components so the ~200 nodes and ~6KB gradient strings are static HTML; only `SkyMotion` is client. Generate stars with a seeded PRNG so room and classic skies are identical and builds are deterministic.
6. Both skies stay mounted; switch visibility via `html[data-view]` CSS so view changes never remount the sky.
7. `suppressHydrationWarning` on `<html>` is required because the inline script mutates `data-view` and data attributes before hydration.
8. `useSyncExternalStore` server snapshot `null` makes the link list `sm:flex` pre-hydration; replicate if pixel parity before hydration matters.
9. The footer `#hero` link is a no-op in classic view; replicate or deliberately fix (smooth scroll to top).
10. SkyMotion writes vars on every `[data-sky-vars]` element per frame; keep that selector list small.
11. BlurFade SSR output is invisible until hydration; content without JS stays hidden (original behavior).
12. Next.js 16: read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md` and `02-components/font.md` before wiring metadata files and fonts.

---

## 11. Reference screenshots

All under `C:/Users/krisg/AppData/Local/Temp/claude/C--/decae922-eee1-4676-b27b-70265c1bf4af/scratchpad/ref/chrome/`.

| File | Shows |
|---|---|
| `desktop-viewport-top.png` | 1440x900 classic view at scroll 0, transparent header over landing |
| `desktop-header-top.png` | header strip, unscrolled |
| `desktop-header-scrolled.png` | header strip after scroll (85% glass, blur, hairline), Projects active |
| `desktop-header-resume-hover.png` | Resume key hover (lifted 1px, deeper edge) |
| `desktop-header-yg-hover.png` | YG key hover |
| `desktop-header-yg-active.png` | YG key pressed (down 3px, edge gone) |
| `desktop-header-focus.png` | default focus on a nav text link |
| `desktop-header-yg-focus-visible.png` | `.key` focus-visible ring on YG |
| `desktop-header-resume-focus-visible.png` | `.key-light` focus-visible ring on Resume |
| `desktop-nav-hover.png` | nav link hover |
| `desktop-nav-active-experience.png` | scrollspy active link |
| `w640-header.png`, `w768-header.png`, `w1023-header.png`, `w1024-header.png` | header layout at breakpoints |
| `mobile-viewport-top.png` | 390x844 top of page |
| `mobile-menu-open.png`, `mobile-menu-open-top.png` | mobile menu panel open (active item in putty, Resume key at bottom) |
| `mobile-header-scrolled.png` | mobile header scrolled state |
| `tablet-768-menu-open.png` | 768 menu open (no Resume in panel) |
| `sky-isolated-desktop-center.png` | classic sky alone (content hidden), pointer centered |
| `sky-isolated-desktop-pointer-topleft.png`, `sky-isolated-desktop-pointer-bottomright.png` | parallax extremes |
| `sky-isolated-desktop-scroll-25/50/75/100.png` | sky at 25 to 100% scroll (backdrop warming, moon leaving, bottom edge of wrapper) |
| `sky-isolated-mobile.png` | mobile sky alone (Cassiopeia top-left, milky way diagonal) |
| `sky-moon-closeup.png`, `sky-cassiopeia-closeup.png`, `sky-ursa-major-closeup.png`, `sky-satellite-closeup.png` | element closeups |
| `sky-shoot-frame-00..06.png` | shooting star at 3.0, 3.1, 3.2, 3.4, 3.6, 3.8, 4.0s |
| `desktop-bottom-skyline-footer.png`, `desktop-footer-full.png` | end of page: skyline divider and footer, desktop |
| `mobile-bottom-skyline-footer.png` | footer on mobile |
| `desktop-section-heading-projects.png`, `mobile-section-heading-projects.png` | shared section heading |
| `desktop-magiccard-hover.png` | MagicCard spotlight hover |
| `desktop-reduced-motion-top.png` | reduced motion first load (classic, no moving sky) |
| `room-intro-header-hidden.png` | header hidden during room intro |
| `room-view-header.png`, `room-view-full-viewport.png` | header fading out after stepping into the room (zoomed) |
| `mobile-room-view-header.png` | mobile after skip intro |

Probe scripts: `scratchpad/tools/chrome-probe1.mjs` to `chrome-probe9.mjs`, `chrome-stars.mjs`, `chrome-rsc.mjs` (decodes the RSC payload to `tools/chrome-rsc.txt`).

---

## 12. Open questions and uncertainties

* Star generation runs on the server at build time, so the generator and seed are not in the client bundle. Counts, sizes, colors and alpha ranges are measured; the exact random algorithm is unknown (the room code uses mulberry32, which is a reasonable choice).
* The `gradient` keyframe, `#boot-intro` rules, `crt-off`, `boot-caret` and the `yg-boot` key appear to be leftovers from a removed boot screen; they should be safe to drop, but this could not be confirmed against source.
* Motion library version could not be read from the bundle (no version string). The local project pins `motion@^14`; API used is `motion.div` with `whileInView` and `viewport`.
* `metadataBase` is probably unset (absolute OG URLs match the Vercel production URL fallback); this was inferred, not seen in source.
* React 19 image preload hints for the devicons are inferred from `:HL` hints in the RSC payload; the exact React heuristic was not verified.
* Header behavior inside the room beyond the hide rule (for example while `data-lab-focus` toggles) belongs to the room spec and was only spot-checked.
* A faint (about 1/255) horizontal seam can appear where the milky way tile repeats near the bottom of the page; likely a rendering artifact, not intentional.
