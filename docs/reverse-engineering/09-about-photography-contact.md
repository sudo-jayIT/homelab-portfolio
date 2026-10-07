# 09. About (05. Story), Photography (06. Creative), Contact (07. Connect), skyline divider and footer

Scope: `section#about`, `section#photography`, `section#contact`, the decorative skyline strip that closes `<main>` after Contact, and the `<footer>` (inside its own `div[data-classic]` wrapper after `<main>`). All three sections are React Server Components in the original. Client code in this area is limited to: the shared `BlurFade` reveal wrapper (motion), `next/image`, one client component `ExpandableGallery` (photo strip, mobile carousel and lightbox, built with motion + `AnimatePresence` + `createPortal`), and the shared `SkyMotion` pointer-parallax driver that feeds the skyline. There is no GSAP and no ScrollTrigger anywhere in this area (verified by code search and by sampling).

All numbers below were measured in headless Chrome at 1440x900 (desktop) and 390x844 (touch, mobile UA) unless stated, after skipping the intro (classic view, `html[data-view="classic"]`).

## 1. Overview

The last three numbered sections of the classic scrolling page continue the dark "night sky" backdrop with the same section shell used everywhere else: a small mono eyebrow in the section's accent color, a huge condensed uppercase title, then content. About is a two-column layout: a rounded portrait card on the left and, on the right, three bio paragraphs, three chip groups (Languages / Stack / Certifications) and two "framed certificate" cards that look like gallery prints hung under a picture lamp. Photography is a horizontal accordion of nine dimmed photo strips that expand on hover (the hovered strip doubles, the others halve, its dark veil lifts), click opens a full-screen black lightbox with prev/next and a counter; on phones it becomes a snap-scrolling carousel with a pill-dot indicator. Contact is a narrower 2x2 grid of quiet glassy link cards that light up in the section accent on hover. The page then ends with a parallax city-skyline silhouette that melts into a near-black footer with a monogram key, nav and social columns, and a pulsing green "Open to opportunities" status.

## 2. Structure

### 2.1 Shared section shell (identical for all three sections)

```
section#<id>[data-sec=<accent>].py-24.md:py-32.px-6.border-t.border-white/[0.06]
└─ div.max-w-6xl.mx-auto            (About, Photography: 1152px)   |  div.max-w-4xl.mx-auto (Contact: 896px)
   ├─ BlurFade.mb-12.md:mb-16       (SectionHeader, client motion.div, delay 0)
   │  ├─ p.text-sec.text-xs.font-mono.tracking-[0.2em].uppercase.mb-3
   │  │  ├─ span.opacity-70.mr-2    "05."   (index + ".")
   │  │  └─ "Story"                 (kicker)
   │  ├─ h2.display.sec-title       "About"
   │  └─ p.text-white/65.text-lg.mt-5.max-w-lg   (optional lede; Photography and Contact only)
   └─ ...section content
```

| Section | id | `data-sec` | `--sec` resolves to | index | kicker | h2 | lede |
|---|---|---|---|---|---|---|---|
| About | `about` | `dusk` | `#a58bff` | `05` | `Story` | `About` | none |
| Photography | `photography` | `sodium` | `#ff9d3c` | `06` | `Creative` | `Photography` | yes (see 2.3) |
| Contact | `contact` | `signal` | `#3ecbff` | `07` | `Connect` | `Contact` | yes, about 97 chars |

Sections have no background of their own; they sit on the classic-view wrapper (`main > div.relative.z-10.overflow-clip`, background `linear-gradient(180deg, #06080f 0%, #080b16 30%, #0b0f1d 65%, #121129 88%, #1c1530 100%)`) and its sticky starfield/constellation layers, which are owned by the page-shell spec. Note the wrapper gradient is at its most purple (`#121129` to `#1c1530`) exactly behind these last sections. The fixed header (`z-50`, 64px tall) overlays the top of each section; sections have `scroll-margin-top: 0` (the 128px top padding keeps the eyebrow clear).

### 2.2 About

```
section#about[data-sec=dusk]
└─ div.max-w-6xl.mx-auto
   ├─ SectionHeader (05 / Story / About)
   └─ div.grid.md:grid-cols-[280px_1fr].gap-12.items-start
      ├─ BlurFade(delay 0.1)
      │  └─ div.relative.aspect-[3/4].rounded-2xl.overflow-hidden.border.border-white/10.group      (portrait card)
      │     ├─ next/image fill  .object-cover.transition-transform.duration-700.group-hover:scale-[1.02]
      │     │     sizes="(max-width: 768px) 100vw, 280px"  loading=lazy
      │     ├─ div.absolute.inset-0.bg-gradient-to-t.from-[#080808]/40.via-transparent.to-transparent.pointer-events-none
      │     └─ div.absolute.bottom-3.left-3.right-3
      │        ├─ p.text-white/90.text-sm.font-medium        (full name)
      │        └─ p.text-white/60.text-xs.font-mono.mt-0.5   (city, state)
      └─ BlurFade(delay 0.2)
         └─ div.space-y-8
            ├─ div.space-y-5.text-white/70.leading-relaxed.text-[1.05rem].max-w-2xl
            │  └─ p x3                                         (bio paragraphs)
            ├─ div.grid.sm:grid-cols-3.gap-6.pt-4             (chip groups)
            │  └─ div (x3, React key = group label)
            │     ├─ p.text-white/50.text-xs.uppercase.tracking-widest.mb-3.font-mono   "Languages" | "Stack" | "Certifications"
            │     └─ div.flex.flex-wrap.gap-1.5
            │        └─ span (chip)  neutral: .text-xs.px-2.5.py-1.rounded-lg.bg-white/[0.04].border.border-white/10.text-white/75
            │                        accent (Certifications group only): .text-xs.px-2.5.py-1.rounded-lg.bg-sec/10.border.border-sec/25.text-sec
            └─ div.grid.gap-x-8.gap-y-12.pt-8.lg:grid-cols-2  (credential cards)
               └─ figure (x2, key = cert id)
                  ├─ div.relative
                  │  ├─ span[aria-hidden].absolute.-inset-x-6.-top-8.bottom-1/3
                  │  │     bg-[radial-gradient(60%_70%_at_50%_0%,rgba(255,240,214,0.14),transparent_70%)]   (picture-lamp wash)
                  │  ├─ span[aria-hidden].absolute.left-[35%].-top-3.h-1.5.w-[30%].rounded-full.bg-[#2b2f33]
                  │  │     shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]                                    (picture-lamp bar)
                  │  └─ a[href=<pdf>][target=_blank][rel="noopener noreferrer"][aria-label="Open <name> certificate (PDF)"]
                  │       .relative.block.bg-[#0c0d0e].p-2.5.shadow-[4px_6px_0_rgba(0,0,0,0.45)].transition-transform.duration-300.hover:-translate-y-1
                  │     └─ span.block.bg-[#e9e6de].p-2                                                       (cream mat)
                  │        └─ next/image width=640 height=494 .h-auto.w-full  sizes="(max-width: 1024px) 90vw, 22rem" alt="<name> certificate"
                  └─ figcaption.mt-5.min-w-0
                     ├─ p.mb-1.5.flex.items-center.gap-1.5.font-mono.text-xs.uppercase.tracking-[0.2em].text-sec
                     │  ├─ lucide BadgeCheck .h-3.5.w-3.5 [aria-hidden]
                     │  └─ "Verified"
                     ├─ p.font-semibold.leading-snug.text-white                 (full credential title)
                     ├─ p.mt-1.text-sm.text-white/60                            "Issued <Mon YYYY> · Valid through <Mon YYYY>"
                     ├─ div.mt-3.flex.flex-wrap.items-center.gap-x-5.gap-y-1.5
                     │  ├─ a[href=<pdf>][target=_blank].inline-flex.items-center.gap-1.5.text-sm.text-sec.transition-colors.hover:text-white
                     │  │     "Certificate " + lucide ExternalLink size=13
                     │  └─ a[href=<issuer verify url>][target=_blank] (same classes)
                     │        "Verify with <Issuer> " + lucide ExternalLink size=13
                     └─ p.mt-2.truncate.font-mono.text-[11px].text-white/55[title=<code>]   "code <32-hex>"
```

