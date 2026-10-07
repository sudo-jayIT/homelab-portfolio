# 03 · Landing hero (classic view, first viewport)

Area key: `hero`. Scope: everything in the first viewport of the classic page except the night sky backdrop and the fixed header. That is the two-column landing section: the shell prompt line, the giant two-line name, the mono role line, the description, the two CTA keys, the isometric room still (the "door" into the room view) with its float, tilt, parallax and contact shadow, the "step inside →" key, the entrance choreography, and what happens as the user scrolls away. Also includes a composition guide for drawing an original replacement for the room still.

Related specs: `04-room-interior-scene.md` (the live SVG room, camera entry and exit moves, world coordinates of every object). The sky, header and boot intro have their own specs.

---

## 1. Overview

The landing hero is a quiet, print-like title card floating on a starry night sky. On the left, a tiny terminal prompt (`guest@penguin:~$ whoami`) sits above a huge, ultra-condensed, all-caps two-line name set in Archivo Black-weight at two different widths so both lines span exactly the same measure, with a hard offset drop shadow like letterpress ink. Below it a monospace role line, a muted one-sentence bio and two chunky "keyboard key" buttons. On the right, a pre-rendered isometric bedroom-lab (a cut-away room box on a transparent background) hovers in space: it bobs slowly (7 s), tilts toward the mouse in 3D, drifts against the pointer, and casts a breathing contact shadow; a cream "step inside →" key sits under it. Clicking the room hands off to the live SVG room, which starts exactly where the still image was and zooms in. Letters of the name rise in one by one (45 ms stagger) the first time the page is revealed. There is no pin, fade or scale when scrolling away; only a 4% parallax lag on the room.

---

## 2. Structure

### 2.1 Placement in the page

```
body
└─ main
   ├─ section#hero  (live SVG room view; display:none in classic view)
   └─ div.relative.z-10.overflow-clip   style="background: linear-gradient(180deg, #06080f 0%, #080b16 30%, #0b0f1d 65%, #121129 88%, #1c1530 100%)"
      ├─ div[aria-hidden].pointer-events-none.absolute.inset-0     (sky layer: sticky starfield, moon, constellations, satellites; see sky spec)
      └─ div.relative                                                 (all classic content)
         ├─ section  (LANDING HERO, this spec, no id)
         ├─ section#projects ...
         └─ ...
```

CSS that switches views (unlayered):

```css
html[data-view="classic"] #hero,
html[data-view="room"] #hero ~ *,            /* hides the whole classic wrapper incl. this hero */
html[data-view="room"] [data-classic] { display: none; }
```

Because the hero sits inside `#hero ~ *`, it is `display:none` while the room view is active. Becoming visible again restarts all of its CSS animations (this is the entrance mechanism, see 4.1).

### 2.2 Component tree (classic view)

```
section.relative.flex.min-h-[86svh].items-center.justify-center.px-6.pb-20.pt-28          (server)
└─ div.relative.mx-auto.grid.w-full.max-w-6xl.items-center.gap-x-8.gap-y-12
      lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]
   ├─ div.flex.flex-col.items-center.text-center lg:items-start lg:text-left              (text column, server)
   │  ├─ p.mb-5.select-none.font-mono.text-xs.text-white/45 md:text-[13px]
   │  │   ├─ span.text-putty  "guest@penguin"
   │  │   └─ ":~$ whoami"   (plain text node)
   │  ├─ h1.display.name-block
   │  │   ├─ span.sr-only  "<First> <Last>"
   │  │   ├─ span.name-line[aria-hidden=true] style="font-stretch:62%"
   │  │   │    └─ span style="--i:0" "<letter>"  … one span per letter, --i = 0..6
   │  │   └─ span.name-line[aria-hidden=true] style="font-stretch:83%"
   │  │        └─ span style="--i:7" "<letter>"  … --i continues 7..11 (global index across both lines)
   │  ├─ p.mt-6.font-mono.text-[13px].text-white/70 md:text-base      "<role> · <role> · <role>"
   │  ├─ p.mt-5.max-w-xl.leading-relaxed.text-white/55               "<one sentence bio>"
   │  └─ div.mt-8.flex.flex-wrap.items-center.justify-center.gap-3.5 lg:justify-start
   │      ├─ a.key.key-light[href="#projects"]   "View projects ↓"
   │      └─ a.key[href="#contact"]              "Get in touch"
   └─ HeroRoom (client)
      div[data-sky-vars].relative.mx-auto.w-full.max-w-[34rem] lg:max-w-none        (ref: door rest rect; receives --px/--py/--sy)
      └─ div.par  style="--d:18; --s:-0.04"                                          (pointer + scroll parallax)
         └─ button[type=button][data-room-door][aria-label="Step inside my room"].mini-room.group.relative.block.w-full
            ├─ span.mini-room-shadow[aria-hidden=true]                                (absolute contact shadow)
            ├─ span.mini-room-tilt.block                                             (3D tilt toward pointer)
            │   └─ img (next/image) .mini-room-float.h-auto.w-full                    (7 s bob)
            │        src=/room/room-still-<date>.webp width=1700 height=1460 loading=eager
            │        sizes="(max-width: 1024px) 92vw, 40rem"  alt="<short alt naming rack, desk, CRT>"
            └─ span.relative.-mt-2.flex.justify-center
                └─ span.key.key-light  "step inside →"                                (visual only; part of the button)
```

Notes:
- Everything except `HeroRoom` is a server component (no client JS on the text column; there are no per-letter event handlers).
- The `[data-sky-vars]` wrapper must not receive a React `style` prop; its inline style is written imperatively by the global `SkyMotion` effect (`--px`, `--py`, `--sy`). SSR markup has no style attribute; vars fall back to 0.
- `button` gets Tailwind v4 preflight (transparent background, no border, padding 0, `cursor: default`).

---

## 3. Styling

### 3.1 Tokens used

| Token | Value | Use here |
|---|---|---|
| `--background` | `#080808` | body bg (hidden behind the sky wrapper gradient) |
| `--foreground` | `#f0f0f0` | default text color (h1 inherits it, but lines override) |
| putty | `#e6d9b5` (`.text-putty`) | `guest@penguin` |
| name ink | `#f7f4ec` | name letters |
| name shadow ink | `#05070d` | hard drop shadow |
| key cream | `#efe8d4` to `#d4cab1` gradient | light keys |
| key dark | `#2c3035` to `#1c1f23` gradient | dark key |
| focus ring | `#efe8d4b3` (rgba(239,232,212,0.7)) | key and room focus outline |
| selection | `::selection { background: #e6d9b54d }` | global |
| `html` | `scroll-behavior: smooth` (auto under reduced motion), `-webkit-font-smoothing: antialiased` | CTA scrolling |

