# 06: Projects section (`section#projects`, "01. WORK / PROJECTS")

## 1. Overview

The Projects section is the first content section after the landing hero. It is a section header (mono eyebrow "01. WORK" in the section accent color, then a huge condensed uppercase "PROJECTS" title), followed by a 2-column grid of 4 equal-height project cards (single column below 768px). Each card has a fixed-height preview strip on top (a website screenshot cropped from the top, fading into the card color, or a dotted "screenshot coming soon" placeholder), then a body with a condensed uppercase title, a small external-link icon, a muted description, and a row of pill-shaped tech chips (devicon logo chips for known technologies, accent-tinted text chips for everything else). Cards reveal with a short fade-up as they scroll into view, staggered 80ms per card. On hover a card's border turns accent-blue, a soft accent spotlight follows the cursor across the card, and the screenshot slowly zooms to 105% when the pointer is over the preview strip. The section has no background of its own: it sits on the page-wide night-sky backdrop (stars, constellations, moon), which shows through between and around the cards.

The section is a React Server Component; only `BlurFade` (reveal), `MagicCard` (hover spotlight), `next/image` and the lucide `Icon` base are client components. No GSAP or ScrollTrigger is used in this section.

## 2. Structure

Position in page: inside the sky wrapper `div.relative.z-10.overflow-clip > div.relative`, as the 2nd child right after the landing hero `section.relative.flex.min-h-[86svh]...`. It is the only content section WITHOUT `border-t border-white/[0.06]` (every later section has it).

```
section#projects  [data-sec="signal"]  .py-24 md:py-32 px-6
└─ div.max-w-6xl.mx-auto
   ├─ BlurFade (motion.div)  .mb-12 md:mb-16           // SectionHeader, delay 0
   │  ├─ p.text-sec.text-xs.font-mono.tracking-[0.2em].uppercase.mb-3
   │  │  ├─ span.opacity-70.mr-2   → "01" + "."
   │  │  └─ "Work"                  (text node)
   │  └─ h2.display.sec-title      → "Projects"
   │     (no lede paragraph for this section; SectionHeader supports an optional
   │      `p.text-white/65.text-lg.mt-5.max-w-lg` lede used by other sections)
   └─ div.grid.grid-cols-1.md:grid-cols-2.gap-x-6.gap-y-8
      └─ ×4  BlurFade (motion.div)  .h-full   key=name  delay = index * 0.08
            └─ MagicCard  (div)  .relative.overflow-hidden.rounded-xl.border.border-white/10.p-6
               .transition-colors.duration-300  + (hovered ? .border-sec/40)
               + passed className ".h-full !p-0 overflow-hidden flex flex-col"
               style.background = "#0a0d19" | spotlight gradient (see 4/5)
               ├─ a.block.relative.w-full.overflow-hidden.group.shrink-0
               │    href=link target=_blank rel="noopener noreferrer" tabIndex=-1 aria-hidden=true
               │  └─ PREVIEW FRAME, one of:
               │     (A) screenshot:
               │       div.relative.w-full.h-44.md:h-48.border-b.border-white/[0.06]
               │       ├─ next/image fill  .object-cover.object-top.transition-transform.duration-500
               │       │    .group-hover:scale-105   alt="<name> preview"
               │       │    sizes="(max-width: 768px) 100vw, 50vw"  (lazy, decoding async, q=75)
               │       └─ div.absolute.inset-0.bg-gradient-to-b.from-transparent.to-[#0a0d19]
               │     (B) placeholder (preview === null):
               │       div.relative.w-full.h-44.md:h-48.dot-grid.bg-[#080b14]
               │          .flex.flex-col.items-center.justify-center.gap-2.border-b.border-white/[0.06]
               │       ├─ lucide SquareTerminal  .w-6.h-6.text-sec/50  aria-hidden
               │       ├─ p.font-mono.text-[11px].text-white/50   → "./previews/" + placeholderFile
               │       └─ p.font-mono.text-[10px].tracking-widest.uppercase.text-sec/60
               │            → "screenshot coming soon"
               └─ div.flex.flex-col.flex-1.p-6                       // card body
                  ├─ div.flex.items-start.justify-between.mb-3
                  │  ├─ h3.display.text-[1.7rem].leading-[0.95].text-white   → name
                  │  └─ a.ml-3.shrink-0.text-white/30.hover:text-sec.transition-colors
                  │       href=link target=_blank rel="noopener noreferrer"
                  │       aria-label="View <name>"
                  │     └─ lucide ExternalLink size=16 (stroke 2, aria-hidden)
                  ├─ p.text-white/60.text-sm.leading-relaxed.flex-1.mb-5   → description
                  └─ div.flex.flex-wrap.gap-1.5
                     └─ ×stack.length, in data order, one of:
                        (icon chip, tech has a devicon mapping)
                        span.inline-flex.items-center.gap-1.5.text-xs.px-2.py-1.rounded-full
                            .bg-white/[0.04].text-white/75.border.border-white/10
                        ├─ img.w-3.5.h-3.5  src=devicon URL  alt=""
                        └─ "<tech>"
                        (accent chip, no mapping)
                        span.inline-flex.items-center.text-xs.px-2.5.py-1.rounded-full
                            .bg-sec/10.text-sec.border.border-sec/20
                        └─ "<tech>"
```