There is no avatar circle and no ID-card treatment: the portrait is a plain rounded photo card with a bottom gradient and a two-line caption. Only certifications that have a file and verification data (2 of the 4) get a framed card; the other two appear only as chips.

The figure stacking order is DOM order: lamp wash (absolute, painted first), lamp bar (absolute), then the frame link (`position: relative`, painted above both). The lamp bar sits 12px above the frame top (6px tall, so a 6px gap remains), horizontally centered (left 35%, width 30%). The wash extends 24px beyond each side and 32px above the frame and stops at two-thirds of the frame height, so the top of the frame and the cream mat look lit from above.

### 2.3 Photography

```
section#photography[data-sec=sodium]
└─ div.max-w-6xl.mx-auto
   ├─ SectionHeader (06 / Creative / Photography) with lede:
   │     p.text-white/65.text-lg.mt-5.max-w-lg
   │       "<short first-person line, 26 chars> "
   │       span.md:hidden          "Swipe through, tap to open."
   │       span.hidden.md:inline   "Hover to explore, click to expand."
   ├─ BlurFade(delay 0.1)
   │  └─ ExpandableGallery (client) className="mb-10" images=string[9]
   │     ├─ div.md:hidden                                     (MOBILE CAROUSEL, < 768px)
   │     │  ├─ div[ref].no-scrollbar.relative.-mx-6.flex.snap-x.snap-mandatory.gap-3.overflow-x-auto.px-6.pb-1  onScroll
   │     │  │  └─ button[type=button][aria-label="Open photo N of 9"] x9
   │     │  │       .relative.aspect-[4/5].w-[76vw].max-w-[22rem].shrink-0.snap-center.overflow-hidden.rounded-xl.ring-1.ring-white/10
   │     │  │     └─ next/image fill .object-cover  sizes="(max-width: 768px) 76vw, 22rem"  alt="Photography N"  (lazy)
   │     │  └─ div.mt-4.flex.items-center.justify-between
   │     │     ├─ div[aria-hidden].flex.gap-1.5
   │     │     │  └─ span x9 .h-1.5.rounded-full.transition-all.duration-300 + (active ? .w-5.bg-sec : .w-1.5.bg-white/20)
   │     │     └─ p.font-mono.text-[11px].text-white/45     "01 / 09"   (both zero-padded to 2)
   │     ├─ div.hidden.h-96.w-full.gap-2.md:flex               (DESKTOP ACCORDION STRIP, >= 768px)
   │     │  └─ motion.div.relative.cursor-pointer.overflow-hidden.rounded-xl  style={flex:1} x9
   │     │     ├─ img.w-full.h-full.object-cover  src=<original jpg> alt="Photography N"   (plain <img>, eager)
   │     │     └─ motion.div.absolute.inset-0.bg-black        (veil, animated opacity)
   │     └─ {mounted && createPortal(<AnimatePresence> {open && LIGHTBOX} </AnimatePresence>, document.body)}
   └─ BlurFade(delay 0.2)
      └─ a.key.mt-4[href=<instagram profile>][target=_blank][rel="noopener noreferrer"]
           svg.w-4.h-4 (Instagram glyph, fill currentColor, aria-hidden) + "@<handle> on Instagram"
```

Lightbox (portal child of `<body>`, rendered only while a photo is selected):

```
motion.div.fixed.inset-0.z-[60].flex.items-center.justify-center.p-4.sm:p-10   style={background:#080808}  onClick=close
├─ button[aria-label="Close"].absolute.top-4.right-4.z-10.text-white/70.hover:text-white.transition-colors   onClick=close
│    svg.w-8.h-8 fill=none stroke=currentColor viewBox 0 0 24 24, one path "X" (two diagonals), stroke-width 2, round caps/joins
├─ (images.length > 1) button[aria-label="Previous photo"].absolute.left-2.top-1/2.-translate-y-1/2.z-10.text-white/70.hover:text-white.transition-colors.sm:left-4
│    svg.w-10.h-10 chevron-left (stroke 2, round)           onClick: stopPropagation, i = (i - 1 + n) % n
├─ motion.img[key=i].rounded-xl  src=<original jpg>  alt="Photography N"
│    style={maxWidth:'90vw', maxHeight:'85vh', width:'auto', height:'auto', objectFit:'contain'}   onClick: stopPropagation
├─ (images.length > 1) button[aria-label="Next photo"].absolute.right-2 ... .sm:right-4
│    svg.w-10.h-10 chevron-right                            onClick: stopPropagation, i = (i + 1) % n
└─ div.absolute.bottom-4.left-1/2.-translate-x-1/2.text-white/60.text-xs.font-mono.bg-white/5.border.border-white/10.px-4.py-2.rounded-full
     "3 / 9"   (NOT zero-padded, unlike the mobile counter)
```

### 2.4 Contact

```
section#contact[data-sec=signal]
└─ div.max-w-4xl.mx-auto
   ├─ SectionHeader (07 / Connect / Contact) with lede (about 97 chars, two lines at desktop)
   └─ div.grid.grid-cols-1.sm:grid-cols-2.gap-3
      └─ BlurFade(key=label, delay = i * 0.07) x4      (0, 0.07, 0.14, 0.21)
         └─ a[href][target=_blank][rel="noopener noreferrer"]   (the mailto card has rel but NO target)
              .flex.items-center.gap-4.p-5.rounded-xl.border.border-white/[0.08].bg-white/[0.02]
              .hover:border-sec/40.hover:bg-white/[0.05].transition-all.duration-200.group
            ├─ div.p-2.5.rounded-lg.bg-white/[0.04].group-hover:bg-sec/10.transition-colors.shrink-0
            │  └─ svg.w-5.h-5.text-sec/80.group-hover:text-sec.transition-colors   (brand glyph or lucide Mail)
            └─ div.min-w-0
               ├─ p.text-white/50.text-xs.font-mono.mb-0.5        label
               └─ p.text-white/85.font-medium.text-sm.truncate     handle
```

Display order: GitHub, LinkedIn, Email, Photography (Instagram). The shared data array is ordered differently (email, linkedin, github, instagram), so the section applies its own order. There is no copy-to-clipboard behavior; every card is a plain link.