Fonts (next/font, CSS variables on `<html>`):
- `--font-archivo`: "Archivo", "Archivo Fallback". Variable: `font-weight: 100 900`, `font-stretch: 62% 125%` (wdth axis). Fallback face: `local(Arial)`, ascent-override 88.96%, descent-override 21.28%, line-gap-override 0%, size-adjust 98.7%.
- `--font-geist-sans`: "Geist", "Geist Fallback" (Arial, ascent 95.94%, descent 28.16%, size-adjust 104.76%).
- `--font-geist-mono`: "Geist Mono", "Geist Mono Fallback" (Arial, ascent 74.67%, descent 21.92%, size-adjust 134.59%). Tailwind `font-mono` resolves to Geist Mono.

### 3.2 Section and grid

| Element | Property | Value |
|---|---|---|
| section | min-height | `86svh` (774 px at 900 tall) |
| | padding | `112px 24px 80px` (pt-28, px-6, pb-20); top padding clears the 64 px fixed header |
| | layout | `display:flex; align-items:center; justify-content:center; position:relative` |
| grid | max-width | `72rem` (1152 px), `margin-inline:auto`, `width:100%` |
| | columns | base: 1 column; `lg` (>=1024): `minmax(0,1fr) minmax(0,1.2fr)` (509.08 / 610.92 px at 1152) |
| | gaps | column 32 px (gap-x-8), row 48 px (gap-y-12) |
| | align-items | center (columns vertically centered against each other) |
| text column | | `flex-direction:column; align-items:center; text-align:center`; `lg`: `align-items:flex-start; text-align:left` |

### 3.3 Prompt line

