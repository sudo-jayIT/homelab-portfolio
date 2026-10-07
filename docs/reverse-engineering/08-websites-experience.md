# 08. Websites (03. Client Work) and Experience (04. Background)

Scope: `section#websites` and `section#experience` of the classic (scrolling) view. Both are React Server Components in the original; the only client code inside them is a `BlurFade` reveal wrapper (motion) and `next/image`. There is no GSAP, no ScrollTrigger, no pinning and no scrubbed choreography in either section (verified in code and by sampling element rects at 15 scroll positions; see section 4).

---

## 1. Overview

Two consecutive, calm, content-forward sections that sit in the middle of the long dark page. "Websites for Business" shows each client site as a wide rounded card: a faux browser window (traffic-light dots, monospace URL pill, 16:10 screenshot) on the left, and on the right a pulsing "LIVE SITE" badge, a condensed ultra-black uppercase title, a monospace meta line, a paragraph, pill tags and a "Visit site ↗" affordance. The entire card is one external link; hovering tints the border with the section accent (sodium orange), slowly zooms the screenshot 3% and nudges the arrow. "Experience" renders each job as a perforated paper ticket: a tinted stub (counter "NO. 01 / 03", a big two-line date range, employment type, a barcode strip) separated by a dashed tear line with semicircular notches, and a body with the role, a monospace "company · location" line and a `›` bullet list. Everything fades up 14px once on entering the viewport, with small per-item stagger.

---

## 2. Structure

Both sections share the page-wide section shell and the shared `SectionHeader`.

### 2.1 Shared section shell

```
section#websites[data-sec="sodium"]   .py-24 md:py-32 px-6 border-t border-white/[0.06]
section#experience[data-sec="beacon"] .py-24 md:py-32 px-6 border-t border-white/[0.06]
└─ div.max-w-6xl.mx-auto                         (max-width 72rem = 1152px, centered)
   ├─ BlurFade.mb-12.md:mb-16                    (SectionHeader, client motion.div)
   │  ├─ p.text-sec.text-xs.font-mono.tracking-[0.2em].uppercase.mb-3
   │  │  ├─ span.opacity-70.mr-2  → "{index}."     e.g. "03."
   │  │  └─ "{kicker}"                              e.g. "Client Work"
   │  ├─ h2.display.sec-title  → "{title}"
   │  └─ p.text-white/65.text-lg.mt-5.max-w-lg  → "{lede}"   (only if lede given; websites has one, experience does not)
   └─ (list, see below)
```

`data-sec` sets `--sec` for everything inside (see 3.1). The sections are direct children of `main > div.relative.z-10.overflow-clip > div.relative`, which also holds the other page sections; the section itself is `position: static` with a transparent background.

### 2.2 Websites list

```
div.space-y-10                                   (40px between cards)
└─ BlurFade (delay = i * 0.08s, no className)    one per site
   └─ a.group.relative.block.rounded-2xl.border.border-white/10.bg-[#0a0d19].overflow-hidden
        .transition-colors.duration-300.hover:border-sec/40
        href={url} target="_blank" rel="noopener noreferrer"
      └─ div.grid.md:grid-cols-2
         ├─ div.p-5.md:p-6                                    (LEFT: browser mockup, always first)
         │  └─ div.rounded-xl.overflow-hidden.border.border-white/10
         │        .shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]
         │     ├─ div.flex.items-center.gap-2.px-3.h-8.bg-white/[0.04].border-b.border-white/[0.06]   (chrome bar)
         │     │  ├─ span.w-2.5.h-2.5.rounded-full.bg-beacon/80
         │     │  ├─ span.w-2.5.h-2.5.rounded-full.bg-sodium/80
         │     │  ├─ span.w-2.5.h-2.5.rounded-full.bg-signal/80
         │     │  └─ span.ml-2.flex-1.truncate.rounded-md.bg-black/30.px-2.py-0.5.text-[10px].font-mono.text-white/50 → "{displayUrl}"
         │     └─ div.relative.aspect-[1400/875].overflow-hidden
         │        └─ next/image fill  alt="{name} website preview"
         │             className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
         │             sizes="(max-width: 768px) 100vw, 50vw"   (loading=lazy, decoding=async, q=75)
         └─ div.flex.flex-col.justify-center.p-6.pt-1.md:p-8.md:pl-2           (RIGHT: text)
            ├─ div.flex.items-center.gap-2.text-sec.text-xs.font-mono.tracking-[0.18em].uppercase.mb-3
            │  ├─ <Globe class="w-3.5 h-3.5" aria-hidden/>        (lucide "globe")
            │  ├─ "Live site"
            │  └─ span.w-1.5.h-1.5.rounded-full.bg-emerald-400.animate-pulse
            ├─ h3.display.text-[2.1rem].leading-[0.95].text-white → "{name}"
            ├─ p.text-white/60.text-sm.font-mono.mt-2.5 → "{category}"   (string already contains " · ")
            ├─ p.text-white/70.text-[0.95rem].leading-relaxed.mt-4 → "{description}"
            ├─ div.flex.flex-wrap.gap-1.5.mt-5
            │  └─ span.text-xs.px-2.5.py-1.rounded-full.bg-white/[0.04].border.border-white/10.text-white/75 → "{tag}"  (per tag)
            └─ span.inline-flex.items-center.gap-1.5.text-sm.font-medium.text-sec.mt-6.group-hover:gap-2.5.transition-all
               ├─ "Visit site"
               └─ <ArrowUpRight size=16 class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden/>
```