### 2.5 Skyline divider (last child of the classic wrapper, after Contact, inside `<main>`)

```
div[aria-hidden][data-sky-vars].pointer-events-none.relative.h-32.md:h-44     (128px / 176px)
├─ div.absolute.inset-0.bg-[radial-gradient(70%_100%_at_50%_100%,rgba(140,90,160,0.2),transparent_70%)]   (horizon glow)
├─ svg[viewBox="0 0 1200 150"][preserveAspectRatio="xMidYMax slice"].par-x.absolute.-left-8.top-0.h-full.w-[calc(100%+4rem)]
│     style="--d:7;--s:0"     one path, fill #0c1122                      (far skyline)
└─ svg (same box)  style="--d:17;--s:0"
      path fill #05070d                                                   (near skyline incl. 4 landmark towers)
      rect x78  width 2.2 height 2.8, fill #fcd9a0 opacity .5 (warm) or #dbeafe opacity .4 (cool)   (lit windows)
      circle cx 577 cy 10 r 1.6 fill #fb7185 .sky-blink                 (aircraft beacon on the spire antenna)
```

### 2.6 Footer

```
div[data-classic].relative.z-10  style="background:#05070d"        (sibling AFTER <main>)
└─ footer.border-t.border-white/[0.06].py-14.px-6
   └─ div.max-w-6xl.mx-auto
      ├─ div.grid.grid-cols-1.md:grid-cols-3.gap-12.mb-12
      │  ├─ div
      │  │  ├─ a[href="#hero"][aria-label="Back to top"].key.key-sm.key-icon.mb-4.text-[12px].font-bold.tracking-tight   "<2-letter monogram>"
      │  │  └─ p.text-white/60.text-sm.leading-relaxed.max-w-[220px]     (blurb, about 116 chars)
      │  ├─ div
      │  │  ├─ p.text-white/50.text-xs.uppercase.tracking-widest.font-mono.mb-5   "Navigation"
      │  │  └─ ul.space-y-2.5 > li > a[href="#<id>"].text-white/60.hover:text-white.text-sm.transition-colors
      │  │        Projects, Websites, Experience, About, Photography, Contact   (Homelab is NOT listed)
      │  └─ div
      │     ├─ p (same as above)   "Connect"
      │     └─ ul.space-y-3 > li > a.flex.items-center.gap-2.5.text-white/60.hover:text-white.text-sm.transition-colors.group
      │           svg.w-4.h-4.group-hover:text-putty.transition-colors.shrink-0 + text
      │           order: GitHub (label = username without "@"), "LinkedIn", "Instagram", "Email" (mailto, no target)
      └─ div.pt-6.border-t.border-white/[0.04].flex.flex-col.sm:flex-row.items-center.justify-between.gap-3
         ├─ p.text-white/50.text-xs.font-mono      "© <year> <full name>"
         └─ div.flex.items-center.gap-2
            ├─ span.w-1.5.h-1.5.rounded-full.bg-emerald-400.animate-pulse
            └─ p.text-white/50.text-xs.font-mono   "Open to opportunities"
```

The footer wrapper is outside `<main>`; CSS hides it in room view (`html[data-view="room"] [data-classic] { display:none }`) and during the lab intro (`html[data-lab-intro] footer { visibility:hidden }`).

## 3. Styling

### 3.1 Tokens used in this area

| Token | Value | Use |
|---|---|---|
| `--dusk` | `#a58bff` | About `--sec` |
| `--sodium` | `#ff9d3c` | Photography `--sec` (active carousel dot) |
| `--signal` | `#3ecbff` | Contact `--sec` |
| `--sec` fallback | `#e6d9b5` | used when no `data-sec` ancestor |
| `text-putty` | `#e6d9b5` | footer social icon hover |
| `emerald-400` | `#00d294` (Tailwind v4 `lab(75.0771% -60.7313 19.4147)`) | footer status dot |
| title color | `#f7f4ec` | `.sec-title` |
| body text | `#f0f0f0` | inherited |
| page bg | `#080808` | lightbox backdrop, portrait gradient stop |
| footer bg | `#05070d` | `[data-classic]` wrapper, near skyline fill |

Alpha variants of `--sec` compile to `color-mix(in oklab, var(--sec) N%, transparent)` with a solid `var(--sec)` fallback. White alphas compile to `color-mix(in oklab, #fff N%, transparent)`.

### 3.2 Custom classes used here (unlayered CSS, verbatim values)

```css
[data-sec="signal"] { --sec: var(--signal); }
[data-sec="dusk"]   { --sec: var(--dusk); }
[data-sec="beacon"] { --sec: var(--beacon); }
[data-sec="sodium"] { --sec: var(--sodium); }

.display   { font-family: var(--font-archivo), "Arial Narrow", system-ui, sans-serif; text-transform: uppercase;
             font-weight: 900; font-stretch: 62%; line-height: .9; }
.sec-title { color: #f7f4ec; font-size: clamp(2.6rem, 13vw, 5.5rem); }

.no-scrollbar { scrollbar-width: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }

.par-x { will-change: transform; translate: calc(var(--px, 0) * var(--d, 10) * -1px) 0; }
@media (prefers-reduced-motion: reduce) { .par-x { translate: none; } }

.sky-blink { animation: 2.2s linear infinite sky-blink; }
@keyframes sky-blink { 0%, 86%, to { opacity: .12 } 89%, 95% { opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .sky-blink { animation: none; } }
```

`.key` family (components layer; shared with the header and other sections):

```css
.key { height: 2.75rem; padding: 0 1.25rem; gap: .5rem; display: inline-flex; align-items: center; justify-content: center;
       position: relative; border-radius: 8px; font-family: var(--font-geist-mono), ui-monospace, monospace;
       font-size: 13px; font-weight: 600; white-space: nowrap; user-select: none; color: #ffffffdb;
       background: linear-gradient(#2c3035, #1c1f23);
       box-shadow: inset 0 1px #ffffff1a, 0 3px #0a0b0d, 0 6px 14px #0000008c;
       transition: transform .1s, box-shadow .1s, color .15s; }
.key:hover  { color: #fff; transform: translateY(-1px);
              box-shadow: inset 0 1px #ffffff1a, 0 4px #0a0b0d, 0 8px 18px #0000008c; }
.key:active, .key[aria-pressed="true"] { transform: translateY(3px);
              box-shadow: inset 0 1px #ffffff0f, 0 0 #0a0b0d, 0 1px 3px #00000080; }
.key:focus-visible { outline: 2px solid #efe8d4b3; outline-offset: 3px; }
.key-sm   { height: 2.25rem; padding: 0 .85rem; border-radius: 7px; font-size: 12px; }
.key-icon { width: 2.25rem; padding: 0; }
@media (prefers-reduced-motion: reduce) { .key, .key:hover, .key:active { transition: none; transform: none; } }
```

Note: `.key:hover` is a plain `:hover` (not wrapped in `@media (hover: hover)`), unlike Tailwind v4 `hover:` utilities, which ARE wrapped in `@media (hover: hover)` and so never apply on touch-only devices.

### 3.3 Section shell and header (measured)

