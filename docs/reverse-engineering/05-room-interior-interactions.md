# 05 · Room interior: interactions and UI (section#hero after "step inside")

Area key: `room-ui`. Source of truth: the production bundle (`LabHero`, `aF` hotspot layer, `oK` marker layer, `oE` focus layer and its nine panels, `oy` rack inspector, `oj` music card, the `yg:view` view store) cross-checked with headless Chrome probes at 1440x900 (fine pointer) and 390x844 (touch, mobile UA). All numbers below were read from code and, where marked "measured", confirmed with `getComputedStyle` / `getBoundingClientRect`.

Related specs: `01-intro-terminal.md` (login, boot, full command set), `02-global-chrome-sky-platform.md` (header, sky layer, `.key` buttons), `03-landing-hero.md` (the mini-room door image), `04-room-interior-scene.md` (SVG art, projection, ambient loops, hotspot geometry).

---

## 1. Overview

After the landing page's "step inside →" button, the still image of the isometric room zooms seamlessly into a full-viewport, live SVG version of the same room; the rest of the page is hidden and scrolling is locked. The room is an explorable diorama: you drag to pan, scroll or pinch to zoom, and click any of 19 objects. Clicking an object dims the scene, flies the camera onto it, and then "lifts" a flat HTML panel off the object's surface (an affine transform that starts exactly on the object's face and unskews to a centered card), for example a CRT with a DOS-style project browser, an ID badge, a phone with contacts, a framed certificate, or a CSS-3D inspector for the server rack. A small key-cap style HUD (step outside, terminal, zoom, reset, fullscreen) frames the corners, a drop-down Linux-style terminal is one backtick away, and the record player starts a floating "now playing" music card. Leaving (Esc, the "step outside" key, or zooming all the way out) reverses the opening zoom so the room shrinks back into the landing image.

---

## 2. Structure

### 2.1 View switching (global, outside the section)

The view lives on `<html data-view="classic|room">` (SSR renders `classic`). A tiny external store wraps it:

```ts
// view-store.ts (client)
const VIEW_EVENT = 'yg:view', PICK_EVENT = 'yg:pick', HOME_EVENT = 'yg:home';
let entryBox: Rect | null = null;           // where the door image is on screen at click time
let door: { box: Rect; depth: number; vw: number; vh: number } | null = null;
let doorFn: (() => { rest: Rect; depth: number } | null) | null = null;

export const currentView = () => { const v = document.documentElement.dataset.view; return v === 'room' || v === 'classic' ? v : null; };
export function setView(v: 'room' | 'classic') {
  const d = document.documentElement;
  if (d.dataset.view === v) return;
  d.dataset.view = v;
  history.scrollRestoration = v === 'room' ? 'manual' : 'auto';
  window.scrollTo({ top: 0, behavior: 'instant' });
  window.dispatchEvent(new Event(VIEW_EVENT));
}
export function enterRoom(box: Rect, rest: Rect, depth: number) {
  entryBox = box; door = { box: rest, depth, vw: innerWidth, vh: innerHeight };
  document.documentElement.dataset.beenInside = '';
  setView('room');
  entryBox = null;   // NOTE: cleared synchronously; the VIEW listener runs inside setView and calls takeEntry() first
}
export const takeEntry = () => { const e = entryBox; entryBox = null; return e; };
export const setDoor = (fn) => { doorFn = fn; };     // registered by the landing HeroRoom
export function findWayOut() {                      // re-measure the door while classic layout is briefly applied
  const d = document.documentElement, prev = d.dataset.view;
  d.dataset.view = 'classic'; const r = doorFn?.(); d.dataset.view = prev;
  if (r) door = { box: r.rest, depth: r.depth, vw: innerWidth, vh: innerHeight };
}
export function wayOut(): Rect | null {             // door rect corrected for the sky parallax
  if (!door || door.vw !== innerWidth || door.vh !== innerHeight) return null;
  const s = document.querySelector('[data-sky-vars]')?.style;
  const px = parseFloat(s?.getPropertyValue('--px') ?? '') || 0, py = parseFloat(s?.getPropertyValue('--py') ?? '') || 0;
  return { x: door.box.x - px * door.depth, y: door.box.y - py * door.depth, w: door.box.w, h: door.box.h };
}
export const useView = () => useSyncExternalStore(sub, currentView, () => null);
```

Global CSS (unlayered, after Tailwind) that the view flag drives:

```css
html[data-view="classic"] #hero, html[data-view="room"] #hero ~ *, html[data-view="room"] [data-classic] { display: none; }
[data-room-sky] { visibility: hidden; }  html[data-view="room"] [data-room-sky] { visibility: visible; }
#hero { background: 0 0; }                      /* overrides bg-[#050706]: the fixed sky shows through */
#hero > .bg-gradient-to-b, #hero svg[data-cam] > ellipse[fill="url(#lab-halo)"] { display: none; }
html[data-view="room"], html[data-view="room"] body { overscroll-behavior: none; overflow: hidden; }
html[data-view="room"] #hero { touch-action: none; height: 100svh; }
html[data-lab-zoomed] #hero { cursor: grab; }  html[data-lab-zoomed] #hero[data-dragging] { cursor: grabbing; }
header { transition: opacity .6s; }
html[data-lab-intro] header, html[data-lab-focus] header, html[data-lab-zoomed] header { opacity: 0; pointer-events: none; }
```

### 2.2 `section#hero` tree in the live room (`LabHero`, client component)

```
section#hero[data-phase="live"]  .relative.min-h-[100svh].overflow-clip.bg-[#050706]   (bg forced transparent by CSS; 100svh tall in room view)
├─ div ref=camWrap  .pointer-events-none.absolute.-inset-4.opacity-0.md:-inset-6         (GSAP: autoAlpha 1, x/y parallax; 16px / 24px bleed)
│   ├─ <RoomArt/>      svg[data-cam].absolute.inset-0.h-full.w-full  viewBox=<camera>  preserveAspectRatio="xMidYMid meet"  aria-hidden   (see 04)
│   ├─ <Markers show/> svg[data-cam].pointer-events-none.absolute.inset-0.h-full.w-full.transition-opacity.duration-1000  (opacity-100 | opacity-0) aria-hidden
│   │    └─ g transform="translate(x y)" > g[data-mk].lab-mk style="animation-delay: {0.43*i}s" transform="scale(k)"
│   │         ├─ circle r=6.5 .lab-mk-ring   ├─ circle r=6.5 .lab-mk-back   └─ circle r=2.6 .lab-mk-dot
│   ├─ <Hotspots/>     svg[data-cam][data-hotspots="on|off"].absolute.inset-0.h-full.w-full
│   │    └─ polygon.lab-hot[data-hot=id] role=button tabindex=0|-1 aria-label=label  (+ <title>label</title> unless quiet)  x19
│   └─ div[data-tip].lab-tip  (tooltip, positioned in px inside camWrap)
├─ div .pointer-events-none.absolute.inset-x-0.top-0.h-24.bg-gradient-to-b.from-[#050706].to-transparent   (display:none via CSS)
├─ div ref=dim .invisible.absolute.inset-0.z-30.bg-[#030504]/80.opacity-0   onClick=closeFocus()
├─ {focus ∈ rack parts}  <RackInspector initial=focus/>        .pointer-events-none.absolute.inset-0.z-40
├─ {focus ∈ objects}     <FocusPanel id=focus key=focus/>       div[data-focus-layer] z-40 (2.4)
├─ {phase live && zoomed} <>
│   ├─ button[data-dock][data-hud]  "↙ step outside" + .key-legend "esc"          (top-left)
│   ├─ div[data-dock][data-hud]     zoom/reset/fullscreen keys                      (bottom-right)
│   └─ p[data-hud]                  hint line                                       (bottom-center)
├─ div[data-term] ref=term  fixed terminal shell (2.6)
├─ {music} createPortal(<MusicCard/>, document.body)
├─ {phase intro|booting} div top-right: "back to the page" (hidden on the first-visit opening) + "skip intro →"   (see 01)
└─ {phase live} div[data-dock] bottom-left > button "›_ terminal" + .key-legend "`"
```

DOM order equals tab order: 19 hotspot polygons, then whichever overlay is mounted, then the HUD, then the terminal, then the terminal dock key.

### 2.3 HUD elements (exact classes)

| Element | Classes / attributes |
|---|---|
| Step outside | `button[data-dock][data-hud]` `key key-sm absolute left-4 top-4 z-20 pr-7 sm:left-5 sm:top-5 motion-safe:animate-[lab-fade-in_0.5s_ease-out_0.3s_backwards]`. Children: `<span aria-hidden>↙</span>`, text " step outside", `<span class="key-legend hidden sm:block">esc</span>` |
| Zoom dock | `div[data-dock][data-hud]` `absolute bottom-5 right-4 z-20 flex items-center gap-2 sm:bottom-6 sm:right-5 motion-safe:animate-[lab-fade-in_0.5s_ease-out_0.4s_backwards]` |
| Zoom keys | 4 x `button.key.key-sm.key-icon.text-sm` with `aria-label` = `title`: `−` "Zoom out", `+` "Zoom in", `⟲` "Reset view" (+ `key-legend hidden sm:block` "0"), `⛶` "Full screen" (rendered only if `document.fullscreenEnabled`) |
| Hint | `p[data-hud]` `pointer-events-none absolute inset-x-0 bottom-[4.25rem] z-20 text-center font-mono text-[11px] text-white/55 transition-opacity duration-700 sm:bottom-7` + `opacity-100` when hintVisible and no focus, else `opacity-0` |
| Terminal dock | `div[data-dock]` `absolute bottom-5 left-4 z-20 sm:bottom-6 sm:left-5 motion-safe:animate-[lab-fade-in_0.6s_ease-out_0.4s_backwards]` > `button.key.key-sm.pr-6[aria-expanded=termOpen]`: `<span class="text-white/50">›_</span>` " terminal" `<span class="key-legend hidden sm:block">`</span>` |
| Tooltip | `div[data-tip][aria-hidden]` `lab-tip pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-md border border-putty/25 bg-[#0b0d0c]/95 px-2 py-1 font-mono text-[11px] leading-none text-putty shadow-[0_8px_24px_-8px_rgba(0,0,0,0.9)]` |

Measured positions at 1440x900: step outside `[20,20,145x36]`; zoom dock `[1252,840,168x36]` (keys 36x36, 8px gaps); terminal key `[20,840,118x36]`; hint baseline row `bottom: 28px`. At 390x844: step outside `[16,16]`, zoom dock `[206,788]`, terminal `[16,788]`, hint at `bottom: 68px`, legends hidden.

### 2.4 Focus layer shell (`oE`, shared by all non-rack panels)

```
div[data-focus-layer]  .pointer-events-none.absolute.inset-0.z-40.flex.flex-col.items-center.justify-center.gap-4.px-3.pb-5.pt-14.sm:pt-16
                        (+ max-sm:justify-start max-sm:pt-20 when topOnPhones)
├─ div[data-lift]   .pointer-events-auto.origin-top-left.opacity-0        ← the panel (GSAP sets style.transform = matrix(...))
└─ div[data-chrome] .pointer-events-auto.invisible.flex.max-w-full.flex-wrap.items-center.justify-center.gap-x-3.gap-y-3.opacity-0
     ├─ {caption} span.mr-1.font-mono.text-[11px].text-white/45  (+ max-sm:hidden when topOnPhones)
     ├─ {actions}
     └─ button.key.key-sm.sm:pr-7  "✕ {closeLabel='close'} " + span.key-legend.hidden.sm:block "esc"
```

Because the layer is `pointer-events-none`, a click anywhere outside the panel and the chrome row falls through to the dim overlay (`z-30`), which closes the focus.

Action key helpers: link keys are `<a class="key key-sm">` or `key key-sm key-light`; `target="_blank"` unless the href starts with `/` or `mailto` (PDF links get `_blank` anyway); `rel="noopener noreferrer"`. "classic view ↓" / "full gallery ↓" buttons call `setView('classic')` then, on the next animation frame, `document.getElementById(section).scrollIntoView({behavior:'smooth'})`.

### 2.5 Rack inspector shell (`oy`, for `rack`, `patch`, `switch`, `p340`, `ssd`, `pdu`)

```
div .pointer-events-none.absolute.inset-0.z-40
├─ div[data-stage] .pointer-events-auto.absolute.inset-x-0.top-12.h-[46%].cursor-grab.touch-none.active:cursor-grabbing
│                   md:inset-y-0 md:left-0 md:right-[25rem] md:top-0 md:h-auto            (drag-to-rotate surface)
├─ div ref=modelFade .absolute.inset-0.opacity-0
│   ├─ div aria-hidden  same box as stage, bg-[radial-gradient(ellipse_45%_40%_at_50%_55%,rgba(148,163,184,0.10),transparent_70%)]
│   └─ div ref=model .absolute.left-0.top-0.[transform-style:preserve-3d]   style.transform = translate3d(x,y,0) scale3d(s,s,s) rotateX(rx) rotateY(ry)
│        └─ CSS-3D boxes of the selected part (6-faced divs with inline SVG faces; see 9)
└─ div .absolute.inset-x-3.bottom-3.flex  md:inset-x-auto md:inset-y-0 md:right-6 md:items-center
     └─ div[role=dialog][aria-label=part.title] .pointer-events-auto.invisible.max-h-[46svh].w-full.overflow-y-auto.rounded-xl.border.border-white/10
                         .bg-[#0b0e0d]/95.p-5.font-mono.shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)]  md:max-h-[calc(100svh-6rem)] md:w-[22rem]
         ├─ row: p.text-[10px].uppercase.tracking-[0.22em].text-putty/80 "{kicker} " + span.text-white/30 "· {n}/6" | button[aria-label=Close] "✕" .-mt-1.text-white/40.hover:text-white/80
         ├─ h3.mt-2.font-sans.text-lg.font-semibold.leading-snug.text-white  {title}
         ├─ ul.mt-2.5.space-y-1.text-[12px].text-white/65 > li: span.text-putty/70 "›" + " " + spec
         ├─ {p340 only} div.mt-4.border-t.border-white/[0.07].pt-3: p "running on it" (10px uppercase tracking-[0.22em] text-white/40),
         │     ul.mt-2.space-y-1.5.text-[12px].leading-relaxed.text-white/60 > li: span.text-white/85 {service.name} ": " {service.short},
         │     button.mt-3.text-[12px].text-putty.underline.decoration-putty/40.underline-offset-4.hover:text-white "open the homelab map →"  (closes inspector, opens map)
         ├─ {amazon|extra} div.mt-4.flex.flex-col.gap-2: a.key.key-sm.key-light.w-full "View on Amazon ↗"; a.text-[11px].text-white/50.underline.decoration-white/20.underline-offset-4 "{extra.label} ↗"
         ├─ div.mt-4.flex.flex-wrap.gap-x-2.gap-y-2.5.border-t.border-white/[0.07].pt-4 > 6 x button.key.key-xs[aria-pressed] (+ key-light when current):
         │     "Rack" "Patch panel" "Switch" "P340 Tiny" "SSD" "PDU"
         └─ p.mt-3.text-[10px].text-white/30 "drag to rotate · esc to go back"
```

Measured: dialog at 1440x900 is `[1064, y, 352 x 271..665]`, vertically centered at `right: 24px`; at 390x844 it is `[12, y, 366 x ...]` docked to the bottom (`bottom: 12px`), max 46svh, scrolls.

### 2.6 Terminal shell in the room

`div[data-term]` is `fixed inset-x-0 top-0 opacity-0` plus, while `phase === 'live'`, `z-[55] h-[min(58svh,34rem)] border-b border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)]` (otherwise `z-30 h-[100svh]` for the full-screen login, see 01). It sits above the fixed header (`z-50`). Inside is the same terminal component as the intro in `mode="shell"`: black background, scroll area `font-mono text-[13px] leading-[1.6] text-[#cfcfcf] md:text-[14px] px-5 py-4 md:px-8`, plus a footer bar `flex items-center justify-between border-t border-white/[0.08] px-5 py-1.5 font-mono text-[11px] text-white/35 md:px-8` with "tty1 · penguin" and a button "close " + `span.text-white/25` "(` or esc)" (`hover:text-white/80`). Measured height: 522px at 1440x900 (34rem cap), 489.5px at 390x844 (58svh).

### 2.7 Music card (portal to `<body>`)

```
div[data-music-card] .fixed.bottom-[4.5rem].right-4.z-50.w-fit.rounded-xl.border.border-white/10.bg-[#0b0d0c]/95.p-2
                      .shadow-[0_24px_70px_-16px_rgba(0,0,0,0.95)] motion-safe:animate-[lab-fade-in_0.35s_ease-out]
                      sm:bottom-auto sm:right-5 sm:top-[4.5rem]
├─ div.flex.items-center.justify-between.gap-2.pl-1
│   ├─ p.font-mono.text-[10px].uppercase.tracking-[0.22em].text-white/45  span.text-putty "♪" + " now playing"
│   └─ button.key.key-xs "■ stop"
├─ div.mt-2.h-[200px].w-[200px].overflow-hidden.rounded-md.bg-black > iframe.h-full.w-full (video embed, autoplay, no controls)
└─ p.mt-1.5.max-w-[200px].truncate.px-1.text-[12px].leading-tight.text-white/55  span.font-semibold.text-white {track} " · " {artist}
```

Measured box: 218 x 275 at `[1202,72]` on desktop (right 20px, top 72px); at 390x844 `[156,497]` (right 16px, bottom 72px).

---

## 3. Styling

### 3.1 Tokens

| Token | Value | Use |
|---|---|---|
| putty | `#e6d9b5` | tooltip text, hotspot highlight, marker color, accents (`text-putty/70`, `/80`, `border-putty/25`, `decoration-putty/40`) |
| key dark | `linear-gradient(#2c3035,#1c1f23)`, text `#ffffffdb` | HUD keys |
| key light | `linear-gradient(#efe8d4,#d4cab1)`, text `#2a2620` | primary actions |
| scene floor | `#050706` | section bg (overridden to transparent) and top fade |
| dim overlay | `#030504` at 80%, GSAP opacity 0.85 (objects) or 1 (rack parts) | effective black 68% / 80% |
| panel frame | `#0c0d0e` | certificate, print, poster, map frames |
| inspector bg | `#0b0e0d` at 95% | rack dialog |
| tooltip / music bg | `#0b0d0c` at 95% | |
| terminal text | `#cfcfcf`; muted `#8a8a8a`; ok green `#5fd07a` | |
| CRT amber | `#ffb347`, light `#ffcf8a`, screen `#130b02` | projects panel |

### 3.2 `.key` system (components layer; also documented in 02)

```css
.key { display:inline-flex; position:relative; align-items:center; justify-content:center; gap:.5rem; height:2.75rem; padding:0 1.25rem;
  border-radius:8px; font: 600 13px var(--font-geist-mono), ui-monospace, monospace; white-space:nowrap; user-select:none;
  color:#ffffffdb; background:linear-gradient(#2c3035,#1c1f23);
  box-shadow: inset 0 1px #ffffff1a, 0 3px #0a0b0d, 0 6px 14px #0000008c; transition: transform .1s, box-shadow .1s, color .15s; }
.key:hover { color:#fff; transform:translateY(-1px); box-shadow: inset 0 1px #ffffff1a, 0 4px #0a0b0d, 0 8px 18px #0000008c; }
.key:active, .key[aria-pressed="true"] { transform:translateY(3px); box-shadow: inset 0 1px #ffffff0f, 0 0 #0a0b0d, 0 1px 3px #00000080; }
.key:disabled { opacity:.35; pointer-events:none; }
.key:focus-visible { outline:2px solid #efe8d4b3; outline-offset:3px; }
.key-light { color:#2a2620; background:linear-gradient(#efe8d4,#d4cab1); box-shadow: inset 0 1px #fffc, 0 3px #9a8f77, 0 6px 14px #0000008c; }
.key-light:hover { color:#1a1712; box-shadow: inset 0 1px #fffc, 0 4px #9a8f77, 0 8px 18px #0000008c; }
.key-light:active, .key-light[aria-pressed="true"] { box-shadow: inset 0 1px #fff9, 0 0 #9a8f77, 0 1px 3px #00000080; }
.key-sm { height:2.25rem; padding:0 .85rem; border-radius:7px; font-size:12px; }
.key-xs { height:1.75rem; padding:0 .6rem; border-radius:6px; font-size:11px; font-weight:500; }
.key-icon { width:2.25rem; padding:0; }
.key-legend { position:absolute; top:3px; right:6px; font-size:9px; font-weight:400; line-height:1; opacity:.5; }
@media (prefers-reduced-motion: reduce) { .key, .key:hover, .key:active { transition:none; transform:none; } }
```

Measured HUD key: 36px tall, radius 7px, padding 13.6px left, 28px right (`pr-7` leaves room for the legend), Geist Mono 12px/600, color `rgba(255,255,255,.86)`. Icon keys: 36x36, 14px glyph (`text-sm`).

### 3.3 Hotspot, marker and tooltip CSS

```css
.lab-hot { fill:#0000; stroke:#0000; stroke-width:1.4px; stroke-linejoin:round; cursor:pointer; pointer-events:all; outline:none;
  transition: fill .2s, stroke .2s; }
.lab-hot:hover, .lab-hot:focus-visible, .lab-hot[data-active] { fill:#e6d9b51a; stroke:#e6d9b5e6; }
.lab-hot[data-hot="rack"]:hover, .lab-hot[data-hot="rack"][data-active] { fill:#e6d9b508; }   /* rack: outline only, 3% fill */
[data-hotspots="off"] .lab-hot { pointer-events:none; }

.lab-mk-back { fill:#0607089e; stroke:#e6d9b580; stroke-width:.9px; }
.lab-mk-dot  { fill:#e6d9b5; animation: 2.8s ease-in-out infinite lab-mk-breathe; animation-delay: inherit; }
.lab-mk-ring { fill:none; stroke:#e6d9b5; stroke-width:1px; transform-box:fill-box; transform-origin:50%;
  animation: 2.8s ease-out infinite lab-mk-ping; animation-delay: inherit; }
@keyframes lab-mk-breathe { 0%,to { opacity:.55 } 50% { opacity:1 } }
@keyframes lab-mk-ping { 0% { opacity:0; transform:scale(1) } 12% { opacity:.6 } 75%,to { opacity:0; transform:scale(2.1) } }

.lab-tip { opacity:0; transform:translate(-50%, calc(-100% - 6px)); transition: opacity .15s, transform .15s; }
.lab-tip[data-on] { opacity:1; transform:translate(-50%, calc(-100% - 10px)); }
.lab-tip[data-below] { transform:translate(-50%, 6px); }
.lab-tip[data-below][data-on] { transform:translate(-50%, 10px); }
```

The stroke width is in SVG user units, so it scales with the camera (about 2px on screen at the default desktop framing, about 6px when a small object is focused). Measured tooltip: Geist Mono 11px, line-height 1, padding 4px 8px, radius 6px, border 1px putty at 25%, height 21px.

### 3.4 Panel styling summary (per panel, exact)

**CRT / projects (`monitor`)**
- Bezel: `w-[min(58rem,calc(100vw-1.5rem),calc((100svh-11rem)*1.28))] rounded-[26px] sm:rounded-[34px] p-3 sm:p-6 bg-[linear-gradient(180deg,#ddd4bd,#b9ae95)] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95),inset_0_2px_0_rgba(255,255,255,0.5)]`. Measured 927 x 740 at desktop, 366 x 572 at 390.
- Screen: `relative overflow-hidden rounded-[18px] sm:rounded-[26px] bg-[#130b02] shadow-[inset_0_0_0_3px_#1d1a14,inset_0_0_90px_rgba(0,0,0,0.9)] max-sm:h-[62svh] sm:aspect-[4/3]`.
- Text layer: `absolute inset-0 flex flex-col overflow-hidden p-4 sm:p-7 font-mono text-[12px] sm:text-[13px] text-[#ffb347] [text-shadow:0_0_6px_rgba(255,179,71,0.45)]`.
- Title bar: `flex justify-between border-b border-[#ffb347]/30 pb-2`: left "<INITIALS>-DOS 6.22 · C:\PROJECTS", right "{n} file(s)" in `text-[#ffb347]/60`.
- Body grid: `mt-3 grid min-h-0 flex-1 gap-4 sm:grid-cols-[15rem_1fr]`.
- File list: `ul.space-y-0.5 max-sm:max-h-[8.5rem] max-sm:overflow-y-auto`; each `button.w-full.px-1.5.py-0.5.text-left`; selected `bg-[#ffb347] text-[#130b02] [text-shadow:none]` with prefix "▸ ", others prefix two spaces and `hover:bg-[#ffb347]/10`. Before the first client site: `p.mb-1.mt-2.text-[#ffb347]/50 "── client work ──"`. Filenames are 8.3 DOS names (an explicit map per item, fallback `NAME.replace(/[^a-z0-9]/gi,'').slice(0,8).toUpperCase() + '.EXE'`; the map uses extensions like `.PY`, `.JS`, `.HTM`, `.WWW`).
- Detail pane: `min-h-0 overflow-y-auto pr-1 [scrollbar-color:rgba(255,179,71,0.3)_transparent] [scrollbar-width:thin]`: optional preview `relative mb-3 aspect-[16/9] overflow-hidden border border-[#ffb347]/30` (image `object-cover object-top opacity-90`), name `text-[14px] sm:text-[15px] font-bold uppercase tracking-wide`, description `mt-2 leading-relaxed text-[#ffcf8a]/85`, tags `mt-3 text-[#ffb347]/65` as `[Tag] [Tag]`.
- Footer: `mt-3 flex justify-between border-t border-[#ffb347]/30 pt-2 text-[#ffb347]/55`: "↑↓ select · ⏎ open" and "C:\>" + `span` "█" `motion-safe:animate-[lab-caret_1s_steps(1)_infinite]`.
- Overlays on the screen: scanlines `bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.28)_0px,rgba(0,0,0,0.28)_1px,transparent_1px,transparent_3px)]`; glare `rounded-[inherit] bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.07),transparent_55%)]`.
- Chin: `mt-2 sm:mt-4 flex items-center justify-between px-1`: model badge "<INITIALS>-386" `font-mono text-[11px] font-bold tracking-[0.2em] text-[#5b5546]`; power LED `h-1.5 w-1.5 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80]`; floppy slot `h-3 w-6 rounded-sm bg-[#a39a83] shadow-[inset_0_-1px_0_rgba(0,0,0,0.25)]`.
- Actions: `a.key.key-sm.key-light` "Open {name} ↗" (current item link), `button.key.key-sm` "classic view ↓" (to `#projects`), close.

**Resume (`resume`)**: `relative aspect-[17/22] w-[min(46rem,calc(100vw-1.5rem),calc((100svh-9.5rem)*0.7727))] bg-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)]` containing a full-bleed `object-contain` image of the resume page. Measured 578 x 748 desktop, 366 x 474 at 390. Actions: key-light "Open PDF ↗" (new tab), key "Download" (`download` attribute with a filename), close.

**Work badge (`badge`)**: card `w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-[#f1f5f9] text-slate-900 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)]` (352 x 576).
- Lanyard strip `flex justify-center bg-[#e2e8f0] py-2` with slot pill `h-2 w-14 rounded-full bg-[#94a3b8]/70`.
- Color band `px-5 py-3 text-white transition-colors` with inline `background: band` (per employer: `#1e3a8a`, `#9f1239`, `#0039a6`): org line `font-mono text-[10px] tracking-[0.28em]` (uppercase string), type line `mt-0.5 text-[11px] opacity-75`.
- Identity row `flex gap-4 px-5 pt-4`: photo `relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-slate-300` (`object-cover object-[50%_32%]`); name `text-[15px] font-bold tracking-wide` (uppercase), role `mt-1 text-sm font-medium leading-snug`, "{company} · {location}" `mt-1 text-xs text-slate-500`, period `mt-1 font-mono text-[11px] text-slate-600`.
- Bullets `ul.space-y-2.px-5.py-4.text-[13px].leading-relaxed.text-slate-700`, each `li.flex.gap-2` with `span.text-slate-400 "›"`.
- Barcode `mx-5 mb-5 h-8 opacity-80 bg-[repeating-linear-gradient(90deg,#0f172a_0_2px,transparent_2px_4px,#0f172a_4px_5px,transparent_5px_8px,#0f172a_8px_11px,transparent_11px_13px)]`.
- Actions: one tab key per employer (short tab label), current one `key-light` with `aria-pressed=true`, then close.

**Phone / contact (`phone`)**: `relative aspect-[9/19] h-[min(38rem,calc(100svh-9rem))] overflow-hidden rounded-[2.6rem] border-[9px] border-[#0b0c0d] bg-[radial-gradient(ellipse_at_top,#1b2a44,#0b1020_60%)] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] ring-1 ring-white/10` (288 x 608).
- Pill notch `absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-black`.
- Status bar `flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-white/85`: "9:41" and "▮▮▮" (`tracking-widest`).
- Content `flex h-full flex-col px-5 pb-10 pt-8`: avatar `h-16 w-16 rounded-full ring-2 ring-white/15`; name `mt-3 text-[17px] font-semibold text-white`; one-line pitch `mt-1 text-[12px] leading-snug text-white/55`.
- Contact list `mt-5 divide-y divide-white/[0.07] overflow-hidden rounded-2xl bg-white/[0.06]`, rows `a.flex.items-center.gap-3.px-3.5.py-3.transition-colors.hover:bg-white/[0.05]`: icon tile `flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 font-mono text-[11px] text-white/80` (glyphs: email "✉", linkedin "in", github "gh", instagram "◎", fallback "•"), label `block text-[13px] text-white`, handle `block truncate text-[11px] text-white/45`, chevron `text-white/30 "›"`.
- CTA `a.key.key-light.mt-auto.w-full.rounded-full.text-[14px]` "Email me" (mailto).
- Actions: close only.

**Camera (`camera`)**: body `relative mt-6 w-[min(40rem,calc(100vw-1.5rem))] rounded-[22px] bg-[linear-gradient(180deg,#2a2d31,#141619)] p-[4%] pr-[26%] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)]` (640 x 373).
- Viewfinder hump `absolute -top-6 left-[30%] h-8 w-[22%] rounded-t-2xl bg-[#1f2226]` with eyecup `mx-auto mt-1.5 h-4 w-[70%] rounded-lg bg-[#0b0c0e]`.
- Rear LCD `relative aspect-[3/2] overflow-hidden rounded-md bg-black ring-2 ring-black`, whole area one link to the photo account (`aria-label` "Open @handle on ..."): header row (avatar `h-7 w-7 sm:h-9 sm:w-9 rounded-full ring-2 ring-pink-500/70`, handle `text-[12px] sm:text-[13px] font-semibold`, subline `truncate text-[10px] sm:text-[11px] text-white/55`, "Follow" pill `rounded-md bg-[#0095f6] px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold`), then `mt-2 grid min-h-0 flex-1 grid-cols-3 gap-0.5` of the first 6 photos (`object-cover`).
- Controls column `absolute right-[5%] top-[14%] flex w-[16%] flex-col items-center gap-3`: dial `aspect-square w-[70%] rounded-full bg-[#0f1113] shadow-[inset_0_0_0_3px_#2b2f33]`; two buttons `h-2.5 w-2.5 rounded-full bg-[#2b2f33]`; "▶ MENU" `font-mono text-[9px] tracking-widest text-white/40`; LED `h-2 w-2 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80]`.
- Model line `mt-2 font-mono text-[10px] tracking-[0.25em] text-white/35`.
- Actions: key-light "Open @{handle} on {service} ↗", key "full gallery ↓" (to `#photography`), close.

**Record (`record`)**: `relative aspect-square w-[min(72vw,calc(100svh-30rem))] sm:w-[min(86vw,calc(100svh-9.5rem))] rounded-full shadow-[0_50px_140px_-30px_rgba(0,0,0,1),0_0_120px_-20px_rgba(201,206,211,0.14)]` (748 desktop, 281 at 390).
- Disc `div[data-spin].lab-disc-spin.absolute.inset-0.rounded-full` with `background: repeating-radial-gradient(circle at 50% 50%, #0c0c0d 0px, #0c0c0d 1.3px, #161618 1.3px, #161618 2.6px)` (grooves).
- Groove rings at `inset: 4% | 13% | 21%`, each `rounded-full border border-black/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]`.
- Label `absolute inset-[33%] overflow-hidden rounded-full bg-[#c2c6cb] text-center`, lower half `absolute inset-x-0 bottom-0 h-1/2 bg-[#8f959c]`; three centered lines at `top-[27%]` (artist, `font-bold leading-none tracking-[0.14em] text-[#15171a] [font-size:clamp(7px,1.7vmin,17px)]`), `top-[64%]` (title, `font-semibold text-[#101214] [font-size:clamp(9px,1.6vmin,16px)]`), `top-[80%]` ("33⅓ rpm", `font-mono text-[#101214]/70 [font-size:clamp(6px,1vmin,11px)]`), each `-translate-y-1/2 whitespace-nowrap`.
- Spindle `absolute left-1/2 top-1/2 h-[2.2%] w-[2.2%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#cfd3d8] shadow-[inset_0_0_2px_rgba(0,0,0,0.6)]`.
- Static sheen (does not rotate) `pointer-events-none absolute inset-0 rounded-full`, `background: conic-gradient(from 25deg, transparent 0deg, rgba(255,255,255,0.09) 16deg, transparent 38deg, transparent 180deg, rgba(255,255,255,0.06) 198deg, transparent 222deg, transparent 360deg)`; rim `shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.06)]`.
- Shell options: `closeLabel="back to the room"`, `topOnPhones`, caption "{artist} · {title}" (hidden on phones). Actions: key "■ stop the music" (stops music and closes).

**Framed print (`print`)**: frame `bg-[#0c0d0e] p-2.5 sm:p-3.5 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)]`, mat `bg-[#ecebe7] p-4 sm:p-8`, image box `relative aspect-[1.375] w-[min(48rem,calc(100vw-5.5rem),calc((100svh-14rem)*1.375))]` (`object-contain`, keyed by src so it swaps without a transition). Measured 860 x 651 desktop. Actions: `key key-sm key-icon` "←" (aria "Previous photo"), counter `font-mono text-[11px] text-white/50` "{i} / {n}", "→" (aria "Next photo"), key-light "@{handle} ↗", key "full gallery ↓", close.

**Network map (`map`)**: frame `w-[min(58rem,calc(100vw-1.5rem))] bg-[#0c0d0e] p-2.5 sm:p-3.5` + shadow; inner `max-h-[calc(100svh-10rem)] overflow-y-auto bg-[#0f1a24] p-5 sm:p-8 text-slate-200 [scrollbar-color:rgba(148,163,184,0.3)_transparent] [scrollbar-width:thin]`.
- Header `flex flex-wrap items-baseline justify-between gap-2`: "homelab.map" `font-mono text-lg`; "{host} · {os}" `font-mono text-[11px] text-slate-400`.
- Diagram `mt-5`: inline SVG `viewBox="0 0 760 250" class="h-auto w-full" role="img" aria-label="Homelab network diagram"`. Nodes are `rect h=40 rx=6 fill=#132231 stroke=#2c4257` with a 12px mono title (`#e2e8f0`, the server node `#fca5a5`) at (x+10, y+17) and a 9.5px mono subtitle `#8aa0b6` at (x+10, y+31). Layout: WAN node (10,105,w100) → switch (160,105,w140) → server (340,105,w140) → four service nodes at x=540 w=210, y = 15, 70, 125, 195. Links `stroke=#5b7690 width 1.2`: `M110 125 H160`, `M300 125 H340`, bus `M480 125 H505 V35 H540 M505 125 H540 M505 125 V215 H540`, dashed (`4 4`) `M480 80 H505`.
- Grid `mt-6 grid gap-6 sm:grid-cols-2`: left column h4 "Services" (`font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400`), `ul.mt-3.space-y-3` of name (`text-sm font-medium text-white`) + role (`text-[13px] leading-relaxed text-slate-400`); right column h4 "Hardening" with chips `rounded border border-slate-600/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-300` in `mt-3 flex flex-wrap gap-1.5`, then h4 "Things I've debugged" (`mt-6`) and `ul.mt-3.space-y-2.5.text-[13px].leading-relaxed.text-slate-300` with `span.text-slate-500 "›"`.
- Actions: close only. Measured 928 x 768 desktop (scrolls internally), 366 x 704 at 390.

**Poster (`poster`)**: frame `bg-[#0c0d0e] p-2 sm:p-3` + shadow; `relative aspect-square w-[min(40rem,calc(100vw-5.5rem),calc(100svh-10rem))]` image `object-cover`. Caption = poster subject. Close only.

**Certificates (`cert-*`)**: caption "{issuer} · {note}". Frame `bg-[#0c0d0e] p-2.5 sm:p-3.5` + shadow, mat `bg-[#e9e6de] p-3 sm:p-5`.
- With a scan (`thumb`): image 1200x927, `block h-auto w-[min(46rem,calc(100vw-4.5rem),calc((100svh-13rem)*1.294))]` (804 x 637 frame at desktop). Actions: key-light "Verify at {issuer} ↗", `span.max-w-[16rem].break-all.font-mono.text-[10px].text-white/45` "code {code}", key "Open PDF ↗", close.
- Without a scan: typographic certificate `flex aspect-[1.294] w-[min(40rem,calc(100vw-4.5rem),calc((100svh-13rem)*1.294))] flex-col items-center justify-center border border-[#cfcabd] px-6 text-center text-slate-800`: brand wordmark `text-2xl sm:text-3xl` (brand colors per issuer), "certified" `mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500`, full name `mt-2 text-xl font-semibold sm:text-3xl`, holder `mt-4 text-sm text-slate-600`, note `mt-1 max-w-sm text-xs text-slate-500`. Actions: close only (708 x 563 frame at desktop).

---

## 4. Animation and timing

GSAP 3 with `useGSAP` (scope = section), `DrawSVGPlugin` and `MotionPathPlugin` registered. `rm = matchMedia('(prefers-reduced-motion: reduce)').matches` is read once on mount; every camera/focus duration below is multiplied by `rm ? 0 : 1`.

### 4.1 Camera model

The camera is a plain object `P = {x, y, w, h}` in room SVG user units. `render()` writes `viewBox="x y w h"` (2 decimals) to every `svg[data-cam]` in the section and sets each marker group to `scale((P.w / ew) * markerK)`, then repositions the tooltip. Measurements, refreshed before every move:

```
hero = section rect (hl, ht, hw, hh); svg = first svg[data-cam] rect (ew, eh)
ox = svg.left - hero.left - gsapX(camWrap);  oy = svg.top - hero.top - gsapY(camWrap)
scale(px per unit) = ew / P.w
fitRect(room, box) → P such that room bbox is contained in screen box (meet), same aspect as svg
ROOM = projected room bbox ≈ { x: 381.6, y: 368.7, w: 905.4, h: 776.2 }   (static viewBox attr = ROOM padded by 60)
REST  = fitRect(ROOM, { x:16-ox, y:64-oy, w:hw-32, h:hh-112 })            // 16px sides, 64px top, 48px bottom
minScale = ew / REST.w;  maxScale = max(4.5 * max(hw/ROOM.w, hh/ROOM.h), 3 * minScale)
markerK = clamp(minScale / 0.9, 0.6, 1)
clampPan(v): m = 24 * v.w / ew;  v.x ∈ [ROOM.x - m, ROOM.x + ROOM.w + m - v.w] (bounds swapped if inverted); same for y
STEP_IN = clampPan( centerOn(iso(560,575,70) ≈ (782.9, 696.7),
           scale = clamp(min(0.92 * max(hw/ROOM.w, hh/ROOM.h), 2.2 * min(hw/ROOM.w, hh/ROOM.h)), 1.15*minScale, maxScale),
           at screen center) )
zoomAround(f, cx, cy): s = clamp(scale*f, minScale, maxScale); keep the unit under (cx,cy) fixed; clampPan
setView(v, dur): if (ew / v.w <= 1.04 * minScale) { if zoomed: exitRoom(); return; }   // zooming out past rest leaves the room
                 zoomed = true; dur ? tween(P→v, dur, 'power3.out', overwrite) : (kill tweens; P = v; render())
```

Measured framings (viewBox):

| Viewport | REST | STEP_IN (default after entering) | exit target (door) |
|---|---|---|---|
| 1440x900 | `101.47 282.00 1465.64 933.76` | `286.48 372.77 1016.91 647.87` (scale ≈ 1.46 px/unit) | `-677 141 2232 1422` |
| 390x844 | (portrait fit) | `560.20 245.79 445.30 924.37` | n/a |

At 1440x900 one "Zoom out" key press from STEP_IN (factor 1/1.4) already crosses the 1.04 x minScale threshold and exits; one `-` key press (1/1.3) does not, two do.

### 4.2 Entering (door click on the landing)

1. Landing `button[data-room-door]` click: measure the door image's rect, inset it by 1/170 horizontally and 1/146 vertically (the drawn room inside the still image), call `enterRoom(imageRect, restRectInDocCoords, depth=18)`.
2. `setView('room')`: `html[data-view=room]`, `html[data-been-inside]`, scroll to top instantly, `scrollRestoration=manual`, CSS hides the page and shows the sky.
3. View listener calls `enter(takeEntry())`:
   - if phase was not `live`: `lightUp()` (every scene element instantly to full opacity, cables fully drawn, ambient loops started, see 04), terminal `login(user)` where user comes from `yg-lab` or `"guest"`; if a saved session exists the terminal prints "Last login: {Tue, Oct 6, 12:45} on tty1", "session restored. welcome back, **{user}**. type **help** to look around." and a blank line; save `yg-lab = {user, at: Date.now(), active: true}`; phase `live`; markers allowed.
   - if phase was already `live` (second visit in the same page load): resume the paused ambient timelines.
   - `zoomed = true` (sets `html[data-lab-zoomed]`, hides the header, enables grab cursor; first time per page load also shows the hint line for 5 s).
   - Camera: `P = fitRect(ROOM, entryBox)` so the SVG room lands exactly on top of the still image; render; `busy = true`; tween `P → STEP_IN`, **1.15 s, power3.inOut**, `overwrite: true`; `busy = false` on complete. Without an entry box (direct `setView('room')`), `P = STEP_IN` immediately.
4. HUD entrance is pure CSS: step outside `lab-fade-in 0.5s ease-out 0.3s backwards`, zoom dock same with 0.4s delay, terminal key `0.6s ease-out 0.4s`. `@keyframes lab-fade-in { 0% { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }`.

Measured with a fake clock (viewBox width at 150 ms steps): 2231 → 2229 → 2193 → 2006 → 1552 → 1179 → 1040 → 1018 → 1017 (done by 1.2 s).

### 4.3 Exiting to the page (`home()` → `exitRoom(d = 0.9)`)

Guarded by `busy`. Steps: hide tooltip, reset parallax, `gsap.to('[data-dock]', { autoAlpha: 0, duration: 0.2 })`, tween `P →` the door rect from `wayOut()` fitted with `fitRect(ROOM, doorRectInSectionCoords)` (or `REST` if the viewport size changed since entering), **0.9 s, power3.inOut**, `overwrite`. On complete: `busy=false`, `setView('classic')` (page reappears with the still image exactly where the room shrank to), then a non-passive `wheel` listener calls `preventDefault()` for **700 ms** so trackpad momentum does not scroll the page. Measured widths at 100 ms: 1017 → 1018 → 1039 → 1125 → 1353 → 1853 → 2105 → 2204 → 2229 → 2232.

When the view becomes `classic`, `sleep()` runs: kill camera tweens, hide tooltip, `zoomed=false`, forget the saved camera, overlay hidden, in-scene vinyl visible, dock `autoAlpha 1`, terminal hidden (`autoAlpha 0, yPercent -100`) if it was open, ambient timelines paused, focus cleared, terminal state closed. Phase stays `live`. Music is NOT stopped.

### 4.4 Opening a focus on an object (`openFocus(id)`, non-rack)

`busy = true` until the timeline completes. `saved = zoomed ? {...P} : REST`. Target camera: center the hotspot bbox at the section center with `scale = clamp(min(0.3*hw/bbox.w, 0.3*hh/bbox.h), 1.6*minScale, 4.5*minScale)` (the object fills 30% of the viewport on its limiting axis).

| t (s) | Target | Tween |
|---|---|---|
| 0 | `[data-dock]` | autoAlpha → 0, 0.3 |
| 0 | camera `P` | → target, **0.95, power3.inOut** |
| 0.35 | dim overlay | autoAlpha → 0.85, 0.5 (default ease power1.out) |
| 0.45 | `[data-lift]` | lift progress `t: 0 → 1`, **0.8, power3.inOut** (matrix below, recomputed every frame) |
| 0.45 | `[data-lift]` | opacity 0 → 1, 0.3 |
| 0.45 | in-scene vinyl (record only) | `opacity: 0` (set) |
| 1.05 | `[data-chrome]` | autoAlpha 0 → 1 and y 8 → 0, 0.35 |

Lift matrix (the signature effect): each object defines `face = [O, U, V]`, three room-space points spanning its flat surface (origin, end of the width axis, end of the height axis). Every frame:

```ts
const box = untransformedRect(liftEl);                         // temporarily set transform:none to measure
const [o, u, v] = face.map(p => { const [sx, sy] = toScreen(p, P, ew); return [sx + ox - box.x, sy + oy - box.y]; });
const faceM = [(u[0]-o[0])/box.w, (u[1]-o[1])/box.w, (v[0]-o[0])/box.h, (v[1]-o[1])/box.h, o[0], o[1]];
liftEl.style.transform = `matrix(${lerp(faceM, [1,0,0,1,0,0], t).map(n => n.toFixed(5)).join(',')})`;   // transform-origin: top left
```

At `t=0` the panel is squashed and skewed exactly onto the object's surface in the scene (for a wall certificate it is a small parallelogram on the wall; for the record it is the platter lying flat), and it unskews to its natural centered layout as the camera arrives. Measured CCNA open (100 ms steps): camera width 1017 → 1017 → 1006 → 965 → 859 → 640 → 435 → 363 → 339 → 335; dim 0 → .14 (0.4 s) → .40 → .64 → .77 → .84 → .85; lift opacity .24 (0.5 s) → .75 → .97 → 1; matrix scale .075 → .12 → .18 → .27 → .43 → .74 → .94 → .99 → 1 (1.3 s); chrome .25 (1.1 s) → .65 → .90 → 1 (1.4 s).

Record spin sync: before the lift, read the in-scene vinyl's computed rotation `a` (deg, from its `DOMMatrix`) and set the big disc's `animation-delay = -(a/360 * 1.8)s`, so the HTML disc continues the exact rotation phase of the SVG disc (both 1.8 s per turn, which is 33⅓ rpm).

### 4.5 Closing a focus (`closeFocus(id, then)`)

| t (s) | Target | Tween |
|---|---|---|
| 0 | `[data-chrome]` | autoAlpha → 0, 0.2 |
| 0 | lift progress | `t: 1 → 0`, **0.65, power3.inOut** |
| 0.25 | dim overlay | autoAlpha → 0, 0.5 |
| 0.25 | camera `P` | → saved, **0.9, power3.inOut** |
| 0.4 | `[data-lift]` | opacity → 0, 0.25 |
| 0.4 | in-scene vinyl (record) | `opacity: 1` (set) |
| 0.85 | `[data-dock]` | autoAlpha → 1, 0.4 |

On complete: `busy=false`, then `focus = next ?? null` (passing `next` chains straight into another `openFocus`, used by header picks and the inspector's "open the homelab map →"). Total about 1.25 s (measured: panel gone at 0.7 s, camera settled at 1.15 s, dock at 1.25 s).

### 4.6 Rack inspector (`rack`, `patch`, `switch`, `p340`, `ssd`, `pdu`)

openFocus for a part: same dock fade and camera tween (target: the rack bbox fitted into the `[data-stage]` rect with `scale = clamp(min(0.6*stage.w/rack.w, 0.82*stage.h/rack.h), 1.2*minScale, 6*minScale)`, centered on the stage), overlay autoAlpha **1** at 0.35 (0.5 s), then `inspector.enter()` at 0.4 and a 1.05 s pad.

Model pose `m = {x, y, s, rx, ry}` written as `translate3d(x,y,0) scale3d(s,s,s) rotateX(rx) rotateY(ry)`. Model unit size: `k = 460 / max(w,h,d)` px per unit for the part.

- `scenePose(part)`: screen position of the part's center in the room, `s = (0.9 * 1.32 * ew/P.w) / (k * sqrt(2/3))`, `rx = -35.264°`, `ry = -45°` (true isometric angles), so the CSS model starts exactly over the drawn part.
- `stagePose(part)`: stage center, `s = min(1.1, 0.92*min(stage.w, stage.h) / (diag*k), 0.86*stage.w / (max(w,d)*k*1.2))`; resting angles `rx=-16°, ry=-32°`.
- `enter()`: model fade container opacity 0; panel autoAlpha 0; timeline: progress 0 → 1 over **1 s power3.inOut** interpolating scenePose → stagePose (x, y, s, rx, ry); container opacity → 1 over 0.2 s at 0; panel `autoAlpha 0 → 1, y 16 → 0`, **0.45 s power3.out** at 0.6; then mode `idle`.
- Idle wobble (gsap.ticker, `T` seconds since idle): `rx = base.rx + 2.5*sin(0.6T)`, `ry = base.ry + 16*sin(0.32T)`, position and scale follow `stagePose` (so it re-centers on resize).
- Drag on `[data-stage]` (pointer capture): `base.rx = clamp(base.rx - 0.35*dy, -80, 30)`, `base.ry += 0.5*dx`; on release the wobble resumes from the new base.
- Part tab: if not animating, fade container to 0 over 0.16 s, swap part, set scale to 0.9 x target, fade in 0.3 s and scale to target over 0.45 s power3.out.
- `leave(cb)`: panel `autoAlpha 0, y 12` over 0.2 s; progress over **0.75 s power3.inOut** back to the scene pose (ry normalized to `-45 + 360*round((ry+45)/360)` so it never spins the long way); container opacity → 0 over 0.25 s at 0.5. closeFocus runs this at t=0 instead of the lift reversal.

### 4.7 Navigation tweens (all `overwrite: true`, `onUpdate: render`)

| Input | Effect | Duration / ease |
|---|---|---|
| Wheel | `zoomAround(exp(-dy * (ctrlKey ? 0.01 : 0.0015)), clientX, clientY)`; `dy *= 16` when `deltaMode === 1` | immediate set |
| Pinch (2 pointers) | pan by midpoint delta, then `zoomAround(dist/prevDist, midX, midY)` | immediate |
| Drag (1 pointer) | after more than 6 px cumulative `|dx|+|dy|`, pan by the pointer delta; sets `#hero[data-dragging]` and hides the tooltip | immediate |
| Zoom keys `+` / `−` (HUD) | `zoomAround(1.4 or 1/1.4, center)` | 0.35 s power3.out |
| Keyboard `+` `=` / `-` `_` | factor 1.3 / 1/1.3 | 0.35 s power3.out |
| `0` key / `⟲` | tween to STEP_IN | 0.8 s power3.out |
| Arrow keys | pan 90 screen px (`P.x += 90/scale`) | 0.4 s power3.out |
| Coarse tap on a tiny hotspot | `zoomAt(tapX, tapY, 2.2)`: scale x2.2 (clamped), tapped point moved to the center | 0.9 s power3.out |
| Resize (ResizeObserver, rAF-debounced) | focus open: re-target the focus; zoomed: keep center and px-per-unit scale; else REST | immediate |

### 4.8 Terminal drop-down

- open (`openTerm`): hide tooltip; `fromTo(term, {autoAlpha: 1, yPercent: -100}, {yPercent: 0, duration: 0.35, ease: 'power3.out'})`, then focus the hidden input (`preventScroll`).
- close (`closeTerm`): `to(term, {yPercent: -100, duration: 0.25, ease: 'power2.in'})`, then `autoAlpha: 0`.
- Measured in Chrome: fully open within about 400 ms; closed state `transform: translateY(-522px)`, `visibility: hidden`.

### 4.9 Power down after `exit` / `logout` / `reboot` (inside the room)

Timeline: terminal autoAlpha → 0 (0.25) at 0; `[data-tag]` opacity 0 (set); `[data-cable] path` drawSVG → "100% 100%" (0.7, power2.in) at 0; `[data-unit]` opacity → 0 (0.2, stagger 0.01 from end) at 0.1; the lights groups (room, desk, deskitems, camera, record) opacity → 0 (0.25, stagger 0.08) at 0.1; `[data-pool]` → 0 (0.6) at 0.1; `[data-base]` → 0.42 (0.6) at 0.3; `[data-cable]` opacity 0 (set); camWrap autoAlpha → 0 (0.7, power2.in) at 0.5. Then: `zoomed=false`, camera to REST, terminal reset (prints "System restarted." in `text-white/40` after a reboot), phase `intro`, terminal shown full screen as a login prompt (`autoAlpha 0 → 1`, 0.6 s power2.out, input focused on fine pointers). Also stops the music and clears the marker permission. `yg-lab.active` becomes `false`. Logging in again runs the normal boot (see 01) and, once `live`, `stepIn()` tweens to STEP_IN over 1.05 s power3.inOut.

### 4.10 CSS keyframes used by this area

```css
@keyframes lab-fade-in { 0% { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
@keyframes lab-caret   { 0%,49% { opacity:1 } 50%,to { opacity:0 } }         /* used with steps(1) */
@keyframes lab-spin    { to { transform: rotate(360deg) } }
.lab-spin      { transform-box:fill-box; transform-origin:50%; animation:1.8s linear infinite lab-spin; }   /* in-scene vinyl, always spinning */
.lab-disc-spin { animation:1.8s linear infinite lab-spin; }                                                  /* focus disc */
.lab-note { opacity:0 } html[data-lab-music] .lab-note { animation:2.6s ease-out infinite lab-note }       /* three ♪ ♫ ♪ glyphs above the deck, delays 0, .85, 1.7s */
@keyframes lab-note { 0% { opacity:0; transform:translate(0) } 18% { opacity:.9 } to { opacity:0; transform:translate(7px,-28px) } }
```

Plus `lab-mk-breathe` and `lab-mk-ping` (3.3). Ambient loops (packets on cables, firewall alert, CRT bars, LEDs) are documented in 04; they are paused when leaving the room and resumed on return.

### 4.11 Parallax

On fine pointers without reduced motion, `gsap.quickTo(camWrap, 'x'|'y', {duration: 1.4, ease: 'power3'})` follows the pointer: `x = -(clientX/innerWidth - 0.5) * 16`, `y = -(clientY/innerHeight - 0.5) * 9`. It is only active while `parallaxOn` is true, which is set by the intro power-up and cleared (and eased back to 0) whenever the camera zooms or a focus opens. In practice it is off for the whole time you are inside the room after "step inside"; the `-inset-4 md:-inset-6` bleed exists for it.

---

## 5. Interaction and state

### 5.1 State

| State | Values | Where it shows |
|---|---|---|
| view | `classic` / `room` | `html[data-view]` |
| phase | `init` → `off` (classic) or `intro` → `booting` → `live` | `#hero[data-phase]` |
| zoomed | bool | `html[data-lab-zoomed]` (header hidden, grab cursor, HUD rendered) |
| focus | `null` or hotspot id | `html[data-lab-focus]` (header hidden), hotspots off |
| termOpen | bool | terminal key `aria-expanded` |
| music | bool | `html[data-lab-music]`, music card mounted |
| hintsSeen | bool, persisted | markers hidden for good |
| markersAllowed | bool | true on enter (or 700 ms after a boot finishes), false after power-down |
| hintVisible | bool | hint line, true for 5 s the first time `zoomed` turns true per page load |
| busy | ref bool | guards picks, closes, home while a camera/focus timeline runs |

Marker visibility: `live && markersAllowed && !hintsSeen && !focus && !termOpen` (opacity transition 1000 ms).

### 5.2 Picking an object (`pick(id, pointer?)`)

```
if busy || focus || !hotspots[id]: return
if pointer && matchMedia('(pointer: coarse)') && hotspotMinScreenSide(id) < 28px:
    zoomAt(pointer.x, pointer.y, 2.2); showTip(id, autoHide=2s); return          // tap-to-zoom for tiny targets
if id === 'record': music = true                                                  // starts the music card
if termOpen: termOpen = false; closeTerm()
if !hintsSeen: hintsSeen = true; localStorage['yg-lab-hints'] = '1'
focus = id   → useLayoutEffect(openFocus(id))
```

Measured on 390x844 at STEP_IN: PDU 12.7 px and SSD 24.1 px trigger tap-to-zoom first; everything else opens directly.

Triggers: polygon `click` (passes `clientX/Y`), polygon `keydown` Enter or Space (no pointer, so never the zoom-first branch), header nav links while `view === 'room'` (dispatch `yg:pick` with Projects→`monitor`, Homelab→`rack`, Websites→`monitor`, Experience→`badge`, About→`resume`, Photography→`camera`, Contact→`phone`; if another focus is open it closes first and chains). Note the header is invisible while zoomed, so the header path is effectively unreachable inside the room.

### 5.3 Closing a focus

Esc (window keydown), the "✕ close" key (or "✕ back to the room" for the record, "✕" in the inspector), a click on the dim overlay or anywhere outside the panel and its chrome, the header logo (`yg:home`), "■ stop the music" (record). All are ignored while `busy` (for example during the 1.4 s opening).

### 5.4 Leaving the room

| Way | Behavior |
|---|---|
| "↙ step outside" key | if not busy and no focus: exit fullscreen if active, `exitRoom()` |
| Esc | priority chain: close focus → else close terminal → else exit fullscreen if active and `exitRoom()` |
| Zoom out past rest | wheel, pinch, `−` key or HUD `−` until `ew / v.w <= 1.04 * minScale` → `exitRoom()` |
| Header logo (`yg:home`) | same chain as Esc (focus → terminal → exit) |
| "classic view ↓" / "full gallery ↓" in panels | `setView('classic')` immediately (no shrink animation) and smooth-scroll to the section |
| After terminal `exit`: "back to the page" (top right of the login screen) | `setView('classic')` immediately; hidden during the first-visit opening |
| Browser Back | not handled: no history entries are pushed, so Back leaves the site (verified: went to the previous page) |

The terminal `open <section>` and the `nmap` service buttons call `scrollIntoView` on a section that is `display:none` while in the room, so inside the room they print "opening {section}…" and visibly do nothing.

### 5.5 Keyboard (window `keydown`, only while phase is `live` and view is `room`)

| Key | Condition | Action |
|---|---|---|
| Escape | always first | close focus, else close terminal, else exit fullscreen + leave room |
| (input/textarea/contenteditable target) | | stop here (so typing in the terminal is safe; a typed backtick is inserted as text) |
| `` ` `` | | toggle terminal (`preventDefault`); ignored if busy or a focus is open |
| any | focus open, terminal open, or Meta/Ctrl/Alt held | stop here |
| `+` `=` / `-` `_` | | zoom x1.3 / ÷1.3 around center (0.35 s) |
| `0` | | reset to STEP_IN (0.8 s) |
| ArrowLeft/Right/Up/Down | | pan ±90 px (0.4 s) |
| Tab / Shift+Tab | | moves through the 19 polygons (tabindex 0 only when hotspots are enabled), showing the tooltip and the putty outline via `:focus-visible` |
| Enter / Space | polygon focused | pick (no tap-zoom branch) |

Panel-local window listeners (mounted with the panel): projects CRT `ArrowUp`/`ArrowDown` cycle the file list (wraps) and `Enter` opens the selected item's link in a new tab unless the event target is a button or link; badge `ArrowLeft`/`ArrowRight` cycle employers; print `ArrowLeft`/`ArrowRight` cycle photos. Rack inspector: Esc closes; tabs are buttons.

### 5.6 Pointer handling details

- `pointerdown` on the section starts tracking only when phase is `live`, not busy, no focus, and the target is not inside `button, a, input, [data-term], [data-hud]`. Hotspot polygons are not excluded, so you can start a drag on an object.
- `pointermove` / `pointerup` / `pointercancel` are on `window`; pointers are kept in a `Map` by `pointerId`.
- A capture-phase `click` listener on the section swallows the click (`stopPropagation`, `preventDefault`) if the gesture moved more than 6 px, so a drag never opens an object.
- `wheel` is non-passive on the section and ignored when the target is inside the terminal.
- Tooltips: polygon `pointerenter`/`pointerleave` only for `pointerType === 'mouse'`, plus `focus`/`blur`. Text = short label (below), the record player is `quiet` (no tooltip, no `<title>`). Position: `left = clamp(bboxCenterX*scale, 70, ew-70)`, `top = bboxTop*scale`; if `top + oy < 84` the tip goes below the object (`bboxBottom`, `data-below`). Hidden while dragging, on any focus, terminal open or exit.
- Cursor: `pointer` on polygons, `grab` / `grabbing` on the room while zoomed, `grab`/`grabbing` on the inspector stage.

### 5.7 URL, history, storage

- No hash, query or history changes inside the room. The header's own logic strips any hash 1.5 s after load.
- `history.scrollRestoration` is `manual` while in the room, `auto` on the page.
- `localStorage['yg-lab']` = `{"user": string, "at": epochMs, "active": boolean}`: written on every enter (`active: true`) and on login; set `active: false` by `exit`/`reboot`. A pre-hydration inline script puts a visitor straight into the room intro on load unless `yg-lab.active` is true, the URL has a hash, or reduced motion is on (details in 01). A legacy plain-string value matching `/^[a-z0-9._-]{1,16}$/` is accepted as the user name.
- `localStorage['yg-lab-hints'] = '1'` after the first object is opened: the pulsing markers never appear again on that browser.
- `html[data-been-inside]` is set on the first step inside (the landing uses it for a name-line tweak, see 03).

### 5.8 "see it in the room →" (homelab section)

```ts
function seeItInTheRoom() {
  const door = document.querySelector('[data-room-door]');
  if (!door) return setView('room');
  window.scrollTo({ top: 0, behavior: 'instant' });
  requestAnimationFrame(() => (door as HTMLElement).click());
}
```

It performs exactly the same zoom-in as "step inside" and lands on the default STEP_IN framing. It does **not** focus the rack (verified: no `data-lab-focus`, default viewBox). If a rack focus is wanted, dispatch `yg:pick` with `'rack'` after the 1.15 s entry tween; that is a deviation from the original.

### 5.9 Music

Picking the record sets `music=true`: the card mounts in `<body>` with a muted-chrome video embed (`autoplay=1&controls=0&fs=0&disablekb=1&iv_load_policy=3&rel=0&playsinline=1`, `allow="autoplay; encrypted-media"`, `referrerPolicy="strict-origin-when-cross-origin"`), and `html[data-lab-music]` animates the three notes above the deck. Audio therefore comes from a third-party player, not from the page. Music keeps playing after the record focus closes and even after leaving to the classic page (the card stays fixed over the page). It stops via "■ stop" on the card, "■ stop the music" in the record focus (which also closes the focus), or a terminal power-down. The card is not repositioned around other UI, so it overlaps the rack inspector on desktop and several panels on phones (observed).

---

## 6. Responsive behavior

| Breakpoint | Changes |
|---|---|
| < 640 (base) | HUD inset 16px (`left-4 top-4`, `bottom-5`=20px); key legends hidden; hint at `bottom: 4.25rem`; focus layer `pt-14`; record focus top-aligned (`pt-20`) and caption hidden; panel paddings smaller (`p-3`, `p-2.5`, `p-4`); CRT screen fixed `h-[62svh]` and file list capped at 8.5rem with its own scroll; music card bottom-right (`bottom: 4.5rem`) |
| ≥ 640 `sm` | HUD inset 20px (`sm:left-5 sm:top-5`, `sm:bottom-6`=24px); legends visible ("esc", "0", "`"); hint `bottom: 28px`; focus layer `pt-16`; close key `pr-7` legend; CRT `aspect-[4/3]` with a `15rem` list column; music card top-right (`top: 4.5rem; right: 1.25rem`) |
| ≥ 768 `md` | camera wrapper bleed `-inset-6` (24px) instead of 16px; terminal text 14px and `px-8`; inspector switches to a left stage / right 22rem dialog (`md:right-[25rem]` stage, dialog `md:right-6` vertically centered, `max-h-[calc(100svh-6rem)]`) |
| < 768 inspector | stage is the top band `top-12 h-[46%]`, dialog is a bottom sheet `inset-x-3 bottom-3 max-h-[46svh]` |

Sizes are viewport-driven (`vw`, `svh`, `vmin`), so panels shrink to fit short landscape screens as well.

Coarse pointer (`(pointer: coarse)`):
- hint text "drag to look around · pinch to zoom · tap anything" (fine: "drag to look around · scroll to zoom · click anything"), chosen at render time;
- tap-to-zoom for hotspots under 28 px (5.2) with a 2 s tooltip;
- no hover tooltips, no parallax;
- terminal input is not auto-focused when the room becomes live, but opening the terminal does focus it (raises the soft keyboard); input font-size is 16px to avoid iOS zoom;
- pinch zoom and one-finger pan via Pointer Events with `touch-action: none` on `#hero`.

Fullscreen key only renders where `document.fullscreenEnabled` is true (absent on iPhone Safari). Fullscreen targets `section#hero`.

At 390x844 the STEP_IN framing is a tall crop centered on the desk and chair (the rack is cut at the left edge, the record player is off screen to the right); markers render at 60% size (`markerK` floor).

---

## 7. Accessibility and reduced motion

What the original does:
- Hotspots are `<polygon role="button" tabindex="0" aria-label>` with a `<title>` (except the record player), keyboard activatable with Enter/Space, with a visible `:focus-visible` outline (putty stroke and 10% fill) and the tooltip on focus.
- When a focus opens, hotspots get `tabindex=-1` and `data-hotspots="off"`; keyboard focus stays on the polygon (it is not moved into the panel). Only the rack inspector has `role="dialog"` and an `aria-label`; the other panels are plain divs without `aria-modal`, no focus trap, no focus restore.
- The terminal output is `aria-live="polite"`; the hidden input has `aria-label` "Terminal input" (or "Login name").
- Entering hides the door button (`display:none`), so keyboard focus drops to `<body>` (verified after entering with Enter on the door). The header stays in the tab order while invisible (`opacity:0; pointer-events:none`), so the next Tab stops are the invisible logo, 7 nav links and the resume link before the first hotspot.
- HUD keys have `aria-label`/`title` (zoom keys) or visible text.

Recommended for the rebuild (keeps the look, fixes behavior): give each panel `role="dialog" aria-modal="true" aria-label`, move focus to the close key after the open timeline, trap Tab inside the focus layer, restore focus to the originating polygon after close, and mark the header `inert` while `data-lab-zoomed` is set.

Reduced motion (`prefers-reduced-motion: reduce`):
- the inline script never auto-starts the room intro on load;
- every camera, lift, chrome, dock, overlay and inspector tween has duration 0 (instant cuts; verified: panel fully open 250 ms after the click);
- no pointer parallax; the HUD `motion-safe:` fade-ins and the CRT caret blink are skipped;
- CSS: `.lab-spin, .lab-disc-spin, .lab-mk-dot, LED classes { animation: none }`, `.lab-mk-ring { display: none }`, `.lab-tip { transition: none }`, music notes static at `opacity: .8`, keys have no transform/transition;
- ambient GSAP loops are not started (see 04).

---

## 8. Content model

```ts
type Vec3 = [x: number, y: number, z?: number];           // room space (see 04 for the iso projection)
type HotspotId =
  | 'monitor' | 'resume' | 'badge' | 'phone' | 'camera' | 'record' | 'print' | 'map' | 'poster'
  | 'cert-codepath' | 'cert-ccna' | 'cert-secplus' | 'cert-gux'
  | 'rack' | 'patch' | 'switch' | 'p340' | 'ssd' | 'pdu';
type RackPartId = 'rack' | 'patch' | 'switch' | 'p340' | 'ssd' | 'pdu';

interface Hotspot {
  id: HotspotId;
  label: string;            // aria-label + <title>, 3 to 40 chars ("Projects: the CRT", "Resume", "CCNA certificate", ...)
  quiet?: boolean;          // record player: no <title>, no tooltip
  points: string;           // polygon in projected SVG units
  face?: [Vec3, Vec3, Vec3];// origin, width-axis end, height-axis end of the flat surface the panel lifts off (all non-rack objects)
}
const TIP_LABEL: Record<HotspotId, string>;   // short tooltip text, 3 to 22 chars
const MARKED: HotspotId[] = ['monitor','resume','camera','record','rack','map','cert-secplus','print'];  // 8 pulsing markers, in this order

interface ProjectItem { name: string /* 13-31 */; description: string /* 142-207 */; stack: string[] /* 4-5 */; link: string; preview: string | null; }
interface ClientSite  { name: string; category: string; url: string; displayUrl: string; description: string /* 196-270 */; tags: string[] /* 4 */; preview: string; }
// CRT list = 4 projects + 2 client sites (6 "files"), each mapped to an 8.3 filename
interface Experience  { role: string; company: string; location: string; period: string /* "Mon YYYY to Mon YYYY|Present" */; type: string; bullets: string[] /* 2-4 x 69-154 chars */; }
interface BadgeStyle  { band: string /* hex */; org: string /* uppercase, 10-26 chars */; tab: string /* 9-15 chars */; }   // 3, parallel to Experience
interface Social      { key: 'email' | 'linkedin' | 'github' | 'instagram'; label: string; handle: string; href: string; }       // 4
interface Cert        { id: 'ccna' | 'secplus' | 'gux' | 'codepath'; name: string; full: string /* 17-41 */; issuer: string; note: string /* 18-42 */;
                        issued?: string; validThrough?: string; file?: string /* pdf */; thumb?: string /* 1200x927 png */;
                        verify?: { url: string; code: string /* 32 hex */ }; }   // 4: two with scan + verify + pdf, two typographic
interface Homelab     { host: string /* ~29 */; os: string /* ~27 */; services: { name: string; unit: string; short: string /* 24-42 */; role: string /* 79-114 */ }[] /* 7 */;
                        hardening: string[] /* 6 chips, 8-55 chars */; stories: string[] /* 3 x 114-143 */; }
interface RackPart    { kicker: string /* "the rack", "cabling", "network", "compute", "storage", "power · rear" */; title: string; specs: string[] /* 2-3 */;
                        amazon?: string; extra?: { label: string; href: string }; }    // 6, order PART_ORDER = rack, patch, switch, p340, ssd, pdu
interface RoomContent {
  projects: ProjectItem[]; sites: ClientSite[]; experience: Experience[]; badgeStyles: BadgeStyle[];
  socials: Social[]; photos: string[] /* 9, first 6 shown on the camera LCD */; instagramUrl: string;
  certs: Cert[]; homelab: Homelab; rackParts: Record<RackPartId, RackPart>;
  resumeUrl: string /* pdf */; resumeImage: string /* page render, 17:22 */; poster: { src: string; alt: string };
  music: { embedSrc: string; artist: string; title: string };
  contactPitch: string /* ~75 chars */; owner: { name: string; photo: string /* portrait, used on badge, phone, camera */; initials: string };
}
```

Generic UI labels (verbatim):
- HUD: "↙ step outside" + legend "esc"; zoom keys "−" "+" "⟲" "⛶" with labels "Zoom out", "Zoom in", "Reset view", "Full screen", legend "0"; "›_ terminal" + legend "`".
- Hints: "drag to look around · scroll to zoom · click anything" / "drag to look around · pinch to zoom · tap anything".
- Tooltip short labels (generic ones): "Projects", "Resume", "Experience", "Contact", "Photography", "Photo print", "Network map", "The rack", "Patch panel", "PDU"; the others are the poster subject, certificate short names, and hardware model names.
- Focus chrome: "✕ close" + "esc", "✕ back to the room", "classic view ↓", "full gallery ↓", "Open {name} ↗", "Open PDF ↗", "Download", "Verify at {issuer} ↗", "code {code}", "@{handle} ↗", "Open @{handle} on {service} ↗", "■ stop the music", "←" "→" with "Previous photo" / "Next photo", "{i} / {n}".
- CRT: "{INITIALS}-DOS 6.22 · C:\PROJECTS", "{n} file(s)", "── client work ──", "↑↓ select · ⏎ open", "C:\>", "█", "{INITIALS}-386".
- Phone: "9:41", "▮▮▮", "Email me". Camera: "Follow", "▶ MENU". Record: "33⅓ rpm". Certificate: "certified". Map: "homelab.map", "Services", "Hardening", "Things I've debugged".
- Inspector: "{kicker} · {n}/6", "✕" (aria "Close"), "running on it", "open the homelab map →", "View on Amazon ↗", tabs "Rack" "Patch panel" "Switch" "P340 Tiny" "SSD" "PDU", "drag to rotate · esc to go back".
- Music card: "♪ now playing" (rendered uppercase), "■ stop".
- Terminal footer: "tty1 · penguin", "close (` or esc)". Session lines: "Last login: {date} on tty1", "session restored. welcome back, {user}. type help to look around." (command set and outputs: see 01).
- Landing/homelab triggers: "step inside →" (aria "Step inside my room"), "see it in the room →".

---

## 9. Assets

| Original | Used in | Replacement plan |
|---|---|---|
| Owner portrait photo (`/me.jpg`) | badge (80x96 crop, focus 50% 32%), phone avatar (64 round), camera LCD avatar (28 to 36 round) | Any original portrait or a generated avatar; keep 3:4 source so the badge crop works |
| Resume page render (PNG, 17:22) + PDF | resume panel, Open/Download | Your own resume render at about 1224x1584 and PDF |
| Two certificate scans (1200x927 PNG) + PDFs + verify URLs/codes | cert panels | Your own certificates; for those without a scan use the typographic layout (no image) |
| 9 photography images (3:2 and portrait mix) | print panel (`object-contain` in a 1.375 box), camera LCD grid (first 6, square crops) | Your own photos, at least 1600px long edge |
| Poster image (square) | poster panel | Original square artwork; avoid real-person likeness unless licensed |
| Project previews (16:9, top-anchored) and client-site previews | CRT detail pane | Your own screenshots at 1280x720 |
| Third-party video embed for music (commercial track) | music card | Use a royalty-free or self-owned track: either a self-hosted `<audio>` with the same card UI (200x200 cover art square instead of the iframe) or an embed of a track you have rights to. Do not reuse the original video or label text |
| Vinyl label text (artist/title) in scene and focus disc | record | Original label text matching your track |
| Brand wordmarks rendered as colored text (issuer names) | typographic certificates | Use your own issuers' names in plain colored text; no logos |
| Photo-service look on the camera LCD (blue "Follow" pill) | camera panel | Keep the generic "profile + 3x2 grid" layout but use a neutral accent rather than another service's brand blue |
| Hardware product names and store links | inspector | Your own hardware and links |
| Fonts: Geist, Geist Mono via next/font | all | Same (open source) |
| Glyph icons: ↙ ⟲ ⛶ ›_ ✕ ■ ♪ ▶ ▮ ✉ ◎ | HUD and panels | Unicode, no icon font |

Nothing in this area loads raster UI chrome: the CRT, badge, phone, camera body, vinyl and inspector models are all CSS/inline SVG and can be rebuilt exactly.

---

## 10. Implementation plan

### 10.1 Components (all inside one `"use client"` boundary)

```
app/page.tsx (server)          → <LabHero/> (client) as the first child of <main>, followed by the classic sections
lib/view-store.ts              → setView, enterRoom, takeEntry, setDoor, findWayOut, wayOut, useView, events (2.1)
components/lab/LabHero.tsx     → owns phase/focus/term/music/zoom state, the camera controller, keyboard map, renders the tree in 2.2
components/lab/useRoomCamera.ts→ P object, measure(), render(), fitRect, clampPan, zoomAround, tweens (4.1), pointer/wheel/pinch handlers (5.6)
components/lab/RoomArt.tsx     → memoized SVG scene (spec 04)
components/lab/HotspotLayer.tsx→ polygons from HOTSPOTS, props {enabled, onPick, onHover}
components/lab/MarkerLayer.tsx → 8 markers, props {show}
components/lab/HudKeys.tsx     → step outside, zoom dock, hint, terminal key
components/lab/FocusLayer.tsx  → shell (2.4) + PANELS map: CrtPanel, ResumePanel, BadgePanel, PhonePanel, CameraPanel, RecordPanel, PrintPanel, MapPanel, PosterPanel, CertPanel
components/lab/RackInspector.tsx + Box3D.tsx (6-face CSS cuboid) + part face SVGs
components/lab/Terminal.tsx    → shared with the intro (spec 01), mode "shell"
components/lab/MusicCard.tsx   → portal to body
components/ui/Key.tsx          → .key variants (or plain classes in globals.css @layer components)
```

Use `useGSAP(() => {...}, { scope: sectionRef })` for the camera/timeline closure and expose an imperative API object (`enter`, `home`, `openFocus`, `closeFocus`, `openTerm`, `closeTerm`, `zoomBy`, `zoomAt`, `resetView`, `nudge`, `showTip`, `hotspotPx`, `poseOf`, `sleep`) through a ref, as the original does. Register `useGSAP`, `DrawSVGPlugin`, `MotionPathPlugin` (all free since GSAP 3.13).

### 10.2 Order of operations that matter

1. `focus` state change → `useLayoutEffect(() => focus && api.openFocus(focus), [focus])`, so the panel DOM (`[data-lift]`, `[data-chrome]`, `[data-stage]`) exists and is measurable before the first frame.
2. Close sets `focus = null` only in the close timeline's `onComplete`; the panel stays mounted while it animates out.
3. Each panel is keyed by id so switching objects remounts it.
4. Measure the lift box with `transform: none` temporarily (the element is mid-transform otherwise).
5. Compute the face matrix from the live camera on every update; do not precompute, because the camera is tweening at the same time.
6. Keep `busy` in a ref, not state, and check it at the top of every handler.
7. The view listener must call `takeEntry()` synchronously inside the `setView` dispatch (the entry box is cleared right after).
8. Read `prefers-reduced-motion` once on mount and multiply durations by `rm ? 0 : 1` (GSAP accepts 0).

### 10.3 Gotchas

- All camera-driven SVGs share one viewBox and the same box (`absolute inset-0` inside the bleeding wrapper); compute `ew/eh` from the SVG, not the section.
- The wrapper is `pointer-events-none`; polygons need `pointer-events: all` explicitly.
- Polygon `stroke-width` is in user units; that is intentional (it thickens when zoomed).
- Use `svh` units for terminal and panel caps; on mobile Safari `vh` would include the URL bar.
- Wheel must be a non-passive listener (`{ passive: false }`); React's `onWheel` is passive.
- Pointer-capture is only used in the inspector; the room drag uses window listeners plus a capture-phase click guard.
- The header must hide on `data-lab-zoomed`; otherwise it overlaps the step outside key (both top-left area). Prefer `inert` as well.
- The music card is outside the section (portal) and survives `setView('classic')`; decide whether to keep that (original) or stop music on exit.
- Fix or reproduce the music card overlap with the inspector and phone panels (original overlaps).
- The `data-active` hotspot style exists in CSS but the original never passes `active`; harmless to omit.
- `document.fullscreenEnabled` and `matchMedia('(pointer: coarse)')` are read during render; guard for SSR (`typeof window`) or compute in an effect to avoid hydration mismatch (the HUD only renders client-side after `live`, so the original gets away with it).

---

## 11. Reference screenshots

All under `C:/Users/krisg/AppData/Local/Temp/claude/C--/decae922-eee1-4676-b27b-70265c1bf4af/scratchpad/ref/room-ui/` (`d-` = 1440x900 fine pointer, `m-` = 390x844 touch, `d-rm-` = desktop with reduced motion, `d-f-` = fake-clock frames). Probe scripts: `scratchpad/tools/room-ui-probe.mjs` (phases enter, hotspots, panels, terminal, zoom, exit, nav, homelab, firstload), `room-ui-frames.mjs` (deterministic frames), `room-ui-detail.mjs`, `room-ui-music.mjs`.

| File(s) | Shows |
|---|---|
| `d-00-landing.png`, `m-00-landing.png` | Landing with the door image before entering |
| `d-01-enter-00..11.png`, `d-01-enter-montage.png`, `m-01-enter-*` | Real-time enter zoom (about 120 ms apart) |
| `d-f-enter-0000..1500.png` | Enter zoom at exact 150 ms steps |
| `d-02-room-live.png`, `m-02-room-live.png` | Live room at STEP_IN with HUD, hint and markers |
| `d-03-room-after-hint.png`, `m-03-room-after-hint.png` | Same after the 5 s hint timeout |
| `d-10-hover-{monitor,rack,print,p340,cert-ccna,record}.png`, `d-10-hover-montage.png` | Hover highlight and tooltip (print shows the below-variant; record shows none) |
| `d-11-focus-visible-hotspot.png` | Keyboard focus outline + tooltip on a certificate (2x DPR crop) |
| `d-11-focus-visible.png` | Tab sample landing on an invisible header link (a11y issue) |
| `d-12-marker-closeup.png` | Marker on the CRT (2x DPR) |
| `d-20-open-{id}.png` for all 19 ids, `d-20-open-montage-1/2.png` | Every opened state on desktop |
| `d-20-open-{id}-a.png` | 250 ms after the click (camera just starting) |
| `d-21-monitor-next.png`, `d-21-badge-next.png`, `d-21-print-next.png`, `d-21-rack-switch.png` | Arrow-key cycling and inspector tab switch |
| `d-22-close-{monitor,record}-0..3.png`, `d-22-transition-montage.png` | Close animation in 250 ms steps |
| `d-f-cert-ccna-0000..1400.png`, `d-f-cert-ccna-open-montage.png` | Close of a certificate at exact 100 ms steps (panel folding back onto the wall) |
| `d-24-music-card-room.png`, `d-25-music-card-classic.png` | Music card in the room and persisting over the classic page |
| `d-30-term-open-0..3.png`, `d-30-term-open.png`, `d-31-term-help.png`, `d-32-term-closed.png`, `d-30-term-montage.png` | Terminal drop-down, help/neofetch/ls output, closed |
| `d-33-exit-0..5.png`, `d-33-exit-done.png` | `exit` command power-down and the login screen with "back to the page" / "skip intro →" |
| `d-40-wheel-in.png`, `d-41-dragged.png`, `d-42-reset.png`, `d-43-plus.png`, `d-44-zoomout-1.png`, `d-45-zoomout-2.png` | Wheel zoom, drag pan, reset, `+`, zoom out leading to exit |
| `d-50-exit-00..09.png`, `d-50-exit-montage.png`, `d-51-exited.png`, `d-f-exit-*.png` | Esc exit shrink into the landing image |
| `d-60-firstload.png`, `d-61-firstload-9s.png` | First visit without storage (intro in the room, ends on the page) |
| `d-70-pick-phone.png`, `d-71-pick-camera-while-phone.png` | `yg:pick` opening a focus and chaining to another |
| `d-80-homelab-enter-0..5.png`, `d-81-homelab-entered.png` | "see it in the room →" entry (default framing, no focus) |
| `d-rm-20-open-{monitor,record}(-a).png`, `d-rm-22-close-*.png` | Reduced motion: instant open/close |
| `m-20-open-{id}.png` for all ids, `m-20-open-montage-1/2.png` | Every opened state on mobile (record top-aligned, inspector bottom sheet) |
| `m-20-tapzoom-pdu.png`, `m-20-tapzoom-ssd.png` | Tap-to-zoom on tiny hotspots with the 2 s tooltip |
| `m-21-*.png`, `m-22-close-*.png` | Mobile cycling and closing |
| `m-30-term-open*.png`, `m-31-term-help.png`, `m-33-exit-*.png`, `m-30-term-montage.png` | Mobile terminal (58svh), help, power-down and "Enter as guest" login |
| `m-40-pinch-in.png`, `m-41-dragged.png` | Pinch zoom and one-finger pan |

---

## 12. Open questions and uncertainties

- The header-nav pick path (`yg:pick` from nav links while in the room) is implemented but unreachable in practice because the header is hidden whenever the room is zoomed, which is always true after entering. Whether any state exists where the room is live and unzoomed (other than right after a resize race) was not found.
- The `.lab-hot[data-active]` style exists in CSS, but the original never passes an active id to the hotspot layer, so it never applies; intent unknown (probably the focused object was meant to stay outlined).
- The fullscreen key was verified in headless Chrome only; behavior on iOS (expected hidden) and in Firefox was not tested.
- Tooltip vertical threshold (`84px`) is relative to the camera wrapper offset; with the 24px bleed this is about 60px from the top of the viewport on desktop. Verified for the print and Google UX certificate only.
- Parallax inside the room: per code it is disabled for the whole live session after entering via the door. It may briefly apply after a terminal power-down and re-login, but the step-in tween cancels it; not visually verified.
- The music embed's own UI (cover image, title overlay) comes from the third-party player and varies; only the card shell is specified.
- Exact text of the panel captions and actions depends on the owner's content (issuers, handles, names); placeholders are given.
- Browser Back was verified only in a fresh tab where the previous entry was `about:blank`; there is no in-app history, so Back always leaves the page.
- In one probe the first Tab after entering reported an element whose text was the whole header nav; a second probe showed focus on `<body>` and then the header logo. Either way the invisible header precedes the hotspots in the tab order; the exact first stop may depend on where focus was before entering.