Notes on structure:
- Equal card heights per grid row come from the chain: grid items stretch, `BlurFade.h-full` then `MagicCard.h-full`, `flex flex-col`, body `flex-1`, description `flex-1`. The result: in a row, the shorter card's description grows and its chip row is pushed to the card bottom, so chip rows align at the bottom across the row.
- The preview link duplicates the title link but is removed from tab order and the accessibility tree.
- `MagicCard` has a built-in `p-6`, overridden by `!p-0` (Tailwind v4 important modifier, compiled as `padding: 0 !important`). Padding is reapplied on the body only.

## 3. Styling

### 3.1 Section accent

`[data-sec="signal"] { --sec: var(--signal); }` so `--sec = #3ecbff` inside this section. All `*-sec` utilities resolve to `var(--sec, #e6d9b5)` (the fallback is the putty color) mixed with `color-mix(in oklab, ... N%, transparent)` for alpha variants. Without `color-mix` support the compiled fallback is the FULL color (Tailwind v4 behavior), not a translucent one.

### 3.2 Section and header

| Element | Property | Value |
|---|---|---|
| section | padding | 96px 24px (`py-24 px-6`); md+: 128px 24px (`md:py-32`) |
| section | background | transparent (sky backdrop shows through) |
| container | max-width | 72rem = 1152px, centered (`max-w-6xl mx-auto`) |
| header wrapper | margin-bottom | 48px; md+: 64px |
| eyebrow `p` | font | Geist Mono, 12px / 16px line-height, weight 400 |
| eyebrow | letter-spacing | 0.2em = 2.4px; `text-transform: uppercase` |
| eyebrow | color | `var(--sec)` = #3ecbff; margin-bottom 12px |
| eyebrow index span | opacity 0.7; margin-right 8px; content "01." |
| h2 `.display.sec-title` | font-family | `var(--font-archivo), "Arial Narrow", system-ui, sans-serif` (Archivo variable) |
| h2 | weight / stretch | 900 / `font-stretch: 62%` (narrowest wdth) |
| h2 | size | `clamp(2.6rem, 13vw, 5.5rem)`: 50.7px at 390w, 83.2px at 640w, 88px from 677w up |
| h2 | line-height | 0.9 (79.2px at 88px) |
| h2 | color | #f7f4ec; uppercase; letter-spacing normal |

Rendered header height at desktop: 107.2px (16 + 12 + 79.2).

### 3.3 Grid and card

| Element | Property | Value |
|---|---|---|
| grid | columns | 1 col; md+ (>=768px): `repeat(2, minmax(0,1fr))` |
| grid | gap | row 32px, column 24px |
| card | background | `#0a0d19` (inline style) |
| card | border | 1px solid rgba(255,255,255,0.10); hovered: `color-mix(in oklab, #3ecbff 40%, transparent)` |
| card | radius | 12px (`rounded-xl`), `overflow: hidden` |
| card | shadow | none |
| card | transition | color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, gradient vars: 300ms `cubic-bezier(0.4, 0, 0.2, 1)` |
| card size, 1440w | 564 x 392.7px (all four equal) |
| card size, 1024w | 476 x 415.5px |
| card size, 768w | 348px wide; row 1 494.7px tall, row 2 462.7px |
| card size, 390w | 342px wide; heights 478.7 / 454.2 / 501.4 / 431.5px (content driven) |