| Element | Value |
|---|---|
| section padding | 96px 24px (< 768), 128px 24px (>= 768); border-top 1px white 6% |
| container | max-width 1152px (About, Photography), 896px (Contact); centered |
| header block | margin-bottom 48px (< 768), 64px (>= 768) |
| eyebrow | Geist Mono 12px / 16px, letter-spacing 2.4px (0.2em), uppercase, color `--sec`, margin-bottom 12px |
| eyebrow index span | opacity .7, margin-right 8px, renders "05." |
| h2 | Archivo 900, stretch 62%, uppercase, `#f7f4ec`; 88px / 79.2px at >= 677px viewport; 13vw below (50.7px / 45.63px at 390) |
| lede | Geist 18px / 28px, white 65%, max-width 512px, margin-top 20px |

### 3.4 About (desktop 1440, container 1152)

| Element | Measured |
|---|---|
| section | top 6351, height 1507px (mobile 2808px) |
| grid | `280px 824px`, gap 48px, items-start |
| portrait card | 280 x 373.3 (3:4), radius 16px, border 1px white 10%, overflow hidden |
| portrait gradient | `linear-gradient(to top, rgb(8 8 8 / .4) 0%, transparent 50%, transparent 100%)` |
| caption | inset 12px from bottom/left/right; name Geist 500 14px/20px white 90%; place Geist Mono 12px/16px white 60%, margin-top 2px |
| bio block | width 672 (max-w-2xl), Geist 16.8px / 27.3px (`1.05rem`, leading 1.625), white 70%; paragraph gap 20px; heights 81.8 / 191 / 109.1 |
| column stack | `space-y-8` (32px) between bio, chips and cert grid |
| chip grid | padding-top 16px, `258.656px x3`, gap 24px |
| chip group label | Geist Mono 12px/16px, letter-spacing 1.2px (0.1em), uppercase, white 50%, margin-bottom 12px |
| neutral chip | 12px/16px Geist, padding 4px 10px, height 26px, radius 8px, bg white 4%, border 1px white 10%, text white 75%; wrap gap 6px |
| accent chip | same box; bg `--sec` 10%, border `--sec` 25%, text `--sec` (`#a58bff`) |
| cert grid | padding-top 32px; at >= 1024: `396px 396px`, column gap 32px, row gap 48px |
| frame link | 396 x 313.9, bg `#0c0d0e`, padding 10px, box-shadow `4px 6px 0 0 rgba(0,0,0,.45)` (hard offset, no blur), no radius |
| mat | 376 x 293.9, bg `#e9e6de`, padding 8px, no radius |
| thumbnail | 360 x 277.9 (intrinsic 640x494 declared, source about 1200x927) |
| lamp bar | 118.8 x 6 (30% of figure), left 35%, top -12px, bg `#2b2f33`, radius full, `inset 0 1px 0 rgba(255,255,255,.14)` |
| lamp wash | 444 x 241 (figure +48 wide, from -32px top to 33.33% from bottom), `radial-gradient(60% 70% at 50% 0, rgba(255,240,214,.14), transparent 70%)` |
| figcaption | margin-top 20px, height 124.5 |
| "Verified" row | Geist Mono 12px/16px, letter-spacing 2.4px, uppercase, `--sec`, gap 6px, icon 14x14 (stroke 2), margin-bottom 6px |
| cert title | Geist 600 16px / 22px, `#fff` |
| dates line | 14px/20px, white 60%, margin-top 4px; separator is " · " (U+00B7) |
| link row | margin-top 12px, gap 6px (y) 20px (x); each link 14px/20px, `--sec`, inline-flex gap 6px, icon 13x13 |
| code line | Geist Mono 11px / 16.5px, white 55%, margin-top 8px, single line with ellipsis (`truncate`), full code in `title` |

### 3.5 Photography (desktop 1440)

| Element | Measured |
|---|---|
| section | top 7858, height 960px (mobile 898px) |
| gallery wrapper | margin-bottom 40px |
| strip | 1152 x 384 (`h-96`), flex, gap 8px |
| strip item at rest | 120.9 x 384 each (`flex: 1 1 0%`), radius 12px, overflow hidden, `cursor: pointer` |
| strip item hovered | hovered 362.7px wide (`flex 2`), others 90.7px (`flex .5`) |
| veil | `#000` absolute inset 0; opacity .35 on every item at rest; 0 on the hovered item only |
| Instagram key | `.key` 227.8 x 44, margin-top 16px, icon 16x16, label Geist Mono 600 13px |
| mobile scroller (390) | 390 wide (bleeds 24px each side via `-mx-6`, padding 0 24px 4px), gap 12px, `scroll-snap-type: x mandatory`, hidden scrollbar |
| mobile card | 296.4 x 370.5 at 390 (`76vw`, max 352px, 4:5), radius 12px, ring `0 0 0 1px` white 10%, `snap-align: center` |
| dots row | margin-top 16px, space-between; dots gap 6px; active 20x6 `--sec`; inactive 6x6 white 20%; radius full |
| mobile counter | Geist Mono 11px / 16.5px, white 45% |

Lightbox (1440x900): backdrop solid `#080808` (not translucent), padding 40px (16px below 640). Close button 32x32 at top 16 right 16; prev/next 40x40, vertically centered, 16px from the edges at >= 640 (8px below); idle color white 70%, hover `#fff` (150ms). Image is limited by `max-height: 85vh` on desktop: portrait 4:5 renders 612 x 765, landscape 3:2 renders 1147.5 x 765, square renders 765 x 765; radius 12px. Counter pill 70 x 34 at bottom 16px centered: Geist Mono 12px, white 60%, bg white 5%, border 1px white 10%, padding 8px 16px, radius full. At 390x844: padding 16px, a 4:5 photo renders 351 x 439 (`90vw` limits), prev at left 8px and next at right 8px overlap the photo edges.

### 3.6 Contact (desktop 1440, container 896)

| Element | Measured |
|---|---|
| section | top 8818, height 680px (mobile 783px) |
| grid | >= 640: `442px 442px`, gap 12px; < 640: one column |
| card | 442 x 82, padding 20px, gap 16px, radius 12px, border 1px white 8%, bg white 2%, `transition: all 200ms cubic-bezier(.4,0,.2,1)` |
| icon box | 40 x 40, padding 10px, radius 8px, bg white 4%, transition colors 150ms |
| icon | 20 x 20, color `--sec` at 80% |
| label | Geist Mono 12px/16px, white 50%, margin-bottom 2px |
| handle | Geist 500 14px/20px, white 85%, ellipsis truncation |

### 3.7 Skyline divider

| Item | Value |
|---|---|
| height | 128px (< 768), 176px (>= 768); full viewport width |
| SVG box | `left: -32px; width: calc(100% + 4rem)` (1504px at 1440) so pointer parallax never exposes an edge |
| scaling | `xMidYMax slice`: bottom-anchored, horizontally centered crop. At 390 only roughly x 445..755 of the 1200-unit art is visible, which still shows all four landmark towers |
| horizon glow | `radial-gradient(70% 100% at 50% 100%, rgba(140,90,160,.2), transparent 70%)` |
| far layer | fill `#0c1122`, parallax depth `--d: 7` |
| near layer | fill `#05070d` (same as footer bg, so the silhouette flows into the footer), `--d: 17` |

### 3.8 Footer (desktop 1440)