Layout is NOT alternating: the mockup is always the first grid cell (left on md+, top on mobile). "Visit site" is a `span`, not a nested link; the whole card is the only link.

### 2.3 Experience list

```
div.space-y-6.md:space-y-8                       (24px / 32px between tickets)
└─ BlurFade (delay = i * 0.1s, no className)     one per entry
   └─ article.ticket
      ├─ div.ticket-stub.flex.items-center.justify-between.gap-4.px-5
      │     .md:flex-col.md:items-start.md:px-6.md:py-7
      │  ├─ p.order-last.shrink-0.font-mono.text-[10px].uppercase.tracking-[0.2em].text-white/40.md:order-none
      │  │  ├─ span.hidden.md:inline → "No. "
      │  │  └─ "{NN} / {TT}"            (1-based index and total, both zero-padded to 2 digits: "01 / 03")
      │  ├─ div.min-w-0
      │  │  ├─ p.display.whitespace-nowrap.text-[clamp(1.15rem,6vw,1.6rem)].text-white.md:text-[2rem]
      │  │  │  ├─ span.md:block → "{start} " + span.text-sec("to")
      │  │  │  ├─ " "
      │  │  │  └─ span.md:block → "{end}"
      │  │  └─ p.mt-1.5.font-mono.text-[10px].uppercase.tracking-[0.2em].text-sec.md:mt-3 → "{type}"
      │  └─ span.ticket-bars.hidden.w-full.md:block  aria-hidden="true"
      └─ div.p-5.pt-6.md:p-8
         ├─ h3.display.text-[1.75rem].leading-[0.95].text-white.md:text-[2.1rem] → "{role}"
         ├─ p.mt-2.5.mb-5.font-mono.text-sm.text-sec → "{company} · {location}"
         └─ ul.space-y-2.5
            └─ li.text-white/65.text-sm.leading-relaxed.flex.gap-3      (per bullet)
               ├─ span.text-sec/70.shrink-0 → "›"
               └─ "{bullet}"
```

`period` is stored as one string `"{start} to {end}"` and split on `" to "` server side (start and end are `Mon YYYY` or the word `Present`). Entries render in data order (not sorted by date).

---

## 3. Styling

### 3.1 Tokens used here

| Token | Value | Use in these sections |
|---|---|---|
| `--sec` (websites, `data-sec="sodium"`) | `var(--sodium)` = `#ff9d3c` | kicker, badge, CTA, card hover border |
| `--sec` (experience, `data-sec="beacon"`) | `var(--beacon)` = `#ff5a87` | kicker, "to", type label, company line, chevrons, stub tint, dashed line |
| `--sec` fallback | `#e6d9b5` | used only if no `data-sec` ancestor |
| `--beacon` / `--sodium` / `--signal` | `#ff5a87` / `#ff9d3c` / `#3ecbff` | traffic-light dots at 80% (fixed, not `--sec`) |
| emerald-400 (Tailwind v4) | `#00d294` (oklch 76.5% 0.177 163.2) | live dot |
| Card / ticket surface | `#0a0d19` | `bg-[#0a0d19]` and `.ticket` background |
| Section title color | `#f7f4ec` | `.sec-title` |
| Card/role titles | `#ffffff` | `text-white` |
| Section divider | `rgba(255,255,255,0.06)` 1px top border | every section except #projects |
| Body text default | `#f0f0f0`, Geist 16px/24px | inherited |

Tailwind v4 theme mapping implied by the compiled CSS (opacity modifiers compile to `color-mix(in oklab, <color> N%, transparent)` with a solid-color fallback outside `@supports`):

```css
@theme inline {
  --color-sec: var(--sec, #e6d9b5);
  --color-beacon: var(--beacon);
  --color-sodium: var(--sodium);
  --color-signal: var(--signal);
  --color-dusk: var(--dusk);
  --font-mono: var(--font-geist-mono);
  --font-sans: var(--font-geist-sans);
}
[data-sec="signal"] { --sec: var(--signal); }
[data-sec="dusk"]   { --sec: var(--dusk); }
[data-sec="beacon"] { --sec: var(--beacon); }
[data-sec="sodium"] { --sec: var(--sodium); }
```

### 3.2 Custom (unlayered) classes

These are written outside Tailwind layers in the original, so they beat utilities of equal specificity. This matters: `.display { line-height: .9 }` overrides `leading-[0.95]` on every h3 here (computed line-height is exactly 0.9 x font-size).

```css
.display {
  font-family: var(--font-archivo), "Arial Narrow", system-ui, sans-serif;
  text-transform: uppercase;
  font-weight: 900;
  font-stretch: 62%;          /* Archivo variable wdth axis, 62 is the axis minimum */
  line-height: 0.9;
}
.sec-title { color: #f7f4ec; font-size: clamp(2.6rem, 13vw, 5.5rem); }
```