### 3.4 Preview frame

| Element | Property | Value |
|---|---|---|
| media link | `display:block; position:relative; width:100%; overflow:hidden; flex-shrink:0; cursor:pointer` |
| frame | height | 176px (`h-44`); md+: 192px (`h-48`); box-sizing border-box, so image area is 175/191px |
| frame | border-bottom | 1px solid rgba(255,255,255,0.06) |
| image | fit | `object-fit: cover; object-position: 50% 0%` (top aligned); `position:absolute; inset:0; width/height 100%` |
| image | transition | transform, translate, scale, rotate: 500ms `cubic-bezier(0.4, 0, 0.2, 1)` |
| overlay | background | `linear-gradient(to bottom in oklab, transparent 0%, #0a0d19 100%)` over the full frame |
| placeholder frame | background-color | #080b14 |
| placeholder frame | `.dot-grid` | `background-image: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px); background-size: 28px 28px` |
| placeholder frame | layout | flex column, centered both axes, gap 8px |
| placeholder icon | lucide SquareTerminal, 24x24, stroke 2, color `color-mix(in oklab, #3ecbff 50%, transparent)` |
| placeholder caption | Geist Mono 11px / 16.5px, color rgba(255,255,255,0.5), normal case, no tracking |
| placeholder label | Geist Mono 10px / 15px, letter-spacing 0.1em (1px), uppercase, color `color-mix(in oklab, #3ecbff 60%, transparent)` |

Visible crop of a 16:10 screenshot (image scaled to frame width, top aligned): 1440w frame 562x191 shows the top 54% of the image; 1024w (474x191) shows 65%; 768w (346x191) shows 89%; 390w (340x175) shows 83%. The gradient overlay darkens the lower part so the bottom edge melts into the card.

### 3.5 Card body

| Element | Property | Value |
|---|---|---|
| body | padding 24px; flex column; `flex: 1` |
| title row | flex, `align-items: flex-start`, `justify-content: space-between`, margin-bottom 12px |
| h3 `.display` | Archivo 900, `font-stretch: 62%`, uppercase, 1.7rem = 27.2px, color #ffffff |
| h3 | line-height | 24.48px (= 0.9). The `leading-[0.95]` utility LOSES to the unlayered `.display { line-height: 0.9 }` rule (see gotchas). One line = 24.5px, two lines = 48.9px |
| ext link | 16x16 box, margin-left 12px, `flex-shrink:0`, color rgba(255,255,255,0.3); hover `#3ecbff`; transition color etc. 150ms `cubic-bezier(0.4,0,0.2,1)` |
| ext icon | lucide ExternalLink, 16px, stroke-width 2, round caps/joins |
| description | Geist 14px, line-height 1.625 (22.75px), color rgba(255,255,255,0.6), `flex:1`, margin-bottom 20px |
| chip row | flex wrap, gap 6px (both axes); one row = 26px, two rows = 58px |

### 3.6 Tech chips

| Variant | Box | Text | Background | Border |
|---|---|---|---|---|
| Icon chip (devicon mapped) | inline-flex, centered, gap 6px, padding 4px 8px, height 26px, radius 9999px | Geist 12px / 16px, rgba(255,255,255,0.75) | rgba(255,255,255,0.04) | 1px rgba(255,255,255,0.10) |
| Accent chip (unmapped) | inline-flex, centered, padding 4px 10px, height 26px, radius 9999px | Geist 12px / 16px, #3ecbff | `color-mix(in oklab, #3ecbff 10%, transparent)` | 1px `color-mix(in oklab, #3ecbff 20%, transparent)` |

Icon: plain `<img>` 14x14 (`w-3.5 h-3.5`), `alt=""`, no width/height attributes, no lazy loading, full-color devicon "original" variant. Chips have no hover, no transition, no cursor change. Chip order follows the data array (no sorting); in the current data the mapped techs happen to come first.