| Element | Measured |
|---|---|
| wrapper | bg `#05070d`, `position: relative; z-index: 10`; height 432px (mobile 851px) |
| footer | padding 56px 24px, border-top 1px white 6% |
| grid | >= 768: `352px x3` (container 1152), gap 48px, margin-bottom 48px; < 768: one column |
| monogram key | 36 x 36, radius 7px, Geist Mono 700 12px, letter-spacing -0.3px, margin-bottom 16px |
| blurb | 14px / 22.75px, white 60%, max-width 220px |
| column heading | Geist Mono 12px/16px, letter-spacing 1.2px, uppercase, white 50%, margin-bottom 20px |
| nav links | inline, 14px/20px, white 60%, list spacing 10px |
| social links | flex row, gap 10px, 14px/20px, white 60%, list spacing 12px; icon 16x16 |
| bottom row | padding-top 24px, border-top 1px white 4%, gap 12px; row at >= 640, centered column below |
| copyright / status | Geist Mono 12px/16px, white 50% |
| status dot | 6 x 6, `#00d294`, radius full, `animate-pulse` |

## 4. Animation and timing

### 4.1 BlurFade reveal (the only entrance animation in this area)

Despite its name there is no blur. Implementation (client, motion):

```ts
initial={{ opacity: 0, y: 14 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, amount: 0.15 }}
transition={reduced ? { duration: 0 } : { duration: 0.5, delay, ease: 'easeOut' }}   // easeOut = cubic-bezier(0, 0, 0.58, 1)
```

`reduced` is read once on mount from `prefers-reduced-motion`. SSR output carries `style="opacity:0;transform:translateY(14px)"`, so content is hidden until hydrated and in view. Measured (desktop): opacity .283 at 98ms, .600 at 219ms, .844 at 340ms, 1 at about 500ms; y 14 to 0 on the same curve. Each wrapper triggers independently when 15% of ITS OWN box is visible.

| Wrapper | delay (s) |
|---|---|
| SectionHeader (all three) | 0 |
| About portrait card | 0.1 |
| About right column (bio + chips + certs as ONE block, 1079px tall on desktop, about 2000px on mobile) | 0.2 |
| Photography gallery | 0.1 |
| Photography Instagram key | 0.2 |
| Contact cards | 0, 0.07, 0.14, 0.21 (index x 0.07) |

The footer and skyline divider have no entrance animation.

### 4.2 Desktop accordion strip (motion)

| Target | Property | Values | Transition |
|---|---|---|---|
| each strip item | `flex` (motion writes `style.flex = <number>`, browser expands to `<n> 1 0%`) | none hovered: 1; hovered item: 2; every other item: 0.5 | 0.5s, `easeInOut` = cubic-bezier(0.42, 0, 0.58, 1) |
| each veil | `opacity` | `0.35 * (hoveredIndex !== i)`, so .35 or 0 | 0.3s, default ease `easeOut` = cubic-bezier(0, 0, 0.58, 1) |

Measured: hovering item 5 from rest, the hovered flex reaches 1.5 at about 270ms and 2.0 at about 530ms; its veil reaches 0 at about 290ms. Moving directly from one item to another retargets mid-flight from the current values (no reset to 1). Leaving the strip returns everything to flex 1 and veil .35. Veils mount with `initial={{opacity: 0}}` and fade to .35 over 0.3s right after hydration. These motion animations ignore `prefers-reduced-motion` (no `MotionConfig`; verified they still animate with reduced motion on).

### 4.3 Lightbox (motion + AnimatePresence, `mode="sync"`)

| Target | Enter | Exit | Transition |
|---|---|---|---|
| backdrop `motion.div` | opacity 0 to 1 | opacity 1 to 0, then unmount | none specified, so motion default for opacity: 0.3s, cubic-bezier(0.25, 0.1, 0.35, 1) |
| image `motion.img` (keyed by index) | opacity 0 to 1, scale 0.92 to 1 | opacity 1 to 0, scale 1 to 0.92 | 0.25s, `easeOut` cubic-bezier(0, 0, 0.58, 1) |

Measured open: backdrop .44 at 75ms, .79 at 147ms, 1 at about 290ms; image 1/1 at about 250ms. Measured close (backdrop click or X): both fade together; the node is removed at about 310ms.

Prev/next is NOT a crossfade: the `<img>` is keyed by index inside the presence child, so the old image unmounts instantly and the new one plays its enter (opacity 0 to 1, scale .92 to 1, 0.25s). The counter text updates in the same frame.

### 4.4 CSS transitions and hover (all `hover:`/`group-hover:` utilities live inside `@media (hover: hover)`)

| Element | Trigger | Change | Timing |
|---|---|---|---|
| portrait image | card hover | `scale: 1.02` | 700ms cubic-bezier(.4,0,.2,1) (`duration-700`, Tailwind default ease) |
| certificate frame link | hover | `translate: 0 -4px` | 300ms cubic-bezier(.4,0,.2,1) |
| certificate text links | hover | color `--sec` to `#fff` | 150ms |
| Instagram `.key` | hover / active / focus | per 3.2 (lift 1px, press 3px) | transform and shadow .1s, color .15s |
| contact card | hover | border white 8% to `--sec` 40%; bg white 2% to white 5% | `transition-all` 200ms cubic-bezier(.4,0,.2,1) |
| contact icon box | card hover | bg white 4% to `--sec` 10% | 150ms |
| contact icon | card hover | `--sec` 80% to `--sec` 100% | 150ms |
| mobile carousel dot | active index change | width 6px to 20px, color white 20% to `--sec` | `transition-all` 300ms cubic-bezier(.4,0,.2,1) |
| lightbox buttons | hover | white 70% to `#fff` | 150ms |
| footer nav / social links | hover | white 60% to `#fff` | 150ms |
| footer social icon | link hover | color to `#e6d9b5` | 150ms |

### 4.5 Continuous animations

| Element | Animation |
|---|---|
| footer status dot | `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite` (keyframe: 50% opacity .5). Not disabled by reduced motion (verified). |
| skyline beacon | `sky-blink 2.2s linear infinite`: opacity .12 most of the cycle, 1 between 89% and 95%. Disabled by reduced motion. |
| skyline layers | pointer parallax via `.par-x` (below). Disabled by reduced motion. |

### 4.6 Skyline pointer parallax (shared `SkyMotion` driver; documented in full by the page-shell spec)

`SkyMotion` listens to `pointermove` (ignores `pointerType === "touch"`), `scroll` and `pointerleave` on `<html>` (resets target to 0). Target `px = clientX / innerWidth * 2 - 1`, `py = clientY / innerHeight * 2 - 1`. Each rAF tick eases toward the target with `k = 1 - exp(-min(dt, 64) / 160)` (dt in ms, 16 on the first tick), stops when within 0.002, and writes `--px`, `--py` (4 decimals) and `--sy` (scrollY, 1 decimal) to every `[data-sky-vars]` element. On the divider, `.par-x` shifts each layer horizontally by `-px * d` px: the far layer moves up to 7px and the near layer up to 17px, opposite to the pointer. No effect with reduced motion (driver exits early and CSS sets `translate: none`).

### 4.7 GSAP / ScrollTrigger

None in this area.

## 5. Interaction and state