Ticket (rewritten, same values):

```css
.ticket {
  --stub: 5.5rem;             /* 88px: stub row height on mobile */
  --notch: 0.7rem;            /* 11.2px notch radius */
  --n1: 0px var(--stub);      /* notch centers: left and right edge, at stub/body boundary */
  --n2: 100% var(--stub);
  display: grid;
  grid-template-rows: var(--stub) 1fr;
  background: #0a0d19;
  border: 1px solid #ffffff1a;
  border-radius: 1rem;
  -webkit-mask-image:
    radial-gradient(circle var(--notch) at var(--n1), transparent 97%, #000),
    radial-gradient(circle var(--notch) at var(--n2), transparent 97%, #000);
          mask-image: (same two gradients);
  -webkit-mask-composite: source-in;
          mask-composite: intersect;
}
.ticket-stub {
  background: color-mix(in srgb, var(--sec, #e6d9b5) 9%, transparent);         /* fallback: var(--sec) solid */
  border-bottom: 2px dashed color-mix(in srgb, var(--sec, #e6d9b5) 55%, transparent);
}
@media (min-width: 768px) {
  .ticket {
    --stub: 13.5rem;          /* 216px stub column */
    --n1: var(--stub) 0px;    /* notch centers: top and bottom edge, on the tear line */
    --n2: var(--stub) 100%;
    grid-template-rows: none;
    grid-template-columns: var(--stub) 1fr;
  }
  .ticket-stub {
    border-bottom: 0;
    border-right: 2px dashed color-mix(in srgb, var(--sec, #e6d9b5) 55%, transparent);
  }
}
.ticket-bars {                /* barcode strip, 13px repeating period */
  opacity: 0.4;
  height: 1.4rem;             /* 22.4px */
  background: repeating-linear-gradient(90deg,
    #fff 0 2px, #0000 2px 5px, #fff 5px 6px, #0000 6px 8px, #fff 8px 11px, #0000 11px 13px);
}
```

Note the stub tint and dash use `color-mix(in srgb, ...)` (computed `color(srgb 1 0.353 0.529 / 0.09)` and `/ 0.55`), while Tailwind opacity utilities use oklab. Mask positions resolve against the border box, so on desktop the notch center sits at x = 216px from the outer left edge, exactly on the 2px dashed line, and each notch also cuts through the 1px outer border (visible gap in the border; see zoom screenshots). In Chrome the stub's tinted background is clipped to the 16px rounded corners even though the article has no `overflow: hidden`.

### 3.3 Measured values: Websites (desktop 1440x900, container 1152px)

| Element | Font | Size / line-height | Weight / tracking / case | Color | Box |
|---|---|---|---|---|---|
| Section | Geist | | | | padding 128px 24px (mobile 96px 24px); height 1368px at 1440 |
| Header block | | | | | margin-bottom 64px (mobile 48px) |
| Kicker `p` | Geist Mono | 12px / 16px | 400, 0.2em = 2.4px, uppercase | `#ff9d3c` | mb 12px |
| Kicker index span | | | | opacity 0.7 | mr 8px; content "03." |
| h2 `.sec-title` | Archivo | 88px / 79.2px (390w: 50.7px / 45.63px) | 900, stretch 62%, uppercase | `#f7f4ec` | |
| Lede | Geist | 18px / 28px | 400 | `rgba(255,255,255,0.65)` | mt 20px, max-width 512px |
| Card `a` | | | | | 1152x412px; radius 16px; 1px `rgba(255,255,255,0.10)`; bg `#0a0d19`; overflow hidden; cursor pointer |
| Card grid | | | | | md: `1fr 1fr` (575px + 575px inside 1px border) |
| Left cell | | | | | padding 24px (mobile 20px) |
| Browser frame | | | | | 527x362px; radius 12px; 1px `rgba(255,255,255,0.10)`; box-shadow `0 20px 50px -20px rgba(0,0,0,0.8)`; overflow hidden |
| Chrome bar | | | | bg `rgba(255,255,255,0.04)` | height 32px; padding 0 12px; gap 8px; border-bottom 1px `rgba(255,255,255,0.06)` |
| Traffic dots | | | | `#ff5a87cc`, `#ff9d3ccc`, `#3ecbffcc` | 10x10px circles, 8px apart (left edges at 12, 30, 48px inside bar) |
| URL pill | Geist Mono | 10px / 15px | 400 | `rgba(255,255,255,0.5)` on `rgba(0,0,0,0.3)` | ml 8px (16px from last dot), padding 2px 8px, radius 6px, height 19px, flex 1, ellipsis truncation |
| Screenshot box | | | | | aspect-ratio 1400/875 (16:10), 525x328px; image `object-fit: cover; object-position: 50% 0%` |
| Right cell | | | | | flex column, justify-content center; padding 32px 32px 32px 8px (mobile 4px 24px 24px) |
| Badge row | Geist Mono | 12px / 16px | 400, 0.18em = 2.16px, uppercase | `#ff9d3c` | flex, gap 8px, mb 12px |
| Globe icon | | 14x14px | stroke 2 | currentColor | |
| Live dot | | 6x6px | | `#00d294` | `animate-pulse` |
| Card h3 | Archivo | 33.6px / 30.24px (all widths) | 900, stretch 62%, uppercase | `#fff` | |
| Meta line | Geist Mono | 14px / 20px | 400 | `rgba(255,255,255,0.6)` | mt 10px |
| Description | Geist | 15.2px / 24.7px (0.95rem, leading 1.625) | 400 | `rgba(255,255,255,0.7)` | mt 16px |
| Tag row | | | | | flex-wrap, gap 6px, mt 20px |
| Tag pill | Geist | 12px / 16px | 400 | `rgba(255,255,255,0.75)` on `rgba(255,255,255,0.04)` | padding 4px 10px, 1px `rgba(255,255,255,0.10)`, fully rounded, height 26px |
| CTA | Geist | 14px / 20px | 500 | `#ff9d3c` | mt 24px; gap 6px (hover 10px); inline-flex, align center |
| CTA arrow | | 16x16px | stroke 2 | currentColor | hover translate 2px, -2px |
| Card list | | | | | 40px between cards; card tops at +0 and +452px |