Measured chip widths at 1440w (for layout checking): icon chips 62 to 101px, accent chips 45 to 84px.

### 3.7 Tokens used

`--background #080808`, `--foreground #f0f0f0`, `--signal #3ecbff` (as `--sec`), card surface `#0a0d19`, placeholder surface `#080b14`, title cream `#f7f4ec`, putty fallback `#e6d9b5`. Fonts: `--font-geist-sans` (body, chips), `--font-geist-mono` (eyebrow, placeholder text), `--font-archivo` (h2, h3). `html` has `antialiased` (`-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale`). `::selection { background: #e6d9b54d }`.

### 3.8 Backdrop context (owned by the page backdrop spec)

Behind the section: the sky wrapper `div.relative.z-10.overflow-clip` with `background-image: linear-gradient(#06080f 0%, #080b16 30%, #0b0f1d 65%, #121129 88%, #1c1530 100%)` over the full page height, plus a sibling `div.pointer-events-none.absolute.inset-0[aria-hidden]` layer holding stars, labeled constellations and a moon. The projects section adds nothing to this; it simply must stay transparent.

## 4. Animation and timing

No GSAP, no ScrollTrigger, no CSS @keyframes in this section. All motion is the `BlurFade` reveal (motion library) plus CSS transitions.

### 4.1 Scroll reveal (`BlurFade`)

| Target | Trigger | From | To | Duration | Ease | Delay |
|---|---|---|---|---|---|---|
| Section header block | `whileInView`, `viewport: { once: true, amount: 0.15 }` | `opacity 0, y 14px` | `opacity 1, y 0` | 0.5s | motion `"easeOut"` = cubic-bezier(0, 0, 0.58, 1) | 0 |
| Card 1 wrapper | same | same | same | 0.5s | easeOut | 0 |
| Card 2 wrapper | same | same | same | 0.5s | easeOut | 0.08s |
| Card 3 wrapper | same | same | same | 0.5s | easeOut | 0.16s |
| Card 4 wrapper | same | same | same | 0.5s | easeOut | 0.24s |

- Delay formula: `delay = index * 0.08` (seconds), index 0..3. Delays are absolute per card, not relative to when the row appears.
- `amount: 0.15` means each wrapper animates once at least 15% of its own box intersects the viewport (IntersectionObserver threshold 0.15, no root margin). It never reverses.
- Measured on desktop: header and card 1 start together, card 2 trails by about 80ms, all finish after about 500ms plus delay. When row 2 enters, card 3 starts after 160ms and card 4 after 240ms (frames `reveal-00..07.png`).
- On mobile (single column) each card triggers individually when it enters, but still with its fixed delay, so card 4 always waits 240ms after entering.
- The initial state is server-rendered as inline style `opacity:0; transform:translateY(14px)` on each wrapper, so nothing is visible before hydration and IntersectionObserver.
- Reduced motion: transition becomes `{ duration: 0 }` (and drops the delay), so elements snap to visible on intersection. The flag is read once at mount via motion's `prefersReducedMotion` (not live).

Clean reimplementation:

```tsx
'use client';
export function BlurFade({ children, className, delay = 0 }) {
  const [reduced] = useState(() => prefersReducedMotionNow());
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={reduced ? { duration: 0 } : { duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >{children}</motion.div>
  );
}
```

### 4.2 Hover transitions (CSS)

| Target | Trigger | Property | From | To | Duration | Ease |
|---|---|---|---|---|---|---|
| Card | `mouseenter` on card (JS state) | border-color | rgba(255,255,255,0.1) | #3ecbff at 40% | 300ms | cubic-bezier(0.4,0,0.2,1) |
| Card | `mouseenter` / `mousemove` | background (inline) | `#0a0d19` | spotlight gradient (below) | instant (background-image is not transitioned) | n/a |
| Screenshot image | `:hover` on the media link (`.group`), only inside `@media (hover: hover)` | `scale` | 1 | 1.05 (Tailwind v4 uses the `scale` property, not `transform`) | 500ms | cubic-bezier(0.4,0,0.2,1) |
| External-link icon | `:hover` on the link (inside `@media (hover: hover)`) | color | rgba(255,255,255,0.3) | #3ecbff | 150ms | cubic-bezier(0.4,0,0.2,1) |