### 5.1 ExpandableGallery state

```ts
const [hovered, setHovered] = useState<number | null>(null)   // desktop strip
const [open, setOpen]       = useState<number | null>(null)   // lightbox index
const [mounted, setMounted] = useState(false)                 // portal only after first open
const [active, setActive]   = useState(0)                     // mobile carousel index
const openAt = (i: number) => { setMounted(true); setOpen(i) }
const close  = () => setOpen(null)
```

- Desktop strip item: `onMouseEnter` sets hovered = i, `onMouseLeave` sets null, `onClick` opens at i. Items are `div`s: not focusable, no role, no key handling.
- Mobile carousel button: `onClick` opens at i. Native horizontal scrolling with mandatory center snapping; touch swipe works natively (verified: a 200px right swipe from 9/9 snapped to 8/9).
- Carousel `onScroll`: `center = scrollLeft + clientWidth / 2`; active = index of the child whose `offsetLeft + offsetWidth / 2` is nearest to center. Drives the dots and the "NN / 09" counter (2-digit padding).
- Lightbox: backdrop click closes; X closes; prev/next wrap around (1 prev goes to 9, 9 next goes to 1; verified); clicks on the image and on the arrow buttons call `stopPropagation` so they do not close.
- Lightbox navigation does not move the mobile carousel (after viewing 9/9 in the lightbox, the carousel still shows 08 / 09).
- NOT implemented (verified): Escape key, arrow keys, swipe inside the lightbox, body scroll lock (the page scrolls under the open lightbox with the wheel), focus move into the dialog, focus trap, focus restore, `role="dialog"`/`aria-modal`. Tab from an open lightbox goes to the header links under it.

### 5.2 Links

| Link | Opens |
|---|---|
| Certificate frame (image) and "Certificate" | the certificate PDF, new tab |
| "Verify with <Issuer>" | the issuer's public verification page, new tab (the code is shown but not passed in the URL) |
| Instagram key, contact cards, footer socials | external profiles, new tab; email links are `mailto:` in the same tab |
| Footer nav | in-page anchors; `html { scroll-behavior: smooth }` (auto under reduced motion). The header component strips the hash afterwards with `history.replaceState` on `hashchange`. |
| Footer monogram key `href="#hero"` | In classic view `#hero` is `display: none`, so the native jump does nothing (verified: scroll position unchanged) and the hash is then stripped. Only the HEADER monogram has a JS handler that scrolls to top. |

### 5.3 Storage, URL, history

Nothing in this area reads or writes `localStorage`, the URL or history (beyond the hash stripping done by the header). No clipboard use.

## 6. Responsive behavior

| Breakpoint | About | Photography | Contact | Footer / divider |
|---|---|---|---|---|
| < 640 (390 measured) | single column; portrait full width (342 x 456); chip groups stacked; cert cards stacked full width (frame 342 x 272) | mobile carousel + dots + "NN / 09"; lede shows "Swipe through, tap to open." | one column of 4 cards (342 x 82) | single column grid; bottom row stacked and centered; divider 128px |
| sm 640 | chip groups become 3 columns (181px each at 640) | still carousel | 2 columns (290px each at 640) | bottom row becomes a row (space-between) |
| md 768 | grid `280px 1fr` (280 + 392 at 768); section padding 128px | desktop accordion strip (`h-96`), lede shows "Hover to explore, click to expand." | unchanged | footer grid 3 columns (208px each at 768); divider 176px |
| lg 1024 | cert cards 2 columns (308px each at 1024, 396px at >= 1280) | unchanged | unchanged | unchanged |
| >= 1280 | container caps at 1152 | strip caps at 1152 | caps at 896 | caps at 1152 |

- `h2` follows `clamp(2.6rem, 13vw, 5.5rem)`: 41.6px floor below 320px, 13vw between, 88px from about 677px.
- Lightbox padding is 16px below 640 and 40px from 640; arrows sit 8px from the edges below 640 and 16px from 640.
- Both gallery variants are always in the DOM (CSS toggles them). The desktop strip uses plain eager `<img>` tags pointing at the 1440px originals, so all nine originals download on every device, including phones where the strip is `display:none`. This is the "9 photos preloaded" effect and also why the lightbox opens instantly.
- Coarse pointer: all Tailwind `hover:`/`group-hover:` effects are skipped on touch (`(hover: hover)` is false on the phone profile; verified). motion's `onMouseEnter` is not media-gated, so on a touch tablet at >= 768 a tap fires mouseenter then click: the strip expands and the lightbox opens; the expanded state can stick after closing until another tap elsewhere. `.key:hover` is not gated either and can stick after a tap.

## 7. Accessibility and reduced motion

- Headings: one `h2` per section; credential titles and contact labels are `p`, not headings.
- Portrait `alt` is the owner's full name; photos use generic alts "Photography N"; cert thumbnails use "<name> certificate"; the cert frame link has `aria-label="Open <name> certificate (PDF)"`.
- Decorative elements are `aria-hidden`: lamp wash and bar, badge icon, external-link icons, brand glyphs, carousel dots, the whole skyline divider.
- Mobile carousel items are real buttons with `aria-label="Open photo N of 9"`. Desktop strip items are non-focusable divs, so keyboard users cannot open the lightbox at >= 768.
- Lightbox buttons have labels ("Close", "Previous photo", "Next photo") but the overlay has no dialog semantics, no Escape, no arrow keys, no focus management and no scroll lock (see 5.1).
- Focus styles: `.key` has a custom 2px `#efe8d4b3` outline at 3px offset; everything else uses the browser default ring (Chrome reports `auto 1px`).
- Reduced motion (`prefers-reduced-motion: reduce`), verified: BlurFade content appears in one frame when in view (still starts hidden); `.key` transitions and transforms removed; skyline parallax and beacon blink off; `html` scroll-behavior `auto`. NOT reduced (verified): strip flex/veil animations, lightbox fades and scale, the 700ms portrait zoom, card hover transitions, the footer `animate-pulse` dot. An exact copy keeps this behavior.
- Optional improvements for a rebuild (deviations from the original, flag before adopting): `role="dialog" aria-modal="true"`, Escape to close, Left/Right arrows to navigate, focus the close button on open and restore focus on close, lock body scroll, make strip items buttons, add `motion-reduce:` variants.

## 8. Content model