### 3.4 Measured values: Experience (desktop 1440x900)

| Element | Font | Size / line-height | Weight / tracking / case | Color | Box |
|---|---|---|---|---|---|
| Section | | | | | padding 128px 24px (mobile 96px 24px); height 1251px at 1440 |
| Kicker / h2 | as websites | | | `#ff5a87` kicker | content "04." + "Background"; title "Experience"; no lede |
| Ticket | | | | bg `#0a0d19` | 1152px wide; radius 16px; border 1px `rgba(255,255,255,0.10)`; heights 313 / 234 / 212px (content driven) |
| Stub (md+) | | | | bg `rgba(255,90,135,0.09)` | 216px wide, full ticket height; padding 28px 24px; flex column, `justify-content: space-between`, `align-items: flex-start`, gap 16px; right border 2px dashed `rgba(255,90,135,0.55)` |
| Stub (mobile) | | | | same tint | 88px tall row; padding 0 20px; flex row, `space-between`, `align-items: center`, gap 16px; bottom border 2px dashed |
| Counter | Geist Mono | 10px / 15px | 400, 0.2em = 2px, uppercase | `rgba(255,255,255,0.4)` | md: first item (top); mobile: `order: 9999` (right side), "No. " hidden |
| Date | Archivo | md: 32px / 28.8px; mobile: `clamp(1.15rem, 6vw, 1.6rem)` (23.4px at 390, 25.6px at 640) | 900, stretch 62%, uppercase, `white-space: nowrap` | `#fff`; "to" in `#ff5a87` | md: two lines (both spans `display: block`); mobile: one line |
| Type label | Geist Mono | 10px / 15px | 400, 0.2em, uppercase | `#ff5a87` | mt 12px (mobile 6px); wraps ("INDEPENDENT / CONTRACTOR" breaks onto 2 lines in the 168px stub) |
| Barcode | | 166 x 22.4px | | white at 0.4 opacity | md only (`hidden md:block`), full stub content width, bottom of stub |
| Body | | | | | padding 32px (mobile 24px 20px 20px) |
| Role h3 | Archivo | 33.6px / 30.24px (mobile 28px / 25.2px) | 900, stretch 62%, uppercase | `#fff` | |
| Company line | Geist Mono | 14px / 20px | 400 | `#ff5a87` | margin 10px 0 20px; text `"{company} · {location}"` |
| Bullet list | | | | | 10px between items |
| Bullet `li` | Geist | 14px / 22.75px | 400 | `rgba(255,255,255,0.65)` | flex, gap 12px |
| Chevron "›" | Geist | 14px | 400 | `--sec` at 70% (`color-mix(in oklab, #ff5a87 70%, transparent)`) | shrink-0, top aligned with the first text line |
| Ticket list | | | | | 32px between tickets (mobile 24px) |

### 3.5 Backdrop (context, owned by the page shell)

The sections are transparent. What shows behind them is the page wrapper `div.relative.z-10.overflow-clip` with `linear-gradient(180deg, #06080f 0%, #080b16 30%, #0b0f1d 65%, #121129 88%, #1c1530 100%)` spanning the whole classic page (about 9.7k px tall at 1440), plus a `pointer-events-none fixed inset-0` starfield layer (stars, constellation line art with tiny mono labels, small satellites). Around these two sections the backdrop is roughly `#080b16` to `#0b0f1d`, so the `#0a0d19` cards and tickets read mostly through their 10% white borders and the stub tint. Rebuild the backdrop per the page-shell spec; do not paint a background on these sections.

---

## 4. Animation and timing

### 4.1 BlurFade reveal (the only entrance animation)

Client component wrapping a `motion.div`:

```ts
initial     = { opacity: 0, y: 14 }
whileInView = { opacity: 1, y: 0 }
viewport    = { once: true, amount: 0.15 }      // fires when 15% of the wrapper is visible; never reverses
transition  = reduced ? { duration: 0 } : { duration: 0.5, delay, ease: "easeOut" }   // motion easeOut = cubic-bezier(0, 0, 0.58, 1)
```