| Property | Value |
|---|---|
| font | Geist Mono 400, `12px` / `16px` (text-xs) below md, `13px` / `17.33px` at md+ (line-height inherits Tailwind's text-xs ratio 1.333) |
| color | `rgba(255,255,255,0.45)` for `:~$ whoami`; `#e6d9b5` for `guest@penguin` |
| margin | `margin-bottom: 20px` (mb-5) |
| other | `user-select: none`; no letter-spacing; width 179.4 px at 13 px (23 mono chars at 0.6 em) |

### 3.4 Name block (h1)

```css
.display {            /* shared with section titles */
  font-family: var(--font-archivo), "Arial Narrow", system-ui, sans-serif;
  text-transform: uppercase;
  font-weight: 900;
  font-stretch: 62%;
  line-height: 0.9;
}
.name-block {
  width: min(100%, 36rem, 52svh);
  container-type: inline-size;
}
.name-line {
  display: flex;
  justify-content: space-between;  /* letters spread to the exact block width */
  font-size: 29.7619cqw;          /* = 125/4.2 % of the h1 width */
  line-height: 0.86;
  color: #f7f4ec;
  text-shadow: 0.035em 0.045em #05070d;   /* hard, unblurred offset shadow */
}
.name-line > span {
  animation: name-in 0.7s cubic-bezier(0.2, 0.9, 0.25, 1) both;
  animation-delay: calc(var(--i, 0) * 45ms + 0.15s);
}
html[data-been-inside] .name-line > span { animation: none; }
@media (prefers-reduced-motion: reduce) { .name-line > span { animation: none; } }
```

- Per-line inline `font-stretch`: line 1 (7 letters) `62%`, line 2 (5 letters) `83%`. These are hand-tuned so each word's natural advance width is a hair under the block width; `space-between` absorbs the remainder (about 0.7 px per gap on line 1, 1.75 px on line 2 at desktop). Letter-spacing is `normal`.
- Measured at 1440x900: h1 468 x 239.56 px; font-size 139.286 px; line box 119.786 px; text-shadow `4.875px 6.268px 0 #05070d`. Line 1 glyph boxes (x, width): 144/67, 211/77, 289/70, 360/65, 425/65, 491/64, 556/56. Line 2: 144/98, 244/93, 339/92, 432/93, 527/85.
- Natural word width is about 3.31 to 3.33 em at the chosen stretch. For a different name, pick the largest `font-stretch` in [62%, 125%] whose measured word width at `29.7619cqw` is less than or equal to 100% of the block (measure with canvas or a hidden span); if even 62% overflows, lower the cqw multiplier for that line.
- The `.display` default `line-height: 0.9` is overridden by `.name-line` (0.86). The h1 itself computes 16 px / 14.4 px but has no direct text.

### 3.5 Role line and description

| Element | Font | Size / line-height | Color | Spacing |
|---|---|---|---|---|
| role line `p` | Geist Mono 400 | `13px / 19.5px` below md; `16px / 24px` at md+ | `rgba(255,255,255,0.70)` | `margin-top: 24px` (mt-6) |
| description `p` | Geist 400 | `16px / 26px` (leading-relaxed 1.625) | `rgba(255,255,255,0.55)` | `margin-top: 20px` (mt-5); `max-width: 36rem` (576 px) |

Separator in the role line: a space, U+00B7 middle dot, a space (` · `), plain text, same color.

### 3.6 Keys (shared `.key` system, declared in `@layer components`)

```css
.key {
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  height: 2.75rem; padding: 0 1.25rem; border-radius: 8px;
  font-family: var(--font-geist-mono), ui-monospace, monospace; font-size: 13px; font-weight: 600;
  white-space: nowrap; user-select: none;
  color: #ffffffdb;                                   /* rgba(255,255,255,.86) */
  background: linear-gradient(#2c3035, #1c1f23);
  box-shadow: inset 0 1px #ffffff1a, 0 3px #0a0b0d, 0 6px 14px #0000008c;
  transition: transform .1s, box-shadow .1s, color .15s;
}
.key:hover        { color:#fff; transform: translateY(-1px);
                    box-shadow: inset 0 1px #ffffff1a, 0 4px #0a0b0d, 0 8px 18px #0000008c; }
.key:active,
.key[aria-pressed="true"] { transform: translateY(3px);
                    box-shadow: inset 0 1px #ffffff0f, 0 0 #0a0b0d, 0 1px 3px #00000080; }
.key:focus-visible { outline: 2px solid #efe8d4b3; outline-offset: 3px; }
.key:disabled     { opacity: .35; pointer-events: none; }

.key-light        { color:#2a2620; background: linear-gradient(#efe8d4, #d4cab1);
                    box-shadow: inset 0 1px #fffc, 0 3px #9a8f77, 0 6px 14px #0000008c; }
.key-light:hover  { color:#1a1712;
                    box-shadow: inset 0 1px #fffc, 0 4px #9a8f77, 0 8px 18px #0000008c; }
.key-light:active,
.key-light[aria-pressed="true"] {
                    box-shadow: inset 0 1px #fff9, 0 0 #9a8f77, 0 1px 3px #00000080; }

@media (prefers-reduced-motion: reduce) {          /* unlayered */
  .key, .key:hover, .key:active { transition: none; transform: none; }
}
```

The look: a physical keycap. The solid `0 3px` shadow is the key's side wall; hover raises it 1 px and grows the wall to 4 px; press pushes it down 3 px and collapses the wall to 0.

Measured hero keys at desktop: "View projects ↓" 157 x 44 px, "Get in touch" 133.61 x 44 px, row gap 14 px (gap-3.5), row width 304.61 px, `margin-top: 32px` (mt-8). Cursor: `pointer` (anchors). Text line-height 19.5 px.

Computed states (verified):

| Key | Rest | Hover | Active (pressed) |
|---|---|---|---|
| light CTA | color rgb(42,38,32), transform none | color rgb(26,23,18), translateY(-1px), shadow 0 4px / 0 8px 18px | translateY(3px), shadow `inset 0 1px rgba(255,255,255,.6), 0 0 #9a8f77, 0 1px 3px rgba(0,0,0,.5)` |
| dark CTA | color rgba(255,255,255,.86) | color #fff, translateY(-1px) | translateY(3px), shadow `inset 0 1px rgba(255,255,255,.06), 0 0 #0a0b0d, 0 1px 3px rgba(0,0,0,.5)` |

### 3.7 Room door (unlayered CSS, so it overrides the layered `.key` rules regardless of specificity)

```css
.mini-room-tilt {
  display: block;
  transform: perspective(1100px) rotateY(calc(var(--px, 0) * 7deg)) rotateX(calc(var(--py, 0) * -5deg));
  will-change: transform;
  animation: mini-room-settle .7s ease-out;
}
@keyframes mini-room-settle { 0% { transform: perspective(1100px) rotateY(0) rotateX(0); } }

.mini-room-float { animation: mini-room-float 7s ease-in-out infinite; }
@keyframes mini-room-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.mini-room-shadow {
  position: absolute; left: 20%; right: 20%; bottom: 2.25rem; height: 9%;
  border-radius: 50%;
  background: radial-gradient(closest-side, #0009, #0000);
  animation: mini-room-shadow 7s ease-in-out infinite;
}
@keyframes mini-room-shadow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .7; transform: scale(.9); } }

.mini-room .key       { transition: transform .15s, box-shadow .15s; }
.mini-room:hover .key { transform: translateY(-2px); }
.mini-room:focus-visible { outline: 2px solid #efe8d4b3; outline-offset: 6px; border-radius: 12px; }

@media (prefers-reduced-motion: reduce) {
  .mini-room-float, .mini-room-shadow, .mini-room-tilt { animation: none; }
  .mini-room-tilt { transform: none; }
}

/* parallax helper shared with the sky */
.par { will-change: transform;
  translate: calc(var(--px,0) * var(--d,10) * -1px)
             calc(var(--py,0) * var(--d,10) * -1px - var(--sy,0) * var(--s,0) * 1px); }
@media (prefers-reduced-motion: reduce) { .par { translate: none; } }
```

Geometry at 1440x900 (all measured): wrapper 610.92 x 561 at (685.08, 122.5); image 610.92 x 524.67 (aspect 1700/1460 = 1.1644); key row starts at image bottom minus 8 px (`-mt-2`), key 151.09 x 44 centered under the image (x 914.98); shadow ellipse 366.6 x 50.5 px (60% of width, 9% of button height) whose bottom edge sits 36 px above the button bottom, which is exactly the image's bottom edge, so the shadow pools under the floor slab's front tip. Paint order: shadow first, then the tilt span (transformed, so it stacks above), then the key row.

Key states on the door (verified):
- Pointer anywhere over the button (image area): step key `translateY(-2px)`, rest shadow.
- Pointer directly over the step key: `translateY(-2px)` plus `.key-light:hover` color and taller shadow.
- Pressing on the step key: transform stays `-2px` (the unlayered hover rule beats `.key:active`), shadow collapses to the pressed shadow. Pressing on the image: no key press visual.
- Cursor stays `default` over the whole door (no pointer cursor).

Focus ring on the door: 2 px solid rgba(239,232,212,0.7), offset 6 px, radius 12 px, drawn around the whole 611 x 561 button.

---

## 4. Animation and timing

No GSAP and no ScrollTrigger are used in this area. Everything is CSS keyframes plus one rAF smoothing loop.

### 4.1 Entrance choreography

The landing column is server-rendered and fully visible except the name letters. All entrance motion is CSS animations that start when the hero box is first rendered (page load in classic view, or the moment `data-view` flips from `room` to `classic`).

| t (ms from reveal) | What |
|---|---|
| 0 | Prompt, role line, description, both CTAs, room still and step key appear instantly at full opacity (no fade). `mini-room-settle` starts (0.7 s ease-out from untilted to the live pointer tilt; invisible if the pointer is centered). `mini-room-float` and `mini-room-shadow` loops start at phase 0. |
| 150 + 45 x i | Letter i (i = 0..11 across both lines) starts `name-in`: opacity 0 to 1 and `translateY(0.3em)` to none (0.3 em = 41.8 px at desktop), 700 ms, `cubic-bezier(0.2, 0.9, 0.25, 1)`, fill both (invisible during its delay). |
| 700 | Room settle finished. |
| 1345 | Last letter finished (150 + 11 x 45 + 700). |

Sampled values (desktop): at 150 ms into a letter: opacity 0.726, y 11.4 px; at 350 ms: opacity 0.957, y 1.8 px; at 700 ms: 1, 0. So letters arrive fast and settle softly; about 9 letters are moving at once mid-sequence.

Reveal paths:
1. Returning visitor (`localStorage["yg-lab"].active`), any URL hash, or reduced motion: page loads directly in classic view, the sequence above runs from first paint.
2. First visit: an inline head script sets `data-view="room"` (plus `data-lab-intro`, `data-opening`) before paint, so the hero is `display:none` while the intro plays in the room view. The intro parks the live room exactly on the still's rest rect. When the intro ends (or "skip intro →" / "back to the page" is pressed), `setView("classic")` flips the view and the hero appears around the room with the sequence above (skip path: instant flip; natural end: camera tween to the still rect, 0.45 s or 0.9 s `power3.inOut`, then flip). `data-been-inside` is not set on this path, so the name animates.
3. Returning from the room (Esc, "step outside", zooming out past fit): `data-been-inside` is set, so the name is static; settle, float and shadow restart from phase 0. The page is at scrollY 0 (every view change calls `scrollTo({top:0, behavior:"instant"})`) and wheel events are swallowed for 700 ms after the flip.

### 4.2 Idle loops

| Target | Animation | Duration | Ease | Values |
|---|---|---|---|---|
| room `img` | `mini-room-float` | 7 s, infinite | ease-in-out | translateY 0 to -10 px to 0 (peak at 3.5 s) |
| shadow span | `mini-room-shadow` | 7 s, infinite, same start | ease-in-out | opacity 1 to 0.7, scale 1 to 0.9 at 50% (shadow shrinks and fades while the room rises) |

### 4.3 Pointer parallax and tilt (SkyMotion, shared with the sky)

A single client effect (mounted once for the page) writes three custom properties to every `[data-sky-vars]` element:

```
target px = clientX / innerWidth * 2 - 1      // -1..1, ignored when pointerType === "touch"
target py = clientY / innerHeight * 2 - 1
on documentElement pointerleave (non-touch): target = (0, 0)
each rAF: dt = min(now - last, 64) (16 on first frame)
          k  = 1 - exp(-dt / 160)               // exponential smoothing, time constant 160 ms
          cur += (target - cur) * k
          if |target - cur| < 0.002 on both axes: snap, stop the loop
          write --px = cur.x.toFixed(4), --py = cur.y.toFixed(4), --sy = scrollY.toFixed(1)
listeners: pointermove (passive), scroll (passive; wakes the loop so --sy updates)
skipped entirely when prefers-reduced-motion: reduce
```

Measured step response (center to right edge): 0.10 at 0 ms, 0.43 at 72 ms, 0.63 at 149 ms, 0.85 at 290 ms, 0.94 at 430 ms, 0.99 at 726 ms.

Effects on the room door (`--d: 18`, `--s: -0.04`):

| Input | Room `.par` translate | Tilt |
|---|---|---|
| pointer top-left (px, py = -1, -1) | +18 px, +18 px | rotateY(-7deg) rotateX(5deg) |
| pointer bottom-right (1, 1) | -18 px, -18 px | rotateY(7deg) rotateX(-5deg) |
| pointer mid-left (-1, 0) | +18 px, 0 | rotateY(-7deg) |
| scrollY = S | y += 0.04 x S px | none |

So the room drifts away from the cursor (depth 18) while turning its face toward it, with `perspective(1100px)` about the image center.

### 4.4 Scroll behavior leaving the hero

- No pin, no fade, no scale, no ScrollTrigger. The text column scrolls 1:1 (opacity 1, transform none at every scroll position checked: 0, 100, 300, 500, 700, 900).
- The room lags: `.par` translateY = +0.04 x scrollY (4 px at 100, 12 px at 300, 28 px at 700, 36 px at 900), so it scrolls at 96% speed. Same on touch devices (scroll still updates `--sy`).
- The sky behind is sticky with its own parallax (sky spec).

### 4.5 Step inside (hand-off)

1. Click (or Enter/Space) on the door button.
2. Entry rect = the `img`'s current `getBoundingClientRect()` (includes float, tilt and parallax), inset by `w/170` horizontally and `h/146` vertically (the bitmap's 10 px transparent margin on 1700 x 1460).
3. Rest rect = the `[data-sky-vars]` wrapper's left, top + scrollY, width, and height `width * 1460 / 1700`, inset the same way; stored with `depth: 18` and the current viewport size for the exit.
4. `html[data-been-inside]` is set, `data-view="room"`, `history.scrollRestoration = "manual"`, instant scroll to top, `window` event `yg:view` dispatched.
5. The hero disappears instantly (`display:none`); the live SVG room appears with its camera framed exactly on the entry rect, then tweens to the step-in framing in 1.15 s `power3.inOut` (details in spec 04).