Measured image scale curve on hover: 1.000 at 0ms, 1.007 at 100ms, 1.033 at 208ms, 1.045 at 319ms, 1.0494 at 426ms, 1.05 at 541ms. Unhover reverses with the same timing. The gradient overlay is a sibling and does not scale, and the link's `overflow:hidden` clips the zoom. The placeholder frame has no image, so nothing zooms there.

Spotlight background while hovered (x, y are pointer coordinates relative to the card's top-left, in px, updated on every `mousemove`):

```
radial-gradient(350px circle at {x}px {y}px,
  color-mix(in srgb, var(--sec, #e6d9b5) 10%, transparent),
  transparent 70%),
#0a0d19
```

The spotlight paints on the card background, so it is only visible through the transparent body area; the opaque screenshot and the opaque placeholder (#080b14) cover it in the preview strip.

## 5. Interaction and state

- `MagicCard` state: `hovered: boolean` (set by `onMouseEnter` / `onMouseLeave`), `pos: {x, y}` (set by `onMouseMove` from `clientX - rect.left`, `clientY - rect.top`). Hovered adds `border-sec/40` and switches the inline background to the spotlight. Leave resets both instantly except the 300ms border transition.
- Clicking the preview strip or the external-link icon opens `link` in a new tab (`target="_blank" rel="noopener noreferrer"`). The title text, description and chips are not links. The rest of the card has the default cursor; the preview strip and icon show `cursor: pointer`.
- No keyboard handlers, no focus management, no URL/history/localStorage effects in this section.
- Related behavior owned by other specs: the landing hero CTA "View projects ↓" (`href="#projects"`) and the nav "Projects" link scroll here using `html { scroll-behavior: smooth }` (no `scroll-padding-top`; the fixed 64px nav overlaps the section's 96/128px top padding, which is fine). The nav clears the URL hash 1500ms after load or hashchange via `history.replaceState`. The nav marks "Projects" active when `#projects` intersects with `rootMargin: "-40% 0px -55% 0px"`. The same PROJECTS data also feeds the terminal `projects` command (name link plus the first 3 stack items) and the lab room's monitor viewer.

## 6. Responsive behavior

| Viewport | Layout | Frame height | Section padding-y | Header mb | h2 size | Notes |
|---|---|---|---|---|---|---|
| < 768px | 1 column, full container width | 176px | 96px | 48px | `13vw` (min 41.6px): 50.7px at 390w | Longer titles wrap to 2 lines; chips wrap to 2 rows; card heights vary per card |
| 640 to 767px | 1 column (sm has no effect here) | 176px | 96px | 48px | 83.2px at 640w, capped 88px from 677w | Card width 592px at 640w, 719px at 767w |
| >= 768px (md) | 2 columns, 24px column gap | 192px | 128px | 64px | 88px | At 768w card 348px wide; the two longest titles wrap to 2 lines; rows equalize heights |
| >= 1024px | 2 columns | 192px | 128px | 64px | 88px | Card 476px; all titles on one line |
| >= 1200px | container hits 1152px max | 192px | 128px | 64px | 88px | Card 564px; side margins grow (64px at 1280w, 144px at 1440w) |

Image `sizes="(max-width: 768px) 100vw, 50vw"`. Observed picks at DPR 1: 640w file at 390w and 1024w; 828w file at 768w; 750w file at 1440w.

Coarse pointer / touch: the `group-hover:scale-105` and `hover:text-sec` rules are wrapped in `@media (hover: hover)` by Tailwind v4, so they never apply on touch screens. The `MagicCard` hover is JS driven, so a tap on a card fires emulated `mouseenter`/`mousemove`: the border turns accent and the spotlight centers on the tap point, and this "sticky hover" stays until the user taps elsewhere (captured in `mobile-tap-card1.png`). Reproduce this as-is for an exact copy.

## 7. Accessibility and reduced motion

- Landmarks and headings: `section#projects` with `h2` "Projects"; each card has an `h3`. The eyebrow is a plain `p`.
- The preview link is `aria-hidden="true"` and `tabIndex={-1}`, so screen readers and keyboard users get one link per card: the icon link with `aria-label="View <project name>"`. The image alt (`"<name> preview"`) is therefore never announced.
- Devicon images are decorative (`alt=""`); the chip text carries the name.
- Focus: no custom focus style on the icon link; it shows the browser default focus ring. Its hit area is only 16x16px.
- Reduced motion: reveal snaps instantly (duration 0); `html` smooth scrolling becomes `auto`. No reduced-motion override exists for the 500ms image zoom or the 300ms border transition (they still run).
- No-JS: wrappers stay at the SSR inline `opacity:0`, so the whole section is invisible without JavaScript.
- Contrast: description at 60% white on #0a0d19 and the icon link at 30% white are low contrast by design; the accent chip text #3ecbff on its 10% tint passes for 12px text.

## 8. Content model

```ts
/** One entry per card, in display order. */
export interface Project {
  /** Display name, rendered uppercase in the card title. 13 to 31 chars. */
  name: string;
  /** One paragraph, plain text. 142 to 207 chars. */
  description: string;
  /** Tech labels rendered as chips in this order. 4 to 5 items, each 2 to 10 chars. */
  stack: string[];
  /** Absolute URL opened in a new tab (live deployment or a code-hosting profile). */
  link: string;
  /** Site-relative path to a 1280x800 (16:10) PNG, e.g. "/previews/<slug>.png"; null shows the placeholder. */
  preview: string | null;
  /** Only when preview is null: the filename shown in the placeholder caption, e.g. "<slug>.png". */
  placeholderFile?: string;
}

export interface SectionHeaderProps {
  index: string;   // "01"
  kicker: string;  // "Work"
  title: string;   // "Projects"
  lede?: string;   // unused in this section
}
```

Counts and shapes of the current data:

| # | name length | description chars | stack items (mapped icon + accent) | link target | preview |
|---|---|---|---|---|---|
| 1 | 28 | 192 | 5 (2 icon + 3 accent) | live site | 1280x800 PNG |
| 2 | 19 | 207 | 5 (3 icon + 2 accent) | live site | 1280x800 PNG |
| 3 | 31 | 200 | 4 (2 icon + 2 accent) | code-hosting profile | null, placeholder file name given |
| 4 | 13 | 142 | 4 (4 icon + 0 accent) | live site | 1280x800 PNG |

Generic UI strings (verbatim):
- Eyebrow: index `01` + `.` in the dimmed span, then `Work`; renders as `01. WORK`.
- Title: `Projects` (renders `PROJECTS`).
- Placeholder caption prefix: `./previews/` followed by the file name (e.g. `./previews/<slug>.png`).
- Placeholder label: `screenshot coming soon` (renders `SCREENSHOT COMING SOON`).
- Icon link aria-label: `View <name>`.
- Image alt: `<name> preview`.

### 8.1 Devicon mapping

URL pattern (jsDelivr GitHub mirror, unpinned):

```
https://cdn.jsdelivr.net/gh/devicons/devicon/icons/{slug}/{slug}-original.svg
```

Observed mapping (tech label to slug). Labels not in the map render as accent chips.

| Tech label | Devicon slug | Chip variant |
|---|---|---|
| Python | `python` | icon |
| OpenCV | `opencv` | icon |
| React | `react` | icon |
| Node.js | `nodejs` | icon |
| Supabase | `supabase` | icon |
| TensorFlow | `tensorflow` | icon |
| Figma | `figma` | icon |
| HTML | `html5` | icon |
| CSS | `css3` | icon |
| JavaScript | `javascript` | icon |
| KNN, Security, JSON, Pinecone, OpenAI API, LSTM, NLP | none | accent |

The map is an explicit allow-list (for example `JSON` gets an accent chip although devicon ships a json icon). It lives in server code that is not shipped to the browser, so only these 10 entries are observable.

## 9. Assets

| Asset | Original | Replacement plan |
|---|---|---|
| 3 project preview screenshots | 1280x800 PNG (16:10), each a dark-themed full-viewport capture of the project's own web UI: (1) a dark landing page with large centered gray monospace headline text and a thin rainbow-spectrum arc glowing along the lower edge; (2) a near-black chat app with a slim top bar (small shield logo centered), a centered title and subtitle, and a darker rounded panel holding a microphone glyph; (3) an event page with a black top nav (logo left, small caps links, outlined CTA at right) above a monochrome hero of two faces in profile facing each other with a large condensed headline under them. | Use screenshots of your own projects at exactly 1280x800 (or any 16:10 size, at least 1280 wide). Keep important content in the top half of the image: desktop shows only the top 54%. Dark UIs blend best with the `#0a0d19` fade. Serve through `next/image` with `fill`, `object-cover object-top`, the same `sizes`. |
| Placeholder art | None; pure CSS dot grid + lucide `SquareTerminal`. | Rebuild with CSS as specified. |
| Tech logos | devicon "original" SVGs hotlinked from jsDelivr. | Devicon is an open-source (MIT) icon set; hotlink the same pattern or vendor the needed SVGs into `/public/devicon/`. Optionally pin a version for stability. |
| UI icons | lucide-react `ExternalLink` (16px) and `SquareTerminal` (24px). | Same library. |
| Fonts | Archivo variable (wdth 62 to 125, weight 100 to 900), Geist, Geist Mono via `next/font/google`. | Same fonts (all OFL). Archivo must be loaded with the `wdth` axis so `font-stretch: 62%` works. |

## 10. Implementation plan

Components (Next.js App Router, Tailwind v4, motion):

1. `app/(site)/sections/Projects.tsx`, Server Component. Renders `<section id="projects" data-sec="signal" className="py-24 md:py-32 px-6">`, the shared `SectionHeader`, and the grid mapping `PROJECTS` to `<BlurFade key={p.name} delay={i * 0.08} className="h-full"><ProjectCard project={p} /></BlurFade>`.
2. `components/SectionHeader.tsx`, Server Component wrapping its content in `BlurFade className="mb-12 md:mb-16"`. Shared by all numbered sections (Homelab uses `index "02"` and a lede).
3. `components/BlurFade.tsx`, Client Component (`'use client'`), as in 4.1. Shared by every section.
4. `components/MagicCard.tsx`, Client Component, shared with other sections. Props `{ children, className }`. Base classes `relative overflow-hidden rounded-xl border border-white/10 p-6 transition-colors duration-300`, `border-sec/40` when hovered, inline background as in 4.2. For an exact visual match with fewer re-renders, write `--mx/--my` CSS variables from a ref in `onMouseMove` and toggle a `data-hover` attribute, producing the identical gradient string.
5. `components/ProjectCard.tsx`, Server Component: media link + `ProjectPreview` + body.
6. `components/ProjectPreview.tsx`, Server Component: `next/image` branch or placeholder branch.
7. `components/TechChip.tsx`, Server Component with a `DEVICON: Record<string, string>` map (section 8.1) and the two chip variants.
8. `content/projects.ts`: typed `Project[]` data; also imported by the terminal and the room monitor features.

Tailwind v4 setup needed for the utilities used here:

```css
@theme inline {
  --color-sec: var(--sec, #e6d9b5);
  --color-putty: #e6d9b5;
}
[data-sec="signal"] { --sec: var(--signal); }
/* unlayered on purpose, see gotcha 1 */
.display { font-family: var(--font-archivo), "Arial Narrow", system-ui, sans-serif;
  text-transform: uppercase; font-weight: 900; font-stretch: 62%; line-height: .9; }
.sec-title { color: #f7f4ec; font-size: clamp(2.6rem, 13vw, 5.5rem); }
.dot-grid { background-image: radial-gradient(circle, #ffffff1f 1px, #0000 1px); background-size: 28px 28px; }
```

Gotchas:
1. `.display` and `.sec-title` are UNLAYERED custom CSS, so they beat Tailwind utilities (which live in `@layer utilities`). This is why the card title's `leading-[0.95]` is ignored and the computed line-height is 0.9. Keep these rules unlayered (or drop `leading-[0.95]`) to reproduce the exact 24.48px title line-height.
2. `!p-0` (or v4 `p-0!`) is required to cancel MagicCard's default `p-6` on project cards.
3. `h-full` must be on both the BlurFade wrapper and the MagicCard, and `flex-1` on both the body and the description, for equal heights and bottom-aligned chips.
4. Tailwind v4 hover variants compile inside `@media (hover: hover)`; that is what disables zoom and icon recolor on touch. Do not replace them with JS hover.
5. `group-hover:scale-105` animates the CSS `scale` property; the transition list must include `scale` (Tailwind's `transition-transform` does in v4).
6. Motion SSR emits `opacity:0; transform:translateY(14px)` inline; match it to avoid a flash of visible content before hydration.
7. Use `next/image` `fill` inside a `relative` sized frame; keep `loading="lazy"` and default quality 75. Devicons stay plain `<img>` so no `remotePatterns` config is needed.
8. `color-mix()` fallbacks in compiled Tailwind are the solid color; acceptable for modern browsers only.

## 11. Reference screenshots

All under `C:/Users/krisg/AppData/Local/Temp/claude/C--/decae922-eee1-4676-b27b-70265c1bf4af/scratchpad/ref/projects/`:

| File | Shows |
|---|---|
| `desktop-section.png` | Whole section at 1440x900 (nav hidden), all cards revealed, rest state |
| `desktop-viewport-top.png` | Viewport with section top aligned to the top edge (header + first row) |
| `desktop-viewport-mid.png` | Viewport scrolled 300px into the section |
| `mobile-section.png` | Whole section at 390x844 (touch, mobile UA) |
| `mobile-viewport-top.png`, `mobile-viewport-mid.png` | Mobile viewports at section top and +300px |
| `w640-section.png`, `w767-section.png` | Single-column layouts just below md |
| `w768-section.png` | First 2-column width, wrapped titles, bottom-aligned chip rows |
| `w1024-section.png`, `w1280-section.png` | 2-column layouts at lg and xl |
| `hover-card1-rest.png` | Card 1 at rest |
| `hover-card1-media-150ms.png` | 150ms into hovering the preview strip (zoom mid-transition) |
| `hover-card1-media.png` | Preview strip hovered: image at 105%, accent border |
| `hover-card1-body.png` | Body hovered: accent border, spotlight near bottom right, image back at 100% |
| `hover-card1-extlink.png` | Title row with the icon link hovered (accent icon) |
| `focus-card1-extlink.png` | Title row with the icon link keyboard-focused (default ring) |
| `rest-card3-placeholder.png`, `hover-card3-placeholder.png` | Placeholder card at rest and hovered |
| `mobile-tap-card1.png` | Sticky hover after a tap on mobile (accent border + spotlight) |
| `reveal-00.png` to `reveal-07.png` | Frames 100ms apart while row 2 reveals (card 4 lags card 3) |
| `reduced-motion-viewport.png` | Reduced motion: content appears instantly |
| `desktop-styles.json`, `mobile-styles.json`, `w*-styles.json` | Computed-style and geometry dumps per width |
| `projects-rendered.html`, `projects-ssr.html`, `rsc.txt` | Captured DOM, SSR markup and decoded RSC payload (reference only) |

Probe scripts: `scratchpad/tools/projects-probe.mjs` (modes desktop, mobile, widths, hover, reveal), `projects-touch.mjs`, `projects-backdrop.mjs`, `projects-wrap.mjs`, `projects-imgdims.mjs`.

## 12. Open questions / uncertainties

- The tech-to-devicon map is server-only code; only the 10 entries above are observable. Whether matching is case-insensitive, or whether more keys exist, could not be verified.
- The `"01"` index is passed as a literal prop (Homelab passes `"02"` the same way); it is probably not computed from section order, but the server source is not visible.
- Reduced-motion detection in `BlurFade` reads the media query once at mount; a live OS toggle should not affect already mounted cards (inferred from code, not tested live).
- jsDelivr `gh/devicons/devicon` without a version tag resolves to whatever release jsDelivr treats as latest, so icon artwork could change upstream; pinning is a recommendation, not observed behavior.
- Sticky touch hover was verified in Chromium mobile emulation only; iOS Safari should behave the same (it fires `mouseenter` on tap) but this was not tested on a device.