| Target | delay |
|---|---|
| SectionHeader (both sections) | 0 |
| Website card i | `i * 0.08` s (0, 0.08) |
| Experience ticket i | `i * 0.1` s (0, 0.1, 0.2) |

Measured: opacity 0.17 at 64ms, 0.53 at 192ms, 0.77 at 301ms, 0.94 at 410ms, 1.0 at about 510ms; translateY 14 to 0 on the same curve. With all three tickets entering at once (2000px tall viewport) the curves start about 100ms apart and finish at about 500, 600 and 700ms. Because each card has its own `whileInView`, in normal scrolling each item usually fires on its own when it crosses the 15% threshold, so the stagger is only visible when several enter in the same frame (jump links, tall screens).

The SSR HTML carries the initial state inline (`style="opacity:0;transform:translateY(14px)"`), so content is invisible until hydration plus intersection.

The reduced-motion flag is read once at mount (`useState(prefersReducedMotion.current)`), so toggling the OS setting mid-session does not affect already-mounted wrappers.

### 4.2 Hover transitions (website card only, `@media (hover: hover)`)

| Target | Property | From to | Duration | Easing |
|---|---|---|---|---|
| Card `a` | `border-color` | `rgba(255,255,255,0.10)` to `color-mix(in oklab, #ff9d3c 40%, transparent)` | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` (`transition-colors duration-300`) |
| Screenshot `img` | `scale` (individual transform property) | 1 to 1.03, origin center | 700ms | `cubic-bezier(0.4, 0, 0.2, 1)` (`transition-transform duration-700`) |
| CTA span | `gap` | 6px to 10px | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` (`transition-all`, default duration) |
| CTA arrow | `translate` | `0 0` to `2px -2px` | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` |

Measured on hover: border reaches its final color at about 330ms; image scale 1.0002 at 22ms, 1.009 at 203ms, 1.021 at 328ms, 1.029 at 584ms, 1.03 at about 705ms; gap 10px by about 180ms. Hover-out reverses with the same durations. The image is clipped by the `overflow-hidden` screenshot box, so the zoom never spills over the chrome bar. Experience tickets have no hover state at all (computed border, transform, shadow and cursor unchanged on hover).

### 4.3 Continuous CSS animation

`animate-pulse` on the 6px live dot (Tailwind default): `animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;` with `@keyframes pulse { 50% { opacity: .5 } }`. Runs forever, also under reduced motion.

### 4.4 GSAP / ScrollTrigger

None in these sections. The page registers GSAP 3.15 with three plugins for other areas, but nothing in `#websites` or `#experience` is pinned, scrubbed or stacked. Verification: ticket rects advance exactly 150px per 150px of scroll across 15 samples from 900px above to 1300px below the section top, `position` stays `static`, wrapper transforms are `none` after reveal; website card rects behave the same and the image `transform` and `object-position` never change with scroll (no parallax, no auto-scrolling screenshot).

---

## 5. Interaction and state