Exit is the reverse: the room camera tweens to the stored rest rect shifted by the current parallax (`x - px*18`, `y - py*18`), 0.9 s `power3.inOut` (falls back to a fit framing if the viewport was resized since entry), then flips to classic.

Other sections can open the door programmatically: the Homelab section's room button scrolls to top instantly and clicks `[data-room-door]` on the next animation frame, so the zoom always starts from the hero still.

---

## 5. Interaction and state

| Element | Event | Effect |
|---|---|---|
| "View projects ↓" | click | native anchor to `#projects`; `html { scroll-behavior: smooth }` animates (about 450 ms in Chrome, lands at the section's top, 774 px at 1440x900). A global `hashchange` listener immediately strips the hash with `history.replaceState(null, "", pathname + search)`, so the URL stays clean. |
| "Get in touch" | click | same, to `#contact` |
| door button | click / Enter / Space | `enterRoom(entryRect, restRect, 18)` (4.5) |
| door button | hover | step key lifts 2 px (0.15 s) |
| window | pointermove / pointerleave / scroll | SkyMotion vars (4.3) |
| room view | Escape (when stepped in and no panel or terminal open) | `home()` which exits back to this hero |

State touched by this area:
- `html` dataset: `data-view` (`classic` or `room`), `data-been-inside` (presence flag, set on door entry, never cleared during the session), plus intro flags owned by other areas (`data-lab-intro`, `data-opening`, `data-boot`).
- Module-level view store (client): `currentView()`, `setView(v)`, `useView()` via `useSyncExternalStore` on the `yg:view` window event, `enterRoom(entry, rest, depth)`, `takeEntry()` (consume-once entry rect), `setDoor(getter)` (registered by HeroRoom on mount, cleared on unmount), `findWayOut()` (temporarily sets `data-view=classic` to measure the door, then restores), `wayOut()` (returns null if the viewport size changed).
- `localStorage`: none written by the hero itself. `yg-lab` (`{user, at, active}`) and `yg-boot` decide whether the first-visit intro runs before the hero is shown.
- History: `scrollRestoration` is `manual` in the room view and `auto` in classic view.

No keyboard shortcuts on the hero itself; tab order is header (logo key, 7 nav links, Resume key), then "View projects ↓", "Get in touch", "Step inside my room", then the Projects section.

---

## 6. Responsive behavior

Breakpoints used: `md` 768 (font sizes), `lg` 1024 (two columns). The name width also tracks viewport height through `52svh`. No `sm`, `xl` or `min-[1400px]` variants in this area.

| Viewport | Layout | Name block | Room image | Notes |
|---|---|---|---|---|
| 1440 x 900 | 2 cols 509 / 611, grid x=144, y=122.5 | 468 px (52svh), 139.3 px font | 611 x 525 | section 774 tall; text column 473 tall centered against room 561 |
| 1280 x 800 | 2 cols 509 / 611, grid x=64 | 416 px (52svh), 123.8 px | 611 x 525 | content 753 > min-height 688 |
| 1024 x 768 | 2 cols 429 / 515, grid 976 wide at x=24 | 399.4 px (52svh), 118.9 px | 515 x 442 | role line wraps to 2 lines, description to 3; room column centered vertically (y=116.7) |
| 768 x 1024 | 1 col 720, centered text | 532.5 px (52svh), 158.5 px | 544 x 467 (max 34rem, centered at x=112) | stack: text then room, 48 px gap; description 576 px max, 2 lines; CTAs centered; section 1249 tall |
| 390 x 844 (touch) | 1 col 342, centered | 342 px (100%), 101.8 px | 342 x 294 | prompt 12 px; role line 13 px, 2 lines; description 3 lines; CTAs one centered row; room starts y=608; section 1018 tall |
| very tall (52svh > 576) | | capped at 576 px (36rem), font 171.4 px | | |

Image source selection (`sizes="(max-width: 1024px) 92vw, 40rem"`, srcset widths 640, 750, 828, 1080, 1200, 1920, 2048, 3840 via `/_next/image?...&q=75`): 1440 at 1x picks 640w, at 2x picks 1920w; 1024 at 1x picks 1080w (92vw = 942 px, although the actual slot is 515 px, because `max-width: 1024px` includes 1024 while `lg` starts at 1024); 768 picks 750w; 390 picks 640w.

Coarse pointer / touch: no pointer parallax or tilt (touch pointer events are ignored; tilt stays at 0), scroll lag still applies, float and shadow loops still run. Tapping the room enters immediately. `:hover` lift on the step key can stick after a tap on iOS (no `@media (hover)` guard).

---

## 7. Accessibility and reduced motion

- The h1 contains a visually hidden full name (`.sr-only`); both visual lines are `aria-hidden`, so screen readers announce the name once instead of letter by letter.
- The prompt line is `select-none` but is still read aloud.
- The door is a real `<button type="button">` with `aria-label="Step inside my room"` (overrides the image alt and the key text). Visible focus ring: 2 px cream outline, 6 px offset, 12 px radius.
- CTA keys: 2 px cream outline, 3 px offset, on `:focus-visible` only.
- Contrast against the sky gradient's top color `#06080f` (computed, WCAG formula): name `#f7f4ec` 18.2:1; role line (70% white) 9.7:1; description (55% white) 6.3:1; prompt (45% white) 4.5:1, which only just meets AA for its 12 to 13 px size. Stars behind the text can locally lower this.

`prefers-reduced-motion: reduce`:
- The first-visit intro never opens (inline script exits early); the page loads straight into classic view; `data-boot="seen"`.
- No `name-in`, `mini-room-settle`, float or shadow animations; tilt `transform: none`.
- SkyMotion does not run (no vars written) and `.par` has `translate: none`, so no parallax and no scroll lag.
- `.key` transitions and transforms are disabled (hover still swaps colors and shadows).
- Quirk to reproduce or fix deliberately: `.mini-room:hover .key` still lifts the step key 2 px with a 0.15 s transition, because the unlayered `.mini-room` rules out-rank the reduced-motion `.key` reset. A clean rebuild should probably include `.mini-room:hover .key` in the reduced-motion reset.
- `html { scroll-behavior: auto }`.

---

## 8. Content model

```ts
interface LandingHeroContent {
  prompt: {
    user: string;      // "guest" (rendered in putty color together with "@" + host)
    host: string;      // "penguin"
    path: string;      // "~"
    command: string;   // "whoami"
  };                   // rendered as `${user}@${host}` + `:${path}$ ${command}`
  name: {
    full: string;                                        // sr-only text, ~13 chars
    lines: { text: string; fontStretch: number }[];      // 2 lines: 7 letters @ 62, 5 letters @ 83
  };
  roles: string[];      // 3 short role phrases (about 22, 10 and 15 chars), joined with " · "
  description: string;  // 1 sentence, about 110 to 115 chars, wraps to 2 lines at desktop
  ctas: [
    { label: "View projects ↓"; href: "#projects"; variant: "light" },
    { label: "Get in touch";    href: "#contact";  variant: "dark" }
  ];
  door: {
    src: string;          // "/room/room-still-<yyyy-mm-dd>.webp" (date-stamped for cache busting)
    width: 1700;
    height: 1460;
    alt: string;          // ~47 chars, names the rack, the desk and the CRT
    ariaLabel: "Step inside my room";
    keyLabel: "step inside →";
    parallaxDepth: 18;    // --d
    scrollFactor: -0.04;  // --s
  };
}
```

Generic UI labels, verbatim: `guest@penguin:~$ whoami`, `View projects ↓` (U+2193), `Get in touch`, `step inside →` (U+2192), aria-label `Step inside my room`. Role separator ` · ` (U+00B7). Letter indices `--i` run continuously 0..11 across both lines.

---

## 9. Assets

| Asset | Original | Replacement plan |
|---|---|---|
| Archivo variable (wght 100 to 900, wdth 62 to 125) | next/font/google, latin subsets, woff2 | Same open-source font via `next/font/google` `Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" })`. The wdth axis is required for `font-stretch`. |
| Geist, Geist Mono | next/font | Same (open source), variables `--font-geist-sans`, `--font-geist-mono`. |
| Room still | 1700 x 1460 WebP with alpha, served through next/image; room drawn edge to edge with a 10 px transparent margin; transparent outside the room hexagon so the sky shows through | Do not copy. Render an original isometric room (see Room still composition below and spec 04) at exactly 1700 x 1460 with a 10 px margin and transparent background. Best: render it from the same SVG scene used for the room view at its fit framing, so the live room lines up pixel-on-pixel with the still during entry and exit. |
| Arrows | text glyphs ↓ → in Geist Mono | Same characters. |
| Icons | none | none |

---

## Room still composition

A guide for drawing an ORIGINAL replacement with the same composition, lighting and readability. Positions are percentages of the bitmap (x of 1700 px width, y of 1460 px height), measured from the alpha channel, pixel color classification and gridded reference crops. Rendered colors include the scene's lighting, so they are darker than raw fills; spec 04 lists the live scene's world coordinates and fills for each object.

### Canvas and camera

- Bitmap 1700 x 1460 px (aspect 1.1644), transparent background, opaque content bounding box exactly 10..1689 x 10..1449 px (10 px margin all round).
- Projection: true isometric (30 degree axes): one world unit along x moves (cos30 x 1.32, +0.66) on screen, along y moves (-cos30 x 1.32, +0.66), along z moves (0, -1.32). Every diagonal silhouette edge measures slope 0.577.
- Camera looks into the room's open corner: two back walls (back-left wall and back-right wall) meeting at a vertical seam, a floor slab, no front walls, no ceiling. The viewer stands outside the missing front corner, above floor level.

### Room box silhouette (hexagon)

| Vertex | px | % |
|---|---|---|
| Top apex (top of the wall seam) | (765, 10) | (45.0, 0.7) |
| Left wall outer top | (10, 445) | (0.6, 30.5) |
| Left slab bottom | (10, 916) | (0.6, 62.7) |
| Bottom apex (slab under the front floor corner) | (934, 1449) | (54.9, 99.3) |
| Right slab bottom | (1689, 1013) | (99.4, 69.4) |
| Right wall outer top | (1689, 543) | (99.4, 37.2) |

Derived proportions (screen px along each axis; all axes share the same foreshortening):
- Back-left wall run 755 px horizontal (axis length about 872), back-right wall run 924 px (about 1067): the room is about 1.22 times longer along the right wall.
- Wall height about 424 px (29% of image height); floor slab thickness about 47 px (3.2%). Normalized: left wall 10, right wall 12.2, wall height 4.9, slab 0.54.
- Inner floor corners (top surface): back seam (45.0, 29.7), left (0.6, 59.5), right (99.4, 66.2), front (54.9, 96.0).
- Walls have a thin lighter top cap (wall thickness seen from above), about 1.2% of height, rendered `#2a2e33` to `#393d43`, plus the end faces at the far left and right edges.

### Surfaces and lighting

| Surface | Rendered color | Notes |
|---|---|---|
| Back-left wall | `#0e0e0e` to `#14181b` | darker, in shadow; faint cool wash from the rack spotlight |
| Back-right wall | `#1a1e21` to `#1b1f22` | slightly lighter (lit side); warm amber spill `#2c221a` low behind the desk |
| Wall cap | `#2a2e33` to `#393d43` | narrow band on top of both walls |
| Floor planks | `#191512`, `#1a1814`, `#1a1711` | dark walnut planks running parallel to the right wall (down-right); seams a little darker; subtle per-plank variation |
| Slab front-left face | `#181410` | darker than floor top |
| Slab front-right face | about `#120e0a` | darkest |

Light sources (all subtle, night scene): warm floor lamp in the back corner, a cool white spotlight cone over the rack, amber CRT glow, amber floor cables with bright packet dots, a teal network cable, cool moonlight in the window, faint teal pool at the rack base.

### Objects (approximate bounding boxes, % x / % y)

Back-left wall, left to right:

| # | Object | Box (x, y) | Description and color |
|---|---|---|---|
| 1 | Framed photo (portrait poster) | x 4.2 to 11.8, y 30.5 to 45.5 | Portrait-orientation print sheared onto the left wall plane (vertical sides, top and bottom edges rising right at 30 degrees); thin black frame, small hanger shadow above. Owner's personal photo: replace with original art. |
| 2 | Wall network outlet | x 6.6 to 7.6, y 51.8 to 54.4 | Small light-grey jack plate low on the wall. |
| 3 | Teal network cable | from outlet (7, 54.7) down to the floor at (7.4, 57.9), then along the wall base up-right to the rack base at (17.6, 50.9) | Teal line (`#4f989b` core, cyan glow) with one bright white packet dot at (14.8, 52.8). |
| 4 | Wall spotlight | fixture x 18.5 to 21, y 21.5 to 24 | Small grey (`#a2a6a9`) spot near the top of the wall, aimed down. |
| 5 | Light cone | apex (20.2, 23) widening to the rack top (about x 19.5 to 28.5, y 31 to 34) | Translucent white beam, brightest near the apex (`#f6f9f6`), about 15 to 25% opacity over the wall. |
| 6 | Certificates (4) | all four within x 24.3 to 43.8, y 8.6 to 25.4 | Small white cards (`#e8e6e0`), each about 4% wide by 6.5% tall, sheared to the wall, stepping up-right in a row parallel to the wall top: C1 x 24.0 to 28.2, y 19.0 to 25.7 (blue seal); C2 x 29.6 to 33.5, y 15.6 to 22.2 (sky-blue seal); C3 x 34.8 to 38.8, y 12.0 to 18.7 (red header band `#d4133d`, red seal); C4 x 40.2 to 44.0, y 8.6 to 15.3 (green seal). Each: colored issuer line, bold two-line title, grey hairlines, round seal bottom right, dark hanger tab above. Use invented issuers. |
| 7 | Rack base cabinet | x 17.8 to 35.5, y 45 to 61 | Black two-door cabinet (`#0f1112`), top face a touch lighter; small cream label plate on the front-left face (x 18.5 to 21.5, y 46.3 to 48.8) with a short dark mono label. |
| 8 | Glass rack enclosure | x 19.5 to 34, y 28.5 to 51.5 | Glass cube with bright white-grey frame edges (`#e2e8f0`-like), dark perforated mesh top (`#1e1d22`) with two inverted-U carry handles; inside (lit grey `#949a9b`): stacked rack units, a patch panel with about 8 white patch cables drooping in loops, a red indicator, an amber LED at about (33.5, 38). |
| 9 | Teal floor pool | around x 24 to 32, y 54 to 62 | Very faint teal light on the floor in front of the rack. |
| 10 | Amber floor cable / LED run | along the floor at the base of both walls between the rack (about 33, 40) and the desk (about 49, 34), meeting near the back seam (45, 30.5) | Warm amber line (`#ab9c4b` core) with a glow and bright near-white packet dots at about (37.1, 38.3) and (46.2, 33.4). |

Back corner and back-right wall, left to right:

| # | Object | Box (x, y) | Description and color |
|---|---|---|---|
| 11 | Floor lamp | base x 43.5 to 47, y 33.5 to 36; pole x about 45.3 from y 34.5 up to 20; shade x 42.3 to 48, y 15.8 to 21.2 | Slate square base, thin dark pole (`#272f33`), truncated-cone shade (tan exterior, dark side `#544433`, glowing warm underside `#bda884`); soft warm halo about 5% of width around the shade. Stands just right of the seam. |
| 12 | Framed photo print | x 48.3 to 57.6, y 9.4 to 24.5 | Landscape print in a thick off-white frame, sheared onto the right wall plane (top and bottom edges descending right at 30 degrees); warm architectural interior with a patch of blue sky. Replace with original art. |
| 13 | Window | x 72.8 to 84.1, y 22.6 to 47.7 | Dark navy night window (`#090d15` to `#0f1527`) with a dark frame (`#0c0f14`) and a light-grey sill along the bottom; 4 panes; tiny white stars; a small white moon at about (79.2, 34.6); a darker city skyline silhouette in the lower half. |
| 14 | Network map board | x 87.3 to 97.7, y 36.5 to 53.5 | Dark navy panel (`#12181b` to `#19222d`) with a thin light border and a small mono title top-left; white hollow-circle nodes joined by thin lines: 1 node at left, 1 hub, fan-out to a column of 3, dashed links to 3 more (8 nodes total). |

Desk group (against the back-right wall, long axis parallel to it):

| # | Object | Box (x, y) | Description and color |
|---|---|---|---|
| 15 | Desk | top from the wall near (48, 34) to the right end around (81, 52); front edge from about (45.5, 39.5) to (70, 57); legs: front-left x about 48.5, y 41 to 60; front-right x about 70.8, y 57 to 68; back legs partly visible near x 80 | Dark walnut top (`#1f1915` to `#21211d`), near-black front edge (`#0c0a08`), thin slate legs (`#1b2225` with light edge highlights). |
| 16 | CRT monitor | x 52.3 to 64.8, y 25.3 to 44 | Beige retro CRT (front `#a39b85`, top highlight about `#c8bfa7`, side shade `#716a5a`), deep rear housing extending toward the wall (right). Screen x 53.5 to 59, y 29 to 41: dark brown (`#251703`) with amber phosphor text lines top-left and an amber bar graph lower right; small green power LED at (56.7, 42.6). |
| 17 | Keyboard | x 50.7 to 60.2, y 40 to 47.5 | Beige (`#c4bda6`) iso keyboard in front of the CRT, grid of lighter keycaps (about 4 rows by 15). |
| 18 | Badge with lanyard | x 46 to 52.5, y 37.3 to 41.5 | White ID card (`#c2cfda` to white) with a blue lanyard loop (`#314681`, highlight `#3153c5`) at the desk's front-left corner; a small dark cube just behind it at about x 51 to 53, y 36.5 to 38.5. |
| 19 | Phone | x 58.8 to 62.3, y 45.5 to 49 | Small dark navy smartphone lying flat, pale screen glint (`#ced7e8`). |
| 20 | Camera | x 63 to 69.8, y 43.8 to 50.3 | Black camera body (`#323639`), lens facing front-left at about (63.8, 48.5) with blue-black glass and a ring highlight; tiny light label on top (use no brand). |
| 21 | Striped ball (reads as a globe) | x 66 to 71.2, y 39 to 44.8 | Sphere wrapped in multicolored bands (gold `#f7be59`, pink, green, blue, purple) sitting near the wall end of the desk. |
| 22 | Papers (resume) | x 70.3 to 79, y 45.8 to 51.5 | Two stacked white sheets (`#f0efe8` to white), slightly rotated, dark title bar, grey text lines, small round emblem. |
| 23 | Office chair | x 43.5 to 51.5, y 46 to 63 | Dark charcoal (`#191d20` to `#1c2025`) chair facing the desk with its back toward the viewer's lower left: tall backrest (x 44 to 48.5, y 46 to 56), seat, grey gas column, 5-star base with casters (x 43 to 50.5, y 58.5 to 63); faint edge highlights `#403c47`. |

Right end and floor:

| # | Object | Box (x, y) | Description and color |
|---|---|---|---|
| 24 | Record cabinet | x 78.8 to 89.8, y 53 to 66.8 | Low warm-brown wood cabinet (front `#2b2117` to `#30241a`) against the right wall; open shelf on the front-left face (x 79.6 to 82.6, y 56.5 to 62) packed with thin multicolored record sleeves (read as book spines: cream, mustard, brick red, blue, green, plum, teal); a door with a small brass pull at about (83.3, 61). |
| 25 | Turntable | record x 81.5 to 86, y 53.3 to 56; tonearm to (89, 55) | On the cabinet top: dark plinth, black vinyl with a white center label and a thin white rim highlight; thin light-grey tonearm reaching right to a small headshell. |
| 26 | Potted plant | planter x 89.3 to 95.2, y 62 to 70; leaves x 91.4 to 94.1, y 59.2 to 64.4 | Square wooden planter box (`#34261b`) on the floor at the right wall's end; spiky green leaves (`#2e5337`, highlights to `#809c7c`). |
| 27 | Rug | corners: left (25.0, 70.6), back (43.9, 57.9), right (69.0, 75.0), front (50.1, 87.7) | Large rectangle aligned to the room axes, long sides parallel to the right wall; dark indigo fill (`#1a1a2c`) with an inset thin violet border line (`#3f4057` to `#444358`, reads lavender at small size) and short fringe ticks along the two short edges (the ones parallel to the left wall). |

### Z-order (back to front)

walls and wall cap, wall art (certificates, prints, window, network board), spotlight cone, floor planks, rug, floor light pools, cables and packets, lamp, rack cabinet and glass rack, desk legs and desk top, desk items (CRT, keyboard, badge, phone, camera, ball, papers), chair (in front of the desk), record cabinet and turntable, plant, slab front faces. The chair partially overlaps the desk's front-left leg; the rack overlaps the bottom of the left-wall cable run.

### Readability targets

At the hero's displayed size (611 px wide on desktop, 342 px on phones) the still must read as: dark cozy room; glowing glass rack on the left; beige CRT on a long desk on the right; warm lamp in the corner; window with moon; violet rug center front. Keep every key object above about 2% of image width so it survives the 342 px phone size.

---

## 10. Implementation plan

Next.js App Router, Tailwind v4, no GSAP needed for this area.

```
app/layout.tsx                  server: fonts (Archivo with wdth axis, Geist, Geist Mono) as CSS variables on <html>,
                                inline pre-paint scripts (boot/view decision; owned by the intro spec), <SkyMotion/>
app/page.tsx                    server: sky wrapper > div.relative > <LandingHero/> + sections
components/landing/LandingHero.tsx   server: section, grid, text column, CTA anchors, <HeroRoom/>
components/landing/NameBlock.tsx     server: h1.display.name-block, sr-only full name, per-line spans with --i
components/landing/HeroRoom.tsx      client: door button, next/image still, registers setDoor, calls enterRoom
components/sky/SkyMotion.tsx         client: pointer/scroll smoothing loop writing --px/--py/--sy (shared with sky)
lib/view.ts                          client module: data-view store, VIEW_EVENT, enterRoom/takeEntry/setDoor/findWayOut/wayOut, useView
app/globals.css                      @layer components { .key … } ; unlayered: .display, .name-*, @keyframes name-in,
                                     .par, .mini-room-*, view toggling rules, reduced-motion blocks
```

HeroRoom pseudocode:

```tsx
const INSET_X = 1 / 170, INSET_Y = 1 / 146;            // 10px margin on 1700x1460
const inset = (r) => ({ x: r.x + r.w * INSET_X, y: r.y + r.h * INSET_Y,
                        w: r.w * (1 - 2 * INSET_X), h: r.h * (1 - 2 * INSET_Y) });
const restRect = () => { const b = wrapRef.current.getBoundingClientRect();
  return inset({ x: b.left, y: b.top + scrollY, w: b.width, h: b.width * 1460 / 1700 }); };
useEffect(() => { setDoor(() => ({ rest: restRect(), depth: 18 })); return () => setDoor(null); }, []);
onClick = () => { const r = imgRef.current.getBoundingClientRect();
  enterRoom(inset({ x: r.left, y: r.top, w: r.width, h: r.height }), restRect(), 18); };
```

Gotchas:
- Keep `.key` in `@layer components` and the `.mini-room` rules unlayered (or in a later layer); the step-key lift and press behavior depend on that cascade.
- `[data-sky-vars]` must have no React-managed `style`; otherwise a re-render can wipe the imperatively written vars. Put `--d`/`--s` on the child `.par` instead.
- `container-type: inline-size` on the h1 plus `cqw` font-size makes the name scale with its own width; the width uses `svh`, so short laptop screens get a smaller name. Do not replace with `vw`.
- The name entrance relies on CSS animations restarting when the classic wrapper goes from `display:none` to visible; do not swap the view toggle for `visibility` or opacity, or the letters will not re-animate after the intro.
- Set `html[data-been-inside]` before switching to the room so the return trip does not replay the name.
- The still must be the same scene and framing as the live room's fit view (10 px margin, 1700 x 1460) or the entry and exit cuts will visibly jump.
- `next/image` with `loading="eager"` (no priority/preload); the still is the hero's LCP candidate, so consider `preload` in Next 16 if LCP matters.
- `sizes` uses `max-width: 1024px` while the layout switches at `min-width: 1024px`; at exactly 1024 px the browser over-fetches (1080w for a 515 px slot). Use `(max-width: 1023px)` in a rebuild if exact parity is not required.
- `html { scroll-behavior: smooth }` plus a global hash-stripping listener gives clean URLs for the CTA anchors; there is no JS scroll handler on the CTAs.

---

## 11. Reference screenshots

All under `C:/Users/krisg/AppData/Local/Temp/claude/C--/decae922-eee1-4676-b27b-70265c1bf4af/scratchpad/ref/hero/`.

| File | Shows |
|---|---|
| `hero-1440x900.png`, `hero-1440x900-full-top.png` | desktop hero, returning-visitor load |
| `hero-1280x800*.png`, `hero-1024x768*.png`, `hero-768x1024*.png` | responsive layouts (2 col, 2 col narrow, stacked) |
| `hero-390x844-mobile.png`, `hero-390x844-mobile-full-top.png` | phone layout (touch emulation) |
| `hero-1440x900-reduced*.png` | reduced motion (no tilt, no float) |
| `entrance-name-0000.png` to `entrance-name-1350.png` | name entrance frozen at 0, 150, 250, 350, 450, 550, 700, 850, 1000, 1350 ms (pointer at top-right so the room is tilted) |
| `skip-00.png` to `skip-09.png` | first visit: intro room parked on the still, "skip intro" flip to classic, name animating in (about 200 ms apart) |
| `pointer-topLeft.png`, `pointer-topRight.png`, `pointer-bottomRight.png`, `pointer-midLeft.png` | parallax and tilt extremes |
| `state-light-hover.png`, `state-light-active.png`, `state-dark-hover.png`, `state-dark-active.png` | CTA key hover and pressed |
| `state-step-hover.png`, `state-step-active.png`, `state-room-hover.png` | step key hover, pressed, and lifted while hovering the image |
| `focus-view-projects.png`, `focus-get-in-touch.png`, `focus-room-door.png` | keyboard focus rings |
| `scroll-300.png`, `scroll-700.png`, `mobile-scroll-300.png` | leaving the hero (no fade; room lags 4%) |
| `after-view-projects.png` | after clicking "View projects ↓" (projects at top, hash stripped) |
| `enter-00.png` to `enter-11.png`, `inside-settled.png` | step inside hand-off and settled room view |
| `exit-00.png` to `exit-09.png`, `after-exit.png` | Escape back to the hero (name static, settle replays) |
| `mobile-enter-300ms.png`, `mobile-inside.png` | phone tap on the room |
| `room-still-ref-2x.png`, `room-still-grid-2x.png`, `room-quad-q1.png`, `room-quad-q2.png`, `room-quad-q3.png`, `room-quad-q4.png`, `room-quad-mid.png` | screenshots of the still over the sky with a 5% / 2.5% measurement grid, used for the composition section (reference only; do not ship) |
| `probe-*.json`, `probe2.json`, `probe3.json` | raw computed-style and timing dumps behind the numbers above |

Probe scripts: `scratchpad/tools/hero-probe.mjs` (computed styles per viewport), `hero-probe2.mjs` (parallax, smoothing, states, scroll), `hero-probe3.mjs` (entrance frames, focus order, enter/exit), `hero-reduced-hover.mjs`, `hero-room-ref.mjs`, `hero-room-quads.mjs`, `hero-room-colors.mjs`, `hero-room-peaks.mjs`, `hero-room-extents.mjs`.

---

## 12. Open questions / uncertainties

- Object boxes in the composition section are measured from screenshots and color classification; edges of dark objects on dark walls (desk back edge, chair, cabinet) are estimates within about 1% of image size. Spec 04's world coordinates are authoritative for the live scene.
- Rendered colors in the composition tables include lighting and WebP compression; they should be treated as targets for the final look, not raw fills.
- Whether the still was retouched after rendering could not be verified without copying it.
- `mini-room-settle` was verified statically (it has only a 0% keyframe, so it interpolates from flat to the live var-driven transform). How it looks when the pointer moves during those 700 ms was not frame-captured.
- Smooth-scroll timing for the CTAs (about 450 ms) is Chrome's native behavior in headless mode; other browsers will differ.
- Sticky `:hover` after taps on real iOS devices was not tested (only Chromium touch emulation).
- Not checked: viewports wider than 1440 (behavior should be identical since the grid caps at 1152 px) and very short landscape heights where `52svh` makes the name small (for example 1440 x 600 gives a 312 px name block).