```ts
export interface SectionMeta {
  id: 'about' | 'photography' | 'contact';
  accent: 'dusk' | 'sodium' | 'signal';   // data-sec
  index: '05' | '06' | '07';
  kicker: 'Story' | 'Creative' | 'Connect';
  title: 'About' | 'Photography' | 'Contact';
  lede?: string;                          // Photography 26 chars + hint spans; Contact about 97 chars
}

export interface AboutContent {
  portrait: { src: string; alt: string; name: string; location: string };  // name about 13 chars, location about 11 chars ("City, ST")
  bio: [string, string, string];          // about 184, 525, 300 chars
  skillGroups: Array<{
    label: 'Languages' | 'Stack' | 'Certifications';
    tone: 'neutral' | 'accent';           // accent only for Certifications
    items: string[];                      // 6, 6, 4 items; 1 to 16 chars each
  }>;
}

export interface Credential {
  id: string;                             // short lowercase slug
  name: string;                           // short name, used in chips / alt / aria-label (4 to 16 chars)
  full: string;                           // figcaption title (17 to 41 chars)
  issuer: string;                         // used in "Verify with <issuer>" (5 to 8 chars)
  note: string;                           // present in data, not rendered here
  issued?: string;                        // "Mon YYYY"
  validThrough?: string;                  // "Mon YYYY"
  file?: string;                          // PDF path
  thumb?: string;                         // PNG, about 1200 x 927
  verify?: { url: string; code: string }; // code = 32 lowercase hex chars
}
// 4 credentials in data; only the 2 with file + thumb + verify render as framed cards (in data order).

export interface ContactLink {
  key: 'github' | 'linkedin' | 'email' | 'instagram';
  label: 'GitHub' | 'LinkedIn' | 'Email' | 'Photography';
  handle: string;                         // 8 to 22 chars; GitHub and Instagram prefixed with "@"
  href: string;                           // https URL or mailto:
}
// Contact grid order: github, linkedin, email, instagram.
// Footer "Connect" order: github (text = username without "@"), "LinkedIn", "Instagram", "Email".

export interface PhotographyContent {
  images: string[];                       // 9 JPEG paths, originals 1440px wide
  instagram: { handle: string; href: string };
}

export interface FooterContent {
  monogram: string;                       // 2 letters
  blurb: string;                          // about 116 chars, wraps to 4 lines at 220px
  nav: Array<{ href: `#${string}`; label: string }>;   // 6 entries (all sections except Homelab)
  copyrightName: string;
  year: number;                           // rendered "2026"
  status: 'Open to opportunities';
}
```

Generic UI labels (verbatim): `Story`, `Creative`, `Connect`, `About`, `Photography`, `Contact`, `Languages`, `Stack`, `Certifications`, `Verified` (rendered uppercase), `Certificate`, `Verify with <Issuer>`, `Issued <Mon YYYY> · Valid through <Mon YYYY>`, `code <hex>`, `Open <name> certificate (PDF)`, `<name> certificate`, `Swipe through, tap to open.`, `Hover to explore, click to expand.`, `Open photo N of 9`, `Photography N`, `01 / 09` (carousel), `3 / 9` (lightbox), `Close`, `Previous photo`, `Next photo`, `@<handle> on Instagram`, `GitHub`, `LinkedIn`, `Email`, `Instagram`, `Navigation`, `Back to top`, `© <year> <name>`, `Open to opportunities`.

## 9. Assets

| Asset | Original | Replacement plan |
|---|---|---|
| Portrait | `/me.jpg`, 1250 x 833 (3:2 landscape) head-and-shoulders shot against a light wall, cropped by `object-cover` into a 3:4 portrait card (face roughly centered, upper third). Served via `next/image` (`w=640` chosen at 280px). | Own portrait, ideally shot or cropped at 3:4, at least 840 x 1120, subject centered with headroom; bottom 30% should tolerate the dark gradient and caption. |
| Certificate thumbnails (2) | PNG renders of the certificate documents, about 1200 x 927 (landscape about 1.29:1), declared 640 x 494, shown inside the cream mat | Own certificate renders at the same aspect; or a neutral generated placeholder certificate design. Keep `width=640 height=494`. |
| Certificate PDFs (2) | `/certs/*.pdf` | Own PDFs. |
| Photos (9) | JPEG originals, 1440px wide, plain `<img>` in the strip and lightbox; `next/image` in the mobile carousel. Aspects in order: 3:2, 4:5, 4:5, 3:2, 4:5, 4:5, 1:1, 4:5, 4:5 (6 portrait, 2 landscape, 1 square). | Nine original photos with the same aspect mix. At rest each strip column is about 0.31:1 (121 x 384) and expanded about 0.94:1 (363 x 384), both center-cropped, so keep each key subject near the horizontal center. Mobile cards crop to 4:5. Mostly moody, low-key exposures read best under the 35% black veil. |
| Brand glyphs | GitHub, LinkedIn, Instagram filled 24x24 glyphs in the simple-icons style (`fill="currentColor"`), inline SVG | Use the `simple-icons` package (or `react-icons/si`) rendered with `fill="currentColor"` at the same sizes. |
| UI icons | lucide `BadgeCheck` (14px), `ExternalLink` (13px), `Mail` (20px / 16px), stroke 2; lightbox X / chevrons are hand-written 24-unit stroke-2 paths (`M6 18L18 6M6 6l12 12`, `M15 19l-7-7 7-7`, `M9 5l7 7-7 7`) | `lucide-react` `BadgeCheck`, `ExternalLink`, `Mail`, `X`, `ChevronLeft`, `ChevronRight` (visually equivalent). |
| Skyline art | Code-drawn SVG, see below | Draw original silhouettes to the same plan. |

Skyline composition plan (viewBox 0 0 1200 150, ground at y = 150, everything is flat-filled; z-order: glow, far path, near path, windows, beacon):

- Far layer (`#0c1122`): a continuous row of about 37 rectangular blocks spanning x = -10 to about 1236, widths 18 to 47 units, roof heights between y = 83 and y = 120, occasional 4-unit gaps between blocks, one gabled roof (11-unit peak) near x = 1036 to 1078.
- Near layer (`#05070d`), center landmarks (these are what survive the mobile crop):
  - a slim tower x 470 to 500, top at y 58 with a shallow dome (curve peaking near y 48);
  - the tallest tower x 560 to 594, gabled top peaking at y 26, with a 1.4-unit antenna from y 27 up to y 10; the beacon circle sits at its tip (577, 10);
  - a building x 652 to 688, top y 54 with two small 6-unit crenellations rising to y 48;
  - a tower x 770 to 800 with a gabled top peaking at y 41.
- Near layer, foreground row: about 38 low blocks spanning x = -10 to about 1215, widths 18 to 48, roofs between y = 101 and y = 134, four of them with small gabled roofs (11-unit peaks). Generated procedurally on the server with a seeded RNG (float coordinates), so the output is stable between SSR and hydration.
- Windows: 78 rects of 2.2 x 2.8 units. About 33 sit on the landmark towers on a 6-unit column grid and 7-unit row grid; about 45 are scattered over the foreground row. Roughly two thirds warm (`#fcd9a0`, opacity .5), one third cool (`#dbeafe`, opacity .4).

## 10. Implementation plan

| File | Kind | Notes |
|---|---|---|
| `components/blur-fade.tsx` | client | `motion.div` with the exact config in 4.1; read reduced motion once (`useReducedMotion()` from motion is equivalent). Shared with all sections. |
| `components/section-header.tsx` | server | Markup per 2.1; shared. |
| `components/sections/about.tsx` | server | Portrait card, bio, `SkillGroups`, `CredentialFrame` (pure CSS hover, no client code). |
| `components/credential-frame.tsx` | server | figure per 2.2; lamp wash + lamp bar + frame + mat + caption; filter credentials to those with `file && thumb && verify`. |
| `components/sections/photography.tsx` | server | Header with responsive hint spans, `<BlurFade delay={0.1}><ExpandableGallery className="mb-10" images={...} /></BlurFade>`, `<BlurFade delay={0.2}>` Instagram `.key`. |
| `components/expandable-gallery.tsx` | client | State per 5.1. Sub-parts: `MobileCarousel` (native scroll-snap + nearest-center index), `AccordionStrip` (motion `animate={{ flex }}` with `{ duration: 0.5, ease: 'easeInOut' }`, veil `animate={{ opacity }}` with `{ duration: 0.3 }`), `Lightbox` (`createPortal` into `document.body` only after first open; `<AnimatePresence>` with the overlay `motion.div` as its only direct child; `motion.img key={index}`). |
| `components/sections/contact.tsx` | server | Ordered list (github, linkedin, email, instagram) mapped to `BlurFade delay={i * 0.07}` cards. |
| `components/skyline-divider.tsx` | server | Deterministic generator (seeded PRNG) producing the far and near paths, windows and beacon; `data-sky-vars` + `.par-x` with `--d` 7 and 17. |
| `components/sky-motion.tsx` | client | Shared driver (owned by the page-shell spec); must include the divider via `[data-sky-vars]`. |
| `components/site-footer.tsx` | server | Rendered after `<main>` inside `div[data-classic].relative.z-10` with background `#05070d`. |
| `app/globals.css` | CSS | `[data-sec]` mapping, `.display`, `.sec-title`, `.key*`, `.no-scrollbar`, `.par-x`, `.sky-blink` + keyframes, reduced-motion blocks (3.2). |

Gotchas:

- Tailwind v4 wraps `hover:` and `group-hover:` in `@media (hover: hover)`; write the `.key` hover as plain CSS to match the original's ungated behavior.
- Use `--sec` driven utilities (`text-sec`, `bg-sec/10`, `border-sec/25`, `border-sec/40`, `text-sec/80`) defined via `@theme inline { --color-sec: var(--sec, #e6d9b5); }` so `/alpha` compiles to `color-mix(in oklab, ...)`. Define `--color-putty: #e6d9b5`.
- motion animates `flex` as a bare number; keep `style={{ flex: 1 }}` as the initial inline value so SSR matches. The strip needs `min-width: 0` behavior from `flex-basis: 0%` (that is what the number shorthand yields), otherwise wide images will block shrinking.
- Keep the strip images as eager plain `<img>` (or `next/image` with `unoptimized` and `loading="eager"`) to reproduce instant lightbox opening; the lightbox shows the same original URL.
- The lightbox image must be keyed by index and must not be a direct child of `AnimatePresence`, or prev/next would become a crossfade (the original swaps instantly then plays the enter).
- Mount the portal lazily (`mounted` flag set on first open) to avoid hydration mismatch and `document` access during SSR.
- The About right column is a single BlurFade; on phones it only reveals after about 300px of it is visible (15% of about 2000px). Keep this, or the reveal cadence will differ.
- `figcaption` needs `min-w-0` for the code line `truncate` to work inside the grid.
- The footer monogram `href="#hero"` is a dead link in classic view in the original. For an exact copy keep `href="#hero"`; if the build team wants it to work, add the header's handler (`preventDefault` + `scrollTo({ top: 0, behavior: 'smooth' })`) and note the deviation.
- The skyline near color must equal the footer background (`#05070d`) and the divider must be the last child inside the gradient wrapper, directly followed by the footer wrapper, so the silhouette appears to sit on the footer.

## 11. Reference screenshots

All under `C:/Users/krisg/AppData/Local/Temp/claude/C--/decae922-eee1-4676-b27b-70265c1bf4af/scratchpad/ref/about-photo-contact/`:

| File | Shows |
|---|---|
| `d-about-top.png` | Desktop viewport at the top of About (header, portrait card, bio, chip groups) |
| `d1440-about.png` | Full About section element, desktop (fixed header overlaps mid-image) |
| `d1440-photography.png` | Full Photography section, strip at rest |
| `d1440-contact.png` | Full Contact section |
| `d1440-divider.png` | Skyline divider, desktop |
| `d1440-footer.png` | Footer, desktop |
| `d-gallery-rest.png` | Strip at rest, viewport |
| `d-gallery-hover-1st.png`, `d-gallery-hover-5th.png`, `d-gallery-hover-9th.png` | Strip with the first, fifth and last item expanded |
| `d-gallery-hover-frame-00..05.png` | Strip frames about 150ms apart while expanding the 7th item |
| `d-lightbox-open.png` | Lightbox with a 4:5 photo, desktop |
| `d-lightbox-open-frame-00..03.png` | Lightbox open sequence frames |
| `d-lightbox-landscape.png` | Lightbox with a 3:2 photo |
| `d-lightbox-next-hover.png`, `d-lightbox-after-next.png` | Next button hover; state after next |
| `d-contact-card-hover.png` | Contact grid with the first card hovered |
| `d-contact-card-focus.png` | Contact grid with keyboard focus on the first card |
| `d-cert-hover.png` | Credential cards, first frame hovered (lifted 4px) |
| `d-profile-hover.png` | Portrait card hovered (image scaled 1.02) |
| `d-ig-key-hover.png` | Instagram key hover |
| `d-footer-hover.png` | Footer with a nav link hovered |
| `d-after-footer-yg.png` | Viewport after clicking the footer monogram (unchanged scroll) |
| `m390-about.png`, `m390-photography.png`, `m390-contact.png`, `m390-divider.png`, `m390-footer.png` | Full section elements at 390 (touch) |
| `m-about-viewport.png`, `m-about-certs-viewport.png`, `m-photo-viewport.png`, `m-contact-viewport.png`, `m-footer-viewport.png` | Mobile viewports |
| `m-carousel-item3.png`, `m-carousel-item9.png` | Carousel snapped to item 3 and item 9 (dot and counter states) |
| `m-lightbox.png` | Lightbox on mobile (16px padding, arrows over the image edges) |
| `t768-about.png`, `t768-photography.png`, `t1024-about.png`, `t1024-photography.png` | Tablet breakpoints |
| `styles-d1440.json`, `styles-m390.json` | Computed-style dumps for every element listed in this spec |
| `interact-desktop.json`, `hover-desktop.json`, `lightbox-desktop.json`, `mobile-breakpoints.json`, `reduced-motion.json` | Raw timing samples and state checks behind sections 4 to 7 |

Probe scripts: `scratchpad/tools/apc-*.mjs`.

## 12. Open questions / uncertainties

- Copyright year: rendered as a static "2026" in the RSC payload; could not tell whether it comes from `new Date().getFullYear()` at build/request time or a constant. Using `new Date().getFullYear()` in a server component should behave the same.
- Skyline generator: the paths are produced server-side and the generator is not in the client bundle, so the exact algorithm and seed are unknown; the composition in section 9 is reconstructed from the rendered output.
- The "Certifications" chip labels are partly different strings from the credential `name` fields (one chip uses a longer label), so the chip list is probably a separate constant; the rebuild can keep chips as their own array.
- Touch tablets at >= 768: the sticky-expanded strip after a tap is inferred from motion's event model, not tested on a real device.
- Lightbox timings were sampled with rAF in headless Chrome; the first frame lands about 15 to 40ms after the click because of React commit time, so the measured curves are offset by that amount relative to the configured durations (which come from the code and are authoritative).
- The footer monogram link not scrolling is verified in classic view on desktop; behavior in room view is moot because the footer is hidden there.