- Website card: a single `<a href={url} target="_blank" rel="noopener noreferrer">` wrapping the whole card. Click, tap, Enter all open the client site in a new tab. Cursor `pointer` over the whole card. No JS handlers, no analytics hooks, no iframe, no lightbox.
- The "Visit site" text and arrow are decorative inside the link; there is no separate button.
- Experience: static. No interactive elements, no expand/collapse, no tabs, nothing focusable.
- Keyboard: Tab order passes through the two website cards in document order (after the previous section's last control, before the About section). Focus styling is the browser default `:focus-visible` ring (Chrome computed `outline: auto 1px; outline-offset: 1px`); no custom focus ring, no hover styles are applied on focus.
- State: none. No localStorage, no URL changes from inside these sections.
- Related page-level behavior (implemented elsewhere, keep ids stable):
  - Nav scroll spy observes `#websites` and `#experience` with `IntersectionObserver({ rootMargin: "-40% 0px -55% 0px", threshold: 0 })`; the matching nav link becomes active when the section crosses the band 40% to 45% from the top of the viewport.
  - Nav anchors `#websites` / `#experience` smooth-scroll via `html { scroll-behavior: smooth }` (`auto` under reduced motion); the hash is stripped with `history.replaceState` 1.5s after load and on every `hashchange`. No `scroll-margin-top`; the section's own 96/128px top padding keeps the kicker clear of the 64px fixed header.
  - In the room view (`html[data-view="room"]`) both sections are `display: none` (`#hero ~ *`). The room has its own monitor overlay (projects plus client sites, with a "client work" divider) and a badge overlay (experience entries with org tabs); those are covered by the room specs, not here. Nav item mapping: Websites goes to room object `monitor`, Experience goes to `badge`.

---

## 6. Responsive behavior

| Width | Websites | Experience |
|---|---|---|
| < 768px (base, includes sm 640) | Section padding 96px 24px; header mb 48px; h2 `clamp(2.6rem,13vw,5.5rem)` (50.7px at 390, 83.2px at 640); card single column, mockup on top (left cell padding 20px), text below (padding 4px 24px 24px); h3 stays 33.6px and wraps to 2 lines; tags wrap to 2 rows; card height about 740px at 390 | Ticket becomes a vertical stack: 88px tinted stub row on top with dashed bottom tear line, notches cut into the left and right edges at y = 88px; stub shows date on one line (`MON YYYY TO PRESENT` form) with type label below it on the left, counter `01 / 03` (no "No.") on the right; barcode hidden; body padding 24px 20px 20px; role 28px; tickets 24px apart |
| >= 768px (md) | Section padding 128px 24px; header mb 64px; h2 88px (already capped at 677px+); card grid `1fr 1fr`, mockup left (padding 24px), text right (padding 32px, left 8px), vertically centered | Ticket becomes horizontal: 216px stub column with dashed right tear line, notches cut into top and bottom edges at x = 216px; stub column stacks counter (with "No. "), two-line date at 32px, type label, barcode; space-between spreads them over the full ticket height; body padding 32px; role 33.6px; tickets 32px apart |
| >= 1200px | Container reaches its 1152px max and centers | same |

No `lg`, `xl` or `min-[1400px]` rules exist in these sections. Measured card grid columns: 359px x 2 at 768, 487px x 2 at 1024, 575px x 2 at 1280 and 1440. Ticket columns: `216px 502px` at 768, `216px 758px` at 1024, `216px 934px` at 1280+.

Coarse pointer / touch: Tailwind v4 wraps every `hover:` and `group-hover:` rule in `@media (hover: hover)`, so touch devices never get the border tint, image zoom or CTA nudge (no sticky hover). Taps navigate directly. Nothing else changes for touch.

---

## 7. Accessibility and reduced motion

- Landmarks and headings: each `section` has an `id`; titles are `h2`; card and role titles are `h3`. Experience entries are `article` elements.
- Website card accessible name is the full concatenated text of the card (URL pill, "LIVE SITE", title, meta, entire description, every tag, "Visit site"), which is verbose for screen readers; there is no "opens in a new tab" hint. Icons are `aria-hidden="true"`; the traffic-light and live-dot spans are empty and unnamed. Image alt is `"{name} website preview"`.
- Experience: `ticket-bars` is `aria-hidden`. The counter is read as text ("No. 01 / 03" on desktop, "01 / 03" on mobile because the "No. " span is `display: none`).
- Contrast risks: 10px mono counter at 40% white and 10px mono type label in `--sec` on the 9% tinted stub; URL pill text at 50% white at 10px.
- Focus: default browser ring only, on the card links.
- Reduced motion (`prefers-reduced-motion: reduce`): BlurFade uses `duration: 0`, so items still start hidden and pop to full opacity in one frame when they enter view (measured opacity 0 to 1 within 13ms). `html` scroll-behavior becomes `auto`. NOT reduced: the live-dot `animate-pulse` keeps running (verified), and the 700ms image hover zoom and other hover transitions are unchanged. An exact copy should keep these; a better-behaved rebuild could add `motion-reduce:animate-none` and `motion-reduce:transition-none`.
- No-JS: the inline `opacity:0` from SSR means both sections are invisible without JavaScript.

---

## 8. Content model

```ts
// Client websites (section #websites). 2 entries.
export interface ClientSite {
  name: string;        // business name, 23 to 30 chars, rendered uppercase via .display
  category: string;    // "{business type} · {City, ST}", 29 to 36 chars, one string with a U+00B7 middle dot
  url: string;         // absolute https URL of the live site (card href)
  displayUrl: string;  // bare domain shown in the URL pill, 16 to 25 chars, no protocol or www
  description: string; // one paragraph, 196 to 270 chars
  tags: string[];      // 4 per site, 3 to 16 chars each (examples of the kind: "Web Design", "Responsive", "SEO", "E-commerce", "Lead Capture")
  preview: string;     // "/previews/<slug>.jpg", a 1400x875 JPEG
}

// Experience (section #experience). 3 entries, rendered in array order.
export interface ExperienceEntry {
  role: string;        // job title, 11 to 43 chars (the longest wraps to 2 lines on md at 1440)
  company: string;     // 15 to 24 chars
  location: string;    // "City, ST", about 11 chars
  period: string;      // "{Mon YYYY} to {Mon YYYY|Present}", 19 to 20 chars; split on " to "
  type: string;        // employment type, 9 to 22 chars, e.g. "Internship", "Part-time", "Independent Contractor"
  bullets: string[];   // 4, 3 and 2 items; 69 to 154 chars each; plain sentences
}

// Shared header
export interface SectionHeaderProps {
  index: string;       // "03", "04" (two-digit section number, printed as "03.")
  kicker: string;      // "Client Work", "Background"
  title: string;       // "Websites for Business", "Experience"
  lede?: string;       // websites only: two short sentences, about 86 chars
}
```

Derived fields: counter `String(i + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0")`; company line `${company} · ${location}`; image alt `${name} website preview`.

Generic UI labels, verbatim (case as authored; CSS uppercases where noted):

| Label | Where | Rendered |
|---|---|---|
| `03.` + `Client Work` | websites kicker | `03. CLIENT WORK` |
| `Websites for Business` | websites h2 | `WEBSITES FOR BUSINESS` |
| `04.` + `Background` | experience kicker | `04. BACKGROUND` |
| `Experience` | experience h2 | `EXPERIENCE` |
| `Live site` | card badge (same for every site) | `LIVE SITE` |
| `Visit site` | card CTA | `Visit site` (not uppercased) + arrow-up-right |
| `No. ` | stub counter prefix, md+ only | `NO. 01 / 03` |
| `to` | date range joiner, accent color | `TO` |
| `Present` | open-ended period end | `PRESENT` |
| `›` | bullet marker (U+203A) | `›` |
| ` · ` | meta separators (U+00B7 with spaces) | `·` |

---

## 9. Assets

| Original | Details | Replacement plan |
|---|---|---|
| Client site screenshots (`/previews/*.jpg`) | 2 JPEGs, 1400x875 (16:10). Each is a straight-on desktop capture of the client site's above-the-fold hero (nav bar at top, headline and primary CTA on the left, hero imagery). Displayed with `next/image fill`, `object-cover object-top`, quality 75, `sizes="(max-width: 768px) 100vw, 50vw"`, lazy; box aspect matches the image so nothing is cropped. No device frame in the image itself; the browser chrome is drawn in HTML. | Capture your own client or demo sites at a 1400x875 viewport (or 2800x1750 for crispness), top of page, no scrollbars or cookie banners, saved to `/public/previews/<slug>.jpg`. Keep 16:10 so `object-top` shows the header. |
| Globe icon | lucide `globe`, 14px, stroke 2 | `lucide-react` `Globe` |
| Arrow icon | lucide `arrow-up-right`, 16px, stroke 2 | `lucide-react` `ArrowUpRight` |
| Barcode | pure CSS gradient | reuse the CSS in 3.2 |
| Fonts | Archivo variable (wdth axis, weight 900 used), Geist, Geist Mono via `next/font` | same families via `next/font/google` (see 10) |

No other images, SVG art or iframes in these sections. Do not reuse the original preview images.

---

## 10. Implementation plan

Recommended files (App Router, Tailwind v4, motion):

| File | Kind | Notes |
|---|---|---|
| `components/ui/blur-fade.tsx` | `"use client"` | `motion.div` with the exact config in 4.1. Read reduced motion once (`const [reduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)` or motion's `useReducedMotion` captured on mount). Props: `className?`, `delay = 0`, `children`. |
| `components/section-header.tsx` | server | Wraps content in `<BlurFade className="mb-12 md:mb-16">`; markup per 2.1. Shared by all numbered sections. |
| `components/sections/websites.tsx` | server | `<section id="websites" data-sec="sodium" className="py-24 md:py-32 px-6 border-t border-white/[0.06]">`, header, `div.space-y-10`, `SITES.map((s, i) => <BlurFade key={s.name} delay={i * 0.08}><SiteCard site={s} /></BlurFade>)`. |
| `components/sections/site-card.tsx` | server | The `<a>` card, `BrowserFrame`, text column. |
| `components/sections/browser-frame.tsx` | server | Chrome bar plus `next/image` in the `aspect-[1400/875]` box. Reusable. |
| `components/sections/experience.tsx` | server | `<section id="experience" data-sec="beacon" ...>`, header, `div.space-y-6 md:space-y-8`, `EXPERIENCE.map((e, i) => <BlurFade key={e.company} delay={i * 0.1}><Ticket entry={e} index={i} total={EXPERIENCE.length} /></BlurFade>)`. |
| `components/sections/ticket.tsx` | server | Splits `period` on `" to "`; pads the counter; markup per 2.3. |
| `lib/content.ts` | data | `SITES: ClientSite[]`, `EXPERIENCE: ExperienceEntry[]`. |
| `app/globals.css` | CSS | `:root` tokens, `@theme inline` mapping (3.1), unlayered `.display`, `.sec-title`, `.ticket`, `.ticket-stub`, `.ticket-bars`, `[data-sec]` rules. |

Gotchas:

1. Keep `.display`, `.sec-title` and the ticket classes unlayered (plain CSS after `@import "tailwindcss"`), not in `@layer components`. Unlayered rules beat Tailwind's `@layer utilities`, which is why `leading-[0.95]` is silently overridden to `line-height: 0.9`. If you layer them, h3 heights change (31.92px vs 30.24px at 33.6px) and the copy drifts.
2. `font-stretch: 62%` only works if Archivo is loaded as the variable font with the `wdth` axis: `Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" })` (no fixed `weight`, so the variable weight axis is included and 900 works). `"Arial Narrow"` is the CSS fallback.
3. The notch mask needs both `-webkit-mask-composite: source-in` and `mask-composite: intersect`, and the custom properties `--n1/--n2` must swap at `md` so the notches move from the side edges (mobile) to the top and bottom edges (desktop).
4. Use `color-mix(in srgb, ...)` for the stub tint and dash (not oklab) and give a solid `var(--sec)` fallback before an `@supports (color: color-mix(in lab, red, red))` block, as the original does.
5. `text-sec`, `bg-sec/10`, `border-sec/40`, `text-sec/70` must resolve through `--sec` so the same components recolor per section; define `--color-sec: var(--sec, #e6d9b5)` in `@theme inline`.
6. Tailwind v4 already emits hover rules inside `@media (hover: hover)`; do not add JS hover logic.
7. Tailwind v4 `scale-*` and `translate-*` use the individual `scale` / `translate` properties, and `transition-transform` transitions `transform, translate, scale, rotate`. Keep it that way so the hover zoom and arrow nudge interpolate.
8. Next 16 `images.qualities` defaults to `[75]`, matching the original `q=75`. Local `/previews/*` needs no remote config.
9. BlurFade renders `opacity:0; transform: translateY(14px)` on the server. If a no-JS fallback is wanted, add one deliberately; an exact copy hides the content until hydration.
10. Do not add GSAP to these sections; the original has none.
11. Keep section ids and `data-sec` values: the nav scroll spy, nav anchors and room mapping depend on them.

---

## 11. Reference screenshots

All under `C:/Users/krisg/AppData/Local/Temp/claude/C--/decae922-eee1-4676-b27b-70265c1bf4af/scratchpad/ref/websites-experience/`.

| File | Shows |
|---|---|
| `websites-1440.png`, `experience-1440.png` | Full section crops at desktop 1440x900, after reveal |
| `websites-390.png`, `experience-390.png` | Full section crops at 390x844, mobile UA with touch |
| `websites-640.png`, `experience-640.png` | sm width (still the mobile layout) |
| `websites-768.png`, `experience-768.png` | md switch point (two-column card, horizontal ticket). The fixed header and stars visible mid-crop in `experience-768.png` are a full-page capture artifact |
| `websites-1024.png`, `experience-1024.png`, `websites-1280.png`, `experience-1280.png` | lg and xl widths (no layout change) |
| `site-card-1440.png`, `site-card-390.png` | Single website card, rest state |
| `site-card-hover-1440.png` | Card hover: sodium 40% border, image at scale 1.03, CTA gap 10px, arrow nudged |
| `site-card-focus-1440.png` | Card focused via Tab (browser default focus ring) |
| `ticket-1440.png`, `ticket-390.png` | Single experience ticket, desktop and mobile |
| `ticket-hover-1440.png` | Ticket under hover (identical to rest; no hover state) |
| `ticket-corner-zoom-1440.png`, `ticket-bottom-notch-zoom-1440.png` | 3x zoom of the stub's rounded corner, dashed tear line and top/bottom semicircle notches cutting the border |
| `reveal-websites-00..05.png` | Viewport frames at about 105, 280, 444, 615, 779, 952ms after jump-scrolling to #websites (fade-up in progress) |
| `reveal-experience-00..05.png` | Same for #experience at about 140, 302, 469, 611, 764, 902ms; frame 00 also shows the starfield backdrop |
| `exp-scroll--900.png`, `exp-scroll--450.png`, `exp-scroll-0.png`, `exp-scroll-450.png`, `exp-scroll-900.png` | Viewport at scroll offsets relative to the #experience top, showing normal flow (no pin) |
| `websites-reduced-1440.png` | Reduced-motion run after reveal |
| `bg-sample-1440.png` | Backdrop color sample next to the section edge |
| `styles-1440.json`, `styles-390.json` | Full computed-style dumps for every element listed in section 3 |
| `hover-1440.json`, `ticket-hover-1440.json`, `focus-1440.json`, `probe2-main.json`, `probe2-bp.json`, `probe2-reduced.json`, `reveal-log.json` | Raw measurement data (hover end states and time series, focus ring, reveal curves, breakpoint grid values, scroll samples) |
| `rsc.txt` | Decoded RSC flight payload (source of the BlurFade delay values) |

Probe scripts: `scratchpad/tools/we-probe.mjs`, `we-probe2.mjs`, `we-reveal.mjs`, `we-focus.mjs`, `we-rsc.mjs`, `we-compact.mjs`.

---

## 12. Open questions / uncertainties

- Rounded-corner clipping of the ticket stub tint relies on the masked, border-radiused article in Chromium (no `overflow: hidden`). Only Chrome was tested; Safari and Firefox might let the tint show past the 16px corners. Adding `overflow: hidden` to `.ticket` should be visually identical and safe.
- The `period` split and counter formatting run in a Server Component that does not ship to the client, so the exact code is inferred from the RSC output: split on `" to "`, zero-pad to 2 digits. Behavior with a period lacking `" to "` is unknown.
- `easeOut` is assumed to be motion's named curve `cubic-bezier(0, 0, 0.58, 1)`; the measured samples fit it closely, but within a few ms of rAF jitter.
- The website card's `next/image` picked a 750w candidate at 1x DPR whose decoded size reported 720x450, while the source is 1400x875; this looks like optimizer behavior and has no visual effect.
- The starfield and page gradient behind these sections are owned by the page-shell spec; the exact star density near these sections was not measured here.
- Contrast ratios were not formally measured; the low-contrast notes in section 7 are visual judgments.
