# 01 · Intro terminal (first-visit boot sequence)

Area key: `intro`. Scope: everything from first paint until the landing page (classic view) is revealed, plus the terminal component itself (it is reused as the in-room shell and as the post-logout login screen, so its full command set lives here).

All timings below were read from the shipped bundle and then confirmed with headless Chrome frame captures and a per-frame state logger (see section 11). "T0" means the moment React mounts the lab component (hydration), which was 530 to 630 ms after navigation start in the captures.

---

## 1. Overview

On a first visit the page does not open on the portfolio. It opens on a full-screen, pure black Linux text console (Debian tty1 style) that types its own login (the default user is `guest`), prints a system banner listing the homelab services with green status dots, types `boot`, prints a systemd-style `[  OK  ]` boot log, and then fades away to reveal a night sky in which an isometric SVG room "powers on" with a fluorescent-tube flicker. When the room is fully lit, the camera settles onto exactly the spot where the landing page shows a still image of the same room, and the view swaps to the landing page with no visible seam. The whole thing runs on its own in about 9.5 s; there is no "press any key" gate. A quiet `skip intro →` link in the top right cuts it short at any point. The feel is calm, terse and technical: monospace text, no sound, no progress bar, very little color besides a soft green.

The intro is shown once. Finishing or skipping it stores a session in `localStorage["yg-lab"]` with `active: true`, and every later load goes straight to the landing page. It is also bypassed when the URL has a hash or the user prefers reduced motion.

---

## 2. Structure

### 2.1 Page-level wiring

```
<html data-view="classic" class="...font variables... h-full antialiased">   (SSR value; an inline script may flip it before paint)
<body class="min-h-full bg-[#080808] text-[#f0f0f0]">
  <div hidden>…</div>
  <script> legacy boot flag </script>                 (2.2, script A)
  <noscript><style>#boot-intro{display:none}</style></noscript>
  <script> intro gate </script>                       (2.2, script B)
  <header class="fixed top-0 left-0 right-0 z-50 …">  (site nav, hidden while the intro runs)
  <main>
    <div data-room-sky data-sky-vars aria-hidden class="pointer-events-none fixed inset-0 overflow-hidden"
         style="background:linear-gradient(180deg,#06080f 0%,#070a13 100%)">  (night sky, only visible in room view)
    <section id="hero" data-phase="init|intro|booting|live|off" …>        (the lab: room SVG, terminal, intro controls)
    …landing hero (sticky sky + name + mini-room "step inside" button)…
    <section id="projects"> … <section id="contact">
  </main>
  <div data-classic class="relative z-10" …>  (footer area)
```

View switching is pure CSS on `html[data-view]` (2.4). The intro is the `room` view in phases `intro` and `booting`.

### 2.2 Pre-hydration inline scripts (first children of `<body>`)

Script A (legacy, has no visible effect today):
```
try { if (localStorage.getItem('yg-boot') || matchMedia('(prefers-reduced-motion: reduce)').matches)
        html.dataset.boot = 'seen' }
catch { html.dataset.boot = 'seen' }
```
It hides an element `#boot-intro` that no longer exists in the markup. Nothing in the JS reads or writes `yg-boot`. Keep or drop; it changes nothing on screen.

Script B (the real intro gate):
```
let s = null
try { s = JSON.parse(localStorage.getItem('yg-lab') || 'null') } catch {}
if ((s && s.active) || location.hash || matchMedia('(prefers-reduced-motion: reduce)').matches) return
html.dataset.view = 'room'
html.dataset.labIntro = ''
html.dataset.opening = ''
history.scrollRestoration = 'manual'
scrollTo(0, 0)
```
Because it runs before the body content paints, a first-time visitor never sees a flash of the landing page.

### 2.3 Lab section tree during the intro (`section#hero`)

```
section#hero  data-phase  class="relative min-h-[100svh] overflow-clip bg-[#050706]"   (bg overridden to transparent by CSS: `#hero{background:0 0}`)
├─ div  (room "camera" layer, GSAP target "roomLayer")
│      class="pointer-events-none absolute -inset-4 opacity-0 md:-inset-6"
│      ├─ <RoomSvg/>            several <svg data-cam viewBox=… preserveAspectRatio="xMidYMid meet"> stacked (room art, owned by the room spec)
│      ├─ <HotspotMarkers/>     svg[data-cam], hidden during the intro
│      ├─ <Hotspots/>           svg[data-cam][data-hotspots="off"] during the intro
│      └─ div[data-tip]         hover tooltip (unused in the intro)
├─ div  class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050706] to-transparent"  (display:none via CSS)
├─ div  (focus scrim) class="invisible absolute inset-0 z-30 bg-[#030504]/80 opacity-0"     (unused in the intro)
├─ div[data-term]  (console wrapper, GSAP target "console")
│      intro/booting/off: class="fixed inset-x-0 top-0 opacity-0 z-30 h-[100svh]"
│      live:              class="fixed inset-x-0 top-0 opacity-0 z-[55] h-[min(58svh,34rem)] border-b border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)]"
│      └─ <Terminal mode autoplay onBoot onLogout onClose/>   (2.5)
└─ (phase intro|booting only) div  class="absolute right-5 top-5 z-[60] flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.25em] sm:right-8 sm:top-7"
       ├─ (only when NOT the first-visit intro) button "back to the page"   class="text-white/40 transition-colors hover:text-white/85"
       └─ button "skip intro →"                                            class="text-white/40 transition-colors hover:text-white/85"
```

Note on the skip label: the wrapper has `uppercase`, but Tailwind preflight sets `button { text-transform: none }`, so the label renders lowercase (`skip intro →`) with the wrapper's 0.25em tracking. Reproduce it lowercase.

Live-only children (dock buttons, zoom controls, hint line, `›_ terminal` button) belong to the room spec; they only matter here because the `›_ terminal` dock button can flash for about 0.5 s on mobile at the very end of the intro (section 4.7).

### 2.4 Global CSS that drives the intro (unlayered, after Tailwind)

```css
header { transition: opacity .6s; }                     /* wins over the header's transition-all utility */
html[data-lab-intro] header,
html[data-lab-focus] header,
html[data-lab-zoomed] header { opacity: 0; pointer-events: none; }

html[data-opening] #hero [data-term] { opacity: 1 !important; }   /* console visible from first paint, before GSAP owns it */

html[data-view="classic"] #hero,
html[data-view="room"] #hero ~ *,
html[data-view="room"] [data-classic] { display: none; }

[data-room-sky] { visibility: hidden; }
html[data-view="room"] [data-room-sky] { visibility: visible; }

#hero { background: 0 0; }
#hero > .bg-gradient-to-b,
#hero svg[data-cam] > ellipse[fill="url(#lab-halo)"] { display: none; }

html[data-view="room"], html[data-view="room"] body { overscroll-behavior: none; overflow: hidden; }
html[data-view="room"] #hero { touch-action: none; height: 100svh; }
html[data-lab-intro], html[data-lab-intro] body { overscroll-behavior: none; overflow: hidden; }
html[data-lab-intro] #hero ~ *, html[data-lab-intro] footer { visibility: hidden; }

@keyframes lab-caret { 0%,49% { opacity: 1 } 50%,to { opacity: 0 } }
@keyframes lab-fade-in { 0% { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
```

### 2.5 Terminal component tree

```
div  class="relative flex h-full w-full flex-col bg-black text-left"   onClick → focus input (unless mode==="busy")
├─ div (scroller)  aria-live="polite"
│     class="flex-1 cursor-text overflow-y-auto font-mono text-[13px] leading-[1.6] text-[#cfcfcf]
│            [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin] md:text-[14px]
│            {shell ? 'px-5 py-4 md:px-8' : 'px-5 pb-5 pt-16 md:px-10 md:py-8'}"
│   ├─ div × N   (one per printed entry; buffer keeps the last 200 entries plus the new batch)
│   └─ mode==="busy"
│        ? span.caret-busy  class="inline-block w-[0.6em] border-b-2 border-[#e8e8e8] motion-safe:animate-[lab-caret_1.05s_steps(1)_infinite]"  content: NBSP
│        : p.prompt  class="relative whitespace-pre-wrap break-words"
│             ├─ span.font-bold.text-white  "{user}@penguin:~$ "  or  "penguin login: "
│             ├─ {current input text}
│             ├─ span.caret aria-hidden  class="inline-block w-[0.6em] translate-y-[0.1em] border-b-2 border-[#e8e8e8]
│             │                                 {focused ? 'motion-safe:animate-[lab-caret_1.05s_steps(1)_infinite]' : 'opacity-40'}"  content: NBSP
│             └─ input  (invisible, covers the prompt line)
│                  class="absolute inset-0 h-full w-full cursor-text bg-transparent text-[16px] text-transparent caret-transparent opacity-0 outline-none"
│                  aria-label = user ? "Terminal input" : "Login name"
│                  autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="go"
│                  readOnly while autoplaying
├─ (mode==="intro" && !autoplay) div.hint-row
│     class="pointer-events-none flex items-center justify-between gap-3 px-5 pb-5 font-mono text-[11px] text-white/35 md:px-10 md:pb-8"
│     ├─ button "Enter as guest"  class="key key-light pointer-events-auto hidden w-full [@media(pointer:coarse)]:inline-flex"
│     └─ span  class="ml-auto [@media(pointer:coarse)]:hidden"
│            user ? "type help, or press enter to power on the lab" : "type any name and press enter (or just enter)"
└─ (mode==="shell" && onClose) div.footer
      class="flex items-center justify-between border-t border-white/[0.08] px-5 py-1.5 font-mono text-[11px] text-white/35 md:px-8"
      ├─ span "tty1 · penguin"
      └─ button  class="hover:text-white/80"  "close " + span.text-white/25 "(` or esc)"
```

Mode mapping from the lab phase: `intro → "intro"`, `live → "shell"`, `init | booting | off → "busy"`.

Every blank line in the console is a `<p>` whose only child is a non-breaking space (U+00A0). A regular space would collapse to zero height. The caret spans also contain a single NBSP.

### 2.6 Printed line templates (first-visit content)

| Block | Markup / format |
|---|---|
| tty header (always first) | `<div><p>Debian GNU/Linux 13 penguin tty1</p><p>NBSP</p></div>` |
| login echo | `<p class="whitespace-pre-wrap break-words"><b class="font-bold text-white">penguin login: </b>{typed}</p>` |
| banner (`<Banner user>`) | `<div class="mb-1">` containing, in order: kernel line (dim), NBSP line, intro line, 7 service rows, NBSP line, "Last login" line, welcome line, NBSP line |
| kernel line | dim span: `Linux penguin 6.12.43+deb13-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.12.43-1 x86_64` |
| intro line | `<p>` with leading `"  "` (collapses, renders flush left): bold white owner name, then `, portfolio. Everything below is real and running:` |
| service row | `<p class="flex"><span class="shrink-0 whitespace-pre">"  " + <span class="text-[#7bd88f]">●</span> + " " + unit.padEnd(11)</span><span class="text-[#8a8a8a]">{short description}</span></p>` (description wraps with a hanging indent) |
| last login | `<p class="whitespace-pre-wrap">Last login: {Www Mmm DD HH:MM:SS YYYY} on tty1</p>` using the current local time; DD is padded with a space, so single-digit days show two spaces (`Tue Oct  6 12:31:21 2026`) |
| welcome | `<p class="whitespace-pre-wrap">  welcome, <b>{user}</b>. type <b>help</b>, or press <b>enter</b> to power on the lab.</p>` (2-space indent preserved) |
| command echo | `<p class="whitespace-pre-wrap break-words"><b>{user}@penguin:~$ </b>{command}</p>` |
| boot start | `<p class="text-[#8a8a8a]">powering on the homelab…</p>` (single-character ellipsis) |
| boot OK row | `<p class="flex text-white/60"><span class="shrink-0 whitespace-pre">[<span class="text-[#5fd07a]">  OK  </span>] <span class="text-white/85">{host.padEnd(11)}</span> </span><span>{status}</span></p>` |
| boot final row | `<p class="whitespace-pre-wrap text-white/60">[<green>  OK  </green>] Reached target <span class="text-white/85">graphical.target</span> - the room.</p>` |
| lab online (printed into the already hidden console) | `<p class="mt-1 text-white">lab online. welcome, {user}.</p>` |

Bold (`aG`) = `span.font-bold.text-white`. Dim (`aX`) = `span.text-[#8a8a8a]`. Link (`aq`) = `a.text-white.underline.decoration-white/30.underline-offset-2.hover:decoration-white/80`, `target=_blank rel="noopener noreferrer"` except `mailto:` and site-relative links.

---

## 3. Styling

### 3.1 Tokens used by the intro

| Token | Value | Use |
|---|---|---|
| console background | `#000000` (`bg-black`) | terminal root |
| console text | `#cfcfcf` | default line color |
| bold / prompt | `#ffffff`, weight 700 | prompt, owner name, user name, `help`, `enter` |
| dim | `#8a8a8a` | kernel line, service descriptions, help descriptions, misc command output |
| status dot | `#7bd88f` | `●` in the banner |
| OK green | `#5fd07a` | `  OK  ` in boot rows |
| boot row base | `rgba(255,255,255,0.60)` | brackets and status text |
| boot host | `rgba(255,255,255,0.85)` | host column, `graphical.target` |
| error accent | `#ff8a8a` | `nice try.` (su / login) |
| reboot note | `rgba(255,255,255,0.40)` | `System restarted.` |
| caret | `border-bottom: 2px solid #e8e8e8`, width `0.6em` | underline caret |
| skip / back link | `rgba(255,255,255,0.40)`, hover `rgba(255,255,255,0.85)` | intro controls |
| hint row | `rgba(255,255,255,0.35)` | bottom hint, shell footer |
| shell footer key hint | `rgba(255,255,255,0.25)` | `(` or esc)` |
| shell divider | `rgba(255,255,255,0.08)` top border, `rgba(255,255,255,0.10)` bottom border on the drop-down panel |
| sky behind the console | `linear-gradient(180deg,#06080f 0%,#070a13 100%)` | `[data-room-sky]` |

### 3.2 Typography (computed, Chrome)

| Element | Family | Size / line-height | Weight | Tracking | Notes |
|---|---|---|---|---|---|
| console text, < 768 px | `"Geist Mono", "Geist Mono Fallback"` | 13 px / 20.8 px (1.6) | 400 | normal | |
| console text, ≥ 768 px | same | 14 px / 22.4 px | 400 | normal | character advance measured at 8.4 px (caret width 0.6em = 8.39 px) |
| prompt / bold spans | same | inherit | 700 | normal | Geist Mono is variable 100 to 900 |
| hidden input | same | 16 px / 25.6 px | 400 | normal | 16 px prevents iOS focus zoom; text and caret transparent |
| skip / back links | Geist Mono | 11 px / 16.5 px | 400 | 0.25em (2.75 px) | lowercase (see 2.3) |
| hint row / shell footer | Geist Mono | 11 px | 400 | normal | |
| "Enter as guest" | `var(--font-geist-mono), ui-monospace, monospace` | 13 px | 600 | normal | `.key .key-light` |

### 3.3 Layout numbers

| Item | < 640 | 640 to 767 | ≥ 768 |
|---|---|---|---|
| console wrapper | `position:fixed; inset-x:0; top:0; height:100svh; z-index:30` | same | same |
| scroller padding (intro / busy) | 64 px top, 20 px sides, 20 px bottom | same | 32 px top and bottom, 40 px sides |
| scroller padding (shell) | 16 px vertical, 20 px sides | same | 16 px vertical, 32 px sides |
| intro controls wrapper | `top:20px; right:20px; z-index:60`, gap 24 px | `top:28px; right:32px` | same as 640 |
| hint row padding | 0 20px 20px | same | 0 40px 32px |

Measured at 1440×900: first text line box at (40, 32), lines every 22.4 px, prompt line at y = 416.6 after the banner, skip link box (1287.6, 28, 120.4×16.5). At 390×844: first line at (20, 64), prompt at y = 587.9, skip link (249.6, 20, 120.4×16.5).

### 3.4 `.key` button styles (used by "Enter as guest")

```css
.key { height:2.75rem; font-family:var(--font-geist-mono),ui-monospace,monospace; white-space:nowrap; user-select:none;
  color:#ffffffdb; background:linear-gradient(#2c3035,#1c1f23); border-radius:8px; justify-content:center; align-items:center;
  gap:.5rem; padding:0 1.25rem; font-size:13px; font-weight:600; display:inline-flex; position:relative;
  transition:transform .1s, box-shadow .1s, color .15s;
  box-shadow: inset 0 1px #ffffff1a, 0 3px #0a0b0d, 0 6px 14px #0000008c; }
.key:hover { color:#fff; transform:translateY(-1px); box-shadow: inset 0 1px #ffffff1a, 0 4px #0a0b0d, 0 8px 18px #0000008c; }
.key:active { transform:translateY(3px); box-shadow: inset 0 1px #ffffff0f, 0 0 #0a0b0d, 0 1px 3px #00000080; }
.key:focus-visible { outline:2px solid #efe8d4b3; outline-offset:3px; }
.key-light { color:#2a2620; background:linear-gradient(#efe8d4,#d4cab1); box-shadow: inset 0 1px #fffc, 0 3px #9a8f77, 0 6px 14px #0000008c; }
.key-light:hover { color:#1a1712; box-shadow: inset 0 1px #fffc, 0 4px #9a8f77, 0 8px 18px #0000008c; }
.key-light:active { box-shadow: inset 0 1px #fff9, 0 0 #9a8f77, 0 1px 3px #00000080; }
@media (prefers-reduced-motion: reduce) { .key, .key:hover, .key:active { transition:none; transform:none; } }
```
Both are in `@layer components`.

### 3.5 Cursor

The scroller and hidden input use `cursor: text`. The skip link has the default arrow cursor (computed `cursor: default`; the page does not set `cursor:pointer` on buttons).

---

## 4. Animation and timing

### 4.1 First-visit timeline (no input, desktop 1440×900, user `guest`)

Times are from T0 (hydration). Predicted values come from the code; the "measured" column is from the frame logger (one run, rAF resolution).

| t (ms) predicted | measured | Event |
|---|---|---|
| before T0 | first paint | Console is already visible (forced by `html[data-opening]`): tty header line, NBSP line, and the blinking busy caret (no prompt yet, because SSR renders the terminal in `busy` mode). |
| 0 | 0 | Phase `init → intro`. Console set to `autoAlpha:1`, `data-opening` removed, room layer set to `autoAlpha:0`. Prompt `penguin login: ` appears. With a fine pointer the hidden input is focused, so the caret blinks; otherwise it sits at 40 % opacity. |
| 300 + 55k (k = 1..n) | 364, 419, 473, 528, 582 | Username typed one character every 55 ms into the prompt (not into the input; the input is `readOnly`). n = length of the stored user name, default `guest` (5). |
| 440 + 55n = 715 | 727 | Prompt cleared; login echo line and the whole banner printed in one batch (no line-by-line reveal). Prompt becomes `guest@penguin:~$ `. |
| 715 + 380 + 65k (k = 1..4) | 1170, 1230, 1297, 1364 | `boot` typed at 65 ms per character. |
| 1220 + 55n = 1495 | 1503 | Echo `guest@penguin:~$ boot`; `onBoot(false, user)` fires. Phase `booting`; terminal switches to `busy` (prompt replaced by the bare blinking caret); `powering on the homelab…` printed; `localStorage["yg-lab"] = {user, at: Date.now(), active: true}`. |
| +150, +270, +390, +510 | 1654, 1775, 1897, 2018 | Four `[  OK  ]` rows (PDU, switch, mini PC, SSD). |
| +730 | 2236 | `[  OK  ] Reached target graphical.target - the room.` |
| +1130 to +1830 | to 3406 | Console `autoAlpha 1 → 0`, 0.7 s, `power2.inOut`. The fixed night sky shows through as it fades. |
| ≈ 3325 | 3406 | "Frame opening": camera placed on the landing page's mini-room box (4.4). Power-up timeline starts (4.3, full mode). |
| ≈ 9025 | 9049 | Power-up complete. Phase `live`; `data-lab-intro` removed so the header fades in (opacity, 0.6 s); skip link unmounts; parallax enabled. |
| +450 desktop / +900 mobile | 9526 desktop, 9984 mobile | Camera tween to the landing mini-room box ends; `setView("classic")`. Lab section becomes `display:none`, landing page appears, scroll forced to 0, landing name animation plays. |

General formulas (n = user name length): banner at `440 + 55n`, boot call at `1220 + 55n`, console gone at `boot + 1830`, live at `boot + 1830 + 5700`, landing at `live + 450` (or `+ 900` when the door box is not fully on screen).

### 4.2 Console boot timeline (`consoleBoot`)

```
start, step = fast ? (0.15, 0.12) : (0.35, 0.32)       // fast = this boot came from the first-visit autoplay
for k in 0..3: at start + k*step → print OK row k
at start + 4*step + 0.1 → print "Reached target …" row
at start + 4*step + (fast ? 0.5 : 0.6) → tween console autoAlpha → 0, duration 0.7, ease "power2.inOut"
onComplete → next stage
```
Fast: rows at 0.15 / 0.27 / 0.39 / 0.51 s, final row 0.73 s, fade 1.13 to 1.83 s.
Slow (manual boot from the login screen): rows at 0.35 / 0.67 / 0.99 / 1.31 s, final row 1.73 s, fade 2.23 to 2.93 s (measured 2.94 s).

### 4.3 Room power-up timeline (`powerUp`, full mode)

GSAP timeline; positions in seconds from its start. Selectors refer to the room SVG's data attributes (the room spec defines the art). `l = 0.45` part stagger, `c = 1` base offset.

| Pos | Target | Tween |
|---|---|---|
| 0 | room layer | `set {visibility: visible, transformOrigin: "<room bbox center x>px <room bbox top + 55% height>px"}` (computed in element pixels from the current camera) |
| 0 | room layer | opacity keyframes `[0, 0.5, 0.06, 0.75, 0.25, 1]`, duration 1.2, overall ease `none` (5 equal 0.24 s segments, each with GSAP's default per-segment ease `power1.inOut`; measured minimum 0.06 and plateau 0.75 confirm it) |
| 0 | room layer | `scale 1.2 → 1`, duration 5.2, `power2.out` |
| 1.00 | rack spotlight `[data-part="spot"]` | opacity keyframes `[0, 1, 0.3, 1, 0.7, 1]`, 0.5, `none` |
| 1.10 | rack base `[data-base="myrack"]` | opacity → 1, 0.5, `power1.out` |
| 1.20 | rack light pool `[data-pool="myrack"]` | opacity → 1, 1.2, `power1.out` |
| 1.35 / 1.80 / 2.25 / 2.70 | rack parts `pdu`, `switch`, `p340`, `ssd` | opacity keyframes `[0, 1, 0.2, 1, 0.55, 1]`, 0.5, `none` |
| same | callout tag for that part `[data-tag]` | `fromTo {opacity:0, x:-8} → {opacity:1, x:0}`, 0.35, `power2.out` |
| same (only when not silent) | console | print the matching OK row (silent during the intro because the console is already gone) |
| 3.15 | group A: room shell (`room`) | base opacity → 1 (0.4, `power1.out`); pool → 1 at +0.1 (1.2, `power1.out`); lights keyframes `[0,1,0.2,1,0.55,1]` at +0.05 (0.6); WAN cable `set opacity 1` and `drawSVG 0% → 100%` (0.9, `power2.inOut`) |
| 3.50 | group B: `desk`, `deskitems`, `camera`, `record` | same per device; desk cable draws |
| 3.85 | all tags | opacity → 0, 0.45, stagger 0.06 |
| 3.85 | ambient loops | start packet travel along cables, firewall-block alert loop, monitor bar loops (room spec) |
| 3.85 | console | print `lab online. welcome, {user}.` |
| 5.2 to 5.7 | (empty tween) | 0.5 s hold appended at the end |
| end | | `onComplete`: enable pointer parallax on the room layer, then phase `live` and `toPage()` |

Fast mode (used only by "skip intro" from the post-logout login screen): room layer `autoAlpha → 1, scale → 1` in 0.5 s `power1.out`; base offset 0; rack base 0.25 s at 0.1; spotlight 0.25 s at 0; parts every 0.1 s from 0.35 (0.3 s each); no tags; groups at 0.75 and 0.85 with 0.25 s bases, 0.35 s lights, 0.5 s cable draws; ambient at 0.95; 0.1 s hold.

### 4.4 Camera and the hand-off to the landing page

The room is drawn in SVG user units. The "camera" is a single object `cam = {x, y, w, h}` that is written as the `viewBox` of every `svg[data-cam]` on each tween update (all use `preserveAspectRatio="xMidYMid meet"`). Tweening the camera is how all zooms work.

Helper math (write these as small pure functions):
```
place(cx, cy, scale, px, py, ew, eh) = { x: cx - px/scale, y: cy - py/scale, w: ew/scale, h: eh/scale }
   // puts SVG point (cx, cy) at element pixel (px, py) with the given px-per-unit scale; ew/eh = svg element size in px
fit(bounds, rect, ew, eh) = place(bounds.cx, bounds.cy, min(rect.w/bounds.w, rect.h/bounds.h), rect.cx, rect.cy, ew, eh)
defaultFit = fit(roomBBox, { x: 16 - ox, y: 64 - oy, w: heroW - 32, h: heroH - 64 - 48 }, ew, eh)
   // ox/oy = svg element offset inside the hero, minus the current parallax translate
```

Door contract with the landing page (the landing hero's mini-room component registers it):
```
doorBox() = {
  rest: inset(imageRect in document coords: {x: left, y: top + scrollY, w: width, h: width * 1460/1700}),
  depth: 18
}
inset(r) = { x: r.x + r.w/170, y: r.y + r.h/146, w: r.w*(1 - 2/170), h: r.h*(1 - 2/146) }
```
The still image is 1700×1460 and the room's bounding box sits exactly 10 px (at native size) inside each edge, which is why the inset fractions are 1/170 and 1/146. Your replacement still must keep that framing or the swap will jump.

`findWayOut()` temporarily sets `html[data-view]="classic"`, calls `doorBox()` to measure the landing layout, restores the attribute, and caches `{box, depth, vw, vh}`. `wayOut()` returns the cached box shifted by the sky parallax (`box.x - --px*depth`, `box.y - --py*depth`, read from the `[data-sky-vars]` element's inline custom properties) or `null` if the viewport size changed since measuring.

Frame opening (called right before the power-up on the first visit):
```
findWayOut(); door = wayOut()
fits = door && door.x >= 0 && door.y >= 0 && door.x + door.w <= heroW && door.y + door.h <= heroH
cam = fits ? fit(roomBBox, door → svg-element coords, ew, eh) : defaultFit
```
So on desktop the room lights up already sitting exactly where the landing page will show it; on phones (box partly below the fold) it lights up centered in the default fit.

`toPage()` at the end of the power-up:
```
gsap.to("[data-dock]", { autoAlpha: 0, duration: 0.2 })        // logs a harmless "target not found" warning during the intro; guard it
gsap.to(cam, { ...(wayOutBoxFit ?? defaultFit), duration: fits ? 0.45 : 0.9, ease: "power3.inOut", overwrite: true,
               onUpdate: applyViewBox,
               onComplete: () => { setView("classic"); block wheel events (preventDefault, passive:false) for 700 ms } })
```
On desktop this is a 0.45 s still hold (the camera is already there) while the header fades in. On mobile it is a visible 0.9 s pan and zoom down toward the mini-room near the bottom of the landing layout.

`setView(v)`: if changed, sets `html[data-view]=v`, sets `history.scrollRestoration` to `manual` for room and `auto` for classic, `scrollTo({top:0, behavior:"instant"})`, dispatches `window` event `yg:view`. The lab listens: on `classic` it kills camera tweens, pauses the ambient loops, resets focus state and sets phase `off` if it was still `intro`/`init`.

### 4.5 What the sky and the landing do during the hand-off

- The sky (`[data-room-sky]`, fixed, full viewport) is visible during the whole room view, so it is what appears as the console fades. It has its own idle animations (shooting star, drifting satellites, moon glow) and pointer parallax that are specified in the sky spec. Nothing in the intro animates the sky.
- The room layer gets a pointer parallax after the power-up completes (fine pointer, no reduced motion): `gsap.quickTo(layer, "x"|"y", {duration:1.4, ease:"power3"})` driven by `x = -(clientX/innerWidth - 0.5) * 16`, `y = -(clientY/innerHeight - 0.5) * 9`.
- The header fades from opacity 0 to 1 over 0.6 s as soon as phase becomes `live` (about 0.45 s before the landing appears on desktop).
- When `data-view` flips to `classic`, the landing hero is un-hidden, so its CSS entrance animations start at that moment. In particular the big name letters run `name-in` (0.7 s `cubic-bezier(0.2,0.9,0.25,1)`, delay `0.15s + i*45ms`, from `opacity:0; translateY(0.3em)`); that animation is suppressed only by `html[data-been-inside]`, which the intro never sets. The landing spec owns those details.

### 4.6 Other console tweens

| Name | Trigger | Tween |
|---|---|---|
| hideConsole (skip) | skip during `intro` | console `autoAlpha → 0`, 0.3 s, `power2.in` (measured fade about 250 to 300 ms, slow start then fast) |
| showLogin | after a power-down | `set yPercent 0`; console `autoAlpha 0 → 1`, 0.6 s, `power2.out`; on complete focus input if `(pointer: fine)` |
| openTerm (shell) | `›_ terminal` button or backtick | console `fromTo {autoAlpha:1, yPercent:-100} → {yPercent:0}`, 0.35 s, `power3.out`, then focus input |
| closeTerm (shell) | Esc, close button, backtick (when focus is outside inputs) | console `yPercent → -100`, 0.25 s, `power2.in`, then `autoAlpha 0` |
| powerDown | `exit` / `logout` / `reboot` in the shell | see below |

powerDown timeline:
| Pos | Target | Tween |
|---|---|---|
| 0 | console | `autoAlpha → 0`, 0.25 |
| 0 | tags | `set opacity 0` |
| 0 | cable paths | `drawSVG → "100% 100%"`, 0.7, `power2.in` (cables retract) |
| 0.1 | `[data-unit]` | opacity → 0, 0.2, stagger 0.01 from end |
| 0.1 | lights of room, desk, deskitems, camera, record | opacity → 0, 0.25, stagger 0.08 |
| 0.1 | all light pools | opacity → 0, 0.6 |
| 0.3 | all bases | opacity → 0.42, 0.6 |
| end of timeline at that point | cables | `set opacity 0` |
| 0.5 | room layer | `autoAlpha → 0`, 0.7, `power2.in` |
| complete | | camera reset to default fit; terminal reset (header line only, plus `System restarted.` for reboot); phase `intro`; showLogin |
Measured: console gone 0.25 s after Enter, room gone at 1.2 s, login console fully in at about 1.65 s.

### 4.7 Mobile specifics observed

At 390×844 the timeline is identical up to `live`. Because the landing mini-room is not fully on screen, the room powers up centered and large, then pans and shrinks for 0.9 s toward the bottom of the viewport. During that 0.9 s the header (logo and menu button) is fading in, and the `›_ terminal` dock button animates in (`lab-fade-in 0.6s ease-out 0.4s backwards`) and is visible for roughly the last 0.5 s before the view swaps. Measured: live at T0 + 9.04 s, landing at T0 + 9.98 s.

### 4.8 CSS keyframes used by the intro

| Keyframes | Used by | Definition |
|---|---|---|
| `lab-caret` | both carets | `0%,49% {opacity:1} 50%,to {opacity:0}`, run as `1.05s step-end infinite` inside `@media (prefers-reduced-motion: no-preference)` |
| `lab-fade-in` | live HUD (end of intro on mobile) | `from {opacity:0; transform:translateY(8px)} to {opacity:1; transform:none}` |
| `name-in` | landing name, starts at the swap | owned by the landing spec |

Present in the CSS but not used by any shipped code (left over from an earlier boot intro): `boot-caret` (same shape as `lab-caret`, 1 s), `crt-off` (0.52 s collapse to a horizontal line with brightness 2.4 to 3), the `lab-caret 1s` utility, and the `#boot-intro` / `html[data-boot="seen"]` rule. Do not port them unless you want a CRT-off effect for your own design.

### 4.9 Autoplay implementation (clean pseudocode)

```ts
useEffect(() => {
  if (!autoplayUser) return
  const timers: number[] = []
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
  const typeOut = (text: string, start: number, perChar: number) => {
    for (let i = 1; i <= text.length; i++) at(start + i * perChar, () => setInput(text.slice(0, i)))
    return start + text.length * perChar
  }
  let t = typeOut(autoplayUser, 300, 55)
  at((t += 140), () => { setInput(''); setUser(autoplayUser); print(<LoginEcho name={autoplayUser}/>, <Banner user={autoplayUser}/>) })
  t = typeOut('boot', t + 380, 65)
  at(t + 140, () => { setInput(''); print(<CommandEcho user={autoplayUser} cmd="boot"/>); onBoot(false, autoplayUser) })
  return () => timers.forEach(clearTimeout)          // skip clears pending keystrokes
}, [autoplayUser])
```

---

## 5. Interaction and state

### 5.1 Lab phase state machine (`section#hero[data-phase]`)

```
           mount, html.view==="room"                      mount, html.view==="classic"
init ───────────────────────────────▶ intro          init ─────────────────────────────▶ off
intro ── onBoot(skip=false) ──▶ booting ── console boot + power-up done ──▶ live
intro ── onBoot(skip=true)  ──▶ booting ── (first visit) instant ──▶ live ──▶ setView(classic)
                                       └─ (after logout) 0.3 s fade + fast power-up ──▶ live
booting ── "skip intro →" ──▶ (all running timelines jump to progress 1) ──▶ live
live ── exit / logout / reboot ──▶ powerDown ──▶ intro (login screen, no autoplay)
any ── view event "classic" ──▶ if booting: jump to end; intro|init ──▶ off
off ── view event "room" (user clicked "step inside") ──▶ live (room spec)
```

Side effects bound to the phase:
- `intro` or `booting`: set `html[data-lab-intro]` and `scrollTo({top:0, behavior:"instant"})`.
- `live` or `off`: remove `html[data-lab-intro]`.
- Unmount: remove `data-lab-intro`.
- `live` while in room view, not zoomed, and not coming from the first-visit intro: run `stepIn` (camera move to the default interior framing, 1.05 s `power3.inOut`; room spec).

Refs worth keeping (all `useRef`, not state, to avoid re-render races): `busy` (an animation owns the scene), `fromAutoplay` (this boot came from the first-visit autoplay; selects the fast console boot), `firstVisitIntro` (selects the frame-opening path and hides "back to the page"), `phaseRef` (mirror of the phase for event handlers).

### 5.2 `onBoot(skip, name)`

```
if busy: return
busy = true
user = name || "guest"
wasAutoplay = fromAutoplay; isFirstVisit = firstVisitIntro
fromAutoplay = false; setAutoplayUser(null)          // cancels any pending keystrokes
terminal.login(user)                                 // sets the prompt user if not already set
writeSession({ user, at: Date.now(), active: true })
phase = "booting"
done = () => { phase = "live"; busy = false; setTimeout(showHotspotMarkers, 700) }
if skip:
  hideConsole(0.3s) then:
    isFirstVisit ? (lightUpInstantly(); done(); setView("classic"))
                 : (done(); powerUp({ fast: true, user }))
else:
  print("powering on the homelab…")
  consoleBoot({ fast: wasAutoplay }) then:
    isFirstVisit ? (frameOpening(); powerUp({ fast:false, user, silent:true, onComplete: () => { done(); toPage() } }))
                 : powerUp({ fast:false, user, silent:true, onComplete: done })
```
`lightUpInstantly` kills the boot timelines and `set`s every base, light, unit, pool and cable to opacity 1, cables to `drawSVG "0% 100%"`, the room layer to `autoAlpha 1, scale 1`, the console to `autoAlpha 0`, then starts the ambient loops.

### 5.3 "skip intro →" and "back to the page"

| Phase | Control | Result | Measured click to landing |
|---|---|---|---|
| intro (autoplay typing) | skip | 0.3 s console fade (terminal flips to busy so only the header line and caret remain while it fades), then the landing appears instantly, no zoom | about 0.41 s |
| booting, console still visible | skip | console boot and power-up timelines jump to completion in the same frame (room fully lit at final scale), then the 0.45 s / 0.9 s camera hand-off, then landing | about 0.58 s |
| booting, room powering up | skip | power-up jumps to completion, then the hand-off | about 0.52 s |
| intro (login screen after logout) | skip | 0.3 s console fade, fast power-up, stays in the room (live) and runs stepIn | n/a |
| intro (login screen after logout) | back to the page | `setView("classic")`; phase `off`; session stays `active:false` | immediate |

"back to the page" is rendered only when the intro was not the first-visit autoplay. Both controls are visible only in phases `intro` and `booting`.

### 5.4 Keyboard

During the first-visit autoplay the input is `readOnly` and its keydown handler calls `preventDefault()`, so typing and Enter do nothing (confirmed: typing `help` + Enter mid-intro had no effect). Only the skip link accelerates.

Window keydown while the terminal is in `intro` mode (login screen after logout):
- Ignored if Meta, Ctrl or Alt is held, or if focus is on the input or any element other than `body`.
- `Enter`: `preventDefault`, focus the input and submit the current line (the original dispatches a synthetic `keydown` Enter on the input; calling the submit handler directly is cleaner).
- Any single-character key: focus the input, so the character lands in it.

Input keydown (when not autoplaying):
| Key | Behavior |
|---|---|
| Enter | submit (5.5); `preventDefault`; input cleared afterwards |
| Tab | `preventDefault`; completion (5.6) |
| Ctrl+L | `preventDefault`; clear the scrollback |
| ArrowUp | only when logged in: `idx = min(idx + 1, history.length - 1)`; show `history[idx]` if defined |
| ArrowDown | only when logged in: `idx = idx - 1`; if `< 0` set `idx = -1` and empty the input, else show `history[idx]` |

Window keydown in `live` (room spec owns most of it): `Escape` closes the shell if open (also exits fullscreen and steps outside when nothing is open). Backtick toggles the shell, but the check runs after an "is the target an input/textarea/contenteditable" early return, so with the shell's input focused a backtick is typed into the line instead of closing it. The shell footer still says "close (` or esc)". Confirmed in Chrome. Decide whether to copy this quirk.

### 5.5 Submit handler and command set

```
submit(raw):
  if no user yet: return login(raw)
  line = raw.trim(); lower = line.toLowerCase().replace(/\s+/g, " ")
  cmd = lower.split(" ")[0]; arg = rest joined by " "
  print(<CommandEcho line>)                           // echo keeps original case
  if line === "": if mode==="intro": onBoot(false, user); return
  history = [line, ...history.slice(0, 49)]; idx = -1       // 50 entries max, newest first
  if cmd === "cat": arg==="about.txt" → about; arg==="services.md" → services; else print "cat: {arg || '(nothing)'}: No such file or directory"
  dispatch on cmd (table below)
  else if lower.startsWith("sudo") → "{user} is not in the sudoers file. This incident will be reported."
  else → "-bash: {cmd}: command not found"        // cmd is the lower-cased first word

login(raw):
  name = raw.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 16) || "guest"
  setUser(name); print(<LoginEcho raw/>, <Banner user={name}/>)   // echo shows the raw text, banner uses the sanitized name
```
Example: typing `Kris Green!` logs in as `krisgreen`. Logging in does not touch localStorage; only booting writes the session.

Help list (`help` prints these in this order; `boot` is shown only in `intro` mode). Format per row: `"  " + name.padEnd(13)` in white, then the description dim, `whitespace-pre`; then a dim `mt-1` footer line `tab completes · ↑↓ history · ctrl+l clears`.

| Command | Help text | Behavior |
|---|---|---|
| `about` | who I am | 2 paragraphs about the owner (first white, second default color) |
| `boot` (aliases `start`, `startx`) | power on the homelab | intro mode: boot; shell: dim `the lab is already running.` |
| `certs` (alias `certifications`) | certifications | one row per cert: `{full name} ` + dim `· {issuer}` |
| `clear` | clear the screen | empty the scrollback |
| `contact` (aliases `email`, `socials`) | email and socials | one `whitespace-pre` row per social: dim `key.padEnd(11)` + link(handle) |
| `echo` | print text | prints `line.slice(5)` (original case and spacing kept), `whitespace-pre-wrap break-words` |
| `education` | where I studied | one line |
| `experience` | where I've worked | one row per job: `{role} ` + dim `@ {company} · {period lowercased}` |
| `help` | this list | see above |
| `history` | commands you've run | all previous commands oldest first plus the current one, `String(i+1).padStart(5) + "  " + cmd`, `whitespace-pre` |
| `neofetch` | the homelab server at a glance | bold `{user}@penguin`, dim `-----------------` (17 dashes), then 6 rows `<b>Key</b>: value` for keys `OS`, `Host`, `Memory`, `Storage`, `Network`, `Services`; Services value is `{services.length} core · 9+ containers` |
| `nmap` | scan this site for open services | see 5.7 |
| `open` | jump to a section (open projects) | `open <id>` with id in `projects, homelab, websites, experience, about, photography, contact`: smooth-scroll `#id` into view and print dim `opening {id}…`; otherwise `open: no such section: {arg or (none)}. try projects, homelab, websites, experience, about, photography, contact` |
| `projects` | things I've built | one row per project: link(name) + dim `· {first 3 stack items joined by ", "}` |
| `pwd` | print working directory | `/home/{user}` |
| `resume` | open my resume (pdf) | `window.open(RESUME_URL, "_blank")` and dim `opening resume.pdf…` |
| `services` (alias `homelab`) | what runs on my homelab | bold `p340-tiny` + dim `· {os}`; 7 rows `"  " + name.padEnd(22)` + dim role (`whitespace-pre-wrap`); then `  hardening: ` + dim list joined by ` · ` |
| `whoami` | who are you? | the user name |
| `exit` (alias `logout`) | log out | intro mode: forget the user and reset the scrollback to the tty header (back to `penguin login:`); shell: print `logout` then power down |

Hidden commands (not in help):
| Command | Behavior |
|---|---|
| `ls` | `about.txt   certs/   experience/   projects/   resume.pdf   services.md` (`whitespace-pre-wrap`) |
| `date` | `YYYY-MM-DD HH:MM` local time |
| `gui`, `skip` | intro mode: skip the boot (`onBoot(true)`); shell: dim `you're already in the gui.` |
| `reboot` | intro mode: boot; shell: print `Broadcast message from root@penguin: the system is going down for reboot NOW!` then power down; the login screen then shows `System restarted.` (white/40) under the tty header |
| `su`, `login` | `nice try.` in `#ff8a8a` |
| `sudo …` | any line starting with `sudo` (prefix match) prints the sudoers message |
| `cat about.txt`, `cat services.md` | same as `about` / `services` |

### 5.6 Tab completion

Only when logged in, the input is non-empty and contains no space. Candidates are all command names from the help table (including `boot` and `exit`) that start with the lower-cased input. One match replaces the input. Several matches print the current prompt line and then the matches joined by three spaces in a normal `<p>` (whitespace collapses, so they render single-spaced, for example `certs clear contact`). No match does nothing.

### 5.7 `nmap` output

Dim `Starting Nmap 7.95 ( https://nmap.org ) at {YYYY-MM-DD HH:MM}`; dim `Nmap scan report for {site domain} (10.0.7.1)`; dim `whitespace-pre` header `PORT`, `STATE`, `SERVICE` with the first two padded to 10; seven rows `port.padEnd(10)` + state padded to 10 (white when `open`, dim otherwise) + service. Open rows render the service as an underlined `<button>` that smooth-scrolls to the mapped section; the filtered row renders dim `telnet (nice try)`. Closing dim line `Nmap done: 1 IP address (1 host up) scanned in 0.42 seconds`.

| Port | State | Service label | Scrolls to |
|---|---|---|---|
| 22/tcp | open | about | #about |
| 23/tcp | filtered | telnet | none |
| 25/tcp | open | contact | #contact |
| 443/tcp | open | projects | #projects |
| 3306/tcp | open | experience | #experience |
| 8080/tcp | open | photography | #photography |
| 8443/tcp | open | websites | #websites |

### 5.8 Terminal imperative handle

`print(...nodes)`, `clear()`, `focus()` (with `preventScroll`), `login(name)` (sets the user only if none is set, clears the input), `reset()` (user null, input empty, scrollback = tty header only). Scrollback auto-scrolls to the bottom whenever lines or mode change. Focus is pulled to the input whenever the mode is not `busy` and `(pointer: fine)` matches. Clicking anywhere on the terminal focuses the input unless `busy`.

### 5.9 Coarse pointer login ("Enter as guest")

In the login screen (intro mode without autoplay) on `(pointer: coarse)` the hint text is hidden and a full-width `.key.key-light` button `Enter as guest` shows instead. Tap: `stopPropagation`; if no user yet, run `login("")` (prints `penguin login: ` plus the guest banner); after 650 ms call `onBoot(false, user)` (slow console boot). The button stays visible during those 650 ms.

### 5.10 localStorage, URL and history

| Key | Shape | Written | Read |
|---|---|---|---|
| `yg-lab` | `{ user: string, at: number (ms epoch), active: boolean }` | on boot or skip `{user, at: now, active: true}`; on exit or reboot `{...prev, active: false}`; when entering the room later while the lab is not live `{user, at: now, active: true}` | inline gate (skip the intro when `active`); mount (autoplay types `user ?? "guest"`); entering the room (prints `Last login: {at as "Www, Mmm D, HH:MM"} on tty1` and `session restored. welcome back, {user}. type help to look around.`) |
| `yg-lab-hints` | `"1"` | first time a room hotspot is opened | room spec (marker visibility) |
| `yg-boot` | any | never | legacy inline script A only |

The reader also accepts a legacy plain-string value matching `/^[a-z0-9._-]{1,16}$/` and treats it as an active session, but the inline gate parses JSON only, so a plain string still triggers the intro. A visitor who typed `exit` once gets the intro again on the next load, auto-typing their saved name.

The intro never changes the URL or pushes history entries. Any hash on load (for example `/#projects`) skips it. `history.scrollRestoration` is `manual` while the room view is active and `auto` after the swap.

---

## 6. Responsive behavior

| Breakpoint / condition | Change |
|---|---|
| < 640 px | intro controls at `top:20px; right:20px` |
| ≥ 640 px (`sm`) | intro controls at `top:28px; right:32px` |
| < 768 px | console text 13 px / 20.8 px; padding `64px 20px 20px` (top padding clears the controls); hint row `0 20px 20px`; shell padding `16px 20px` |
| ≥ 768 px (`md`) | console text 14 px / 22.4 px; padding `32px 40px`; hint row `0 40px 32px`; shell padding `16px 32px`; room layer bleed `-inset-6` instead of `-inset-4` |
| narrow widths | banner service rows and boot rows wrap with a hanging indent (flex: fixed-width label column, wrapping description). The kernel line, intro line and welcome line wrap normally. Help rows are `whitespace-pre` and overflow to the right on a 390 px phone (part of a description is cut off); this is the original behavior |
| door box fully visible | room powers up in place and the hand-off is a 0.45 s hold (typical desktop) |
| door box not fully visible | room powers up centered (16 px sides, 64 px top, 48 px bottom margins) and pans for 0.9 s (typical phone) |
| `(pointer: coarse)` | input never auto-focused (no virtual keyboard pops up), caret shows at 40 % static opacity during the autoplay; "Enter as guest" replaces the hint on the login screen; no room parallax |
| `(pointer: fine)` | input auto-focused, caret blinks |
| heights | console uses `100svh`; shell panel uses `min(58svh, 34rem)` (522 px at 1440×900, 489.5 px at 390×844) |

The autoplay runs identically on phones; there is no tap-to-start.

---

## 7. Accessibility and reduced motion

- `prefers-reduced-motion: reduce` disables the intro entirely (inline gate): the page loads straight into the landing view, `data-phase` goes `init → off`, and nothing is written to storage. Carets only blink under `motion-safe`; under reduce they are static. Camera move durations elsewhere are multiplied by zero under reduce, but the console boot, power-up and power-down timelines are not (only reachable later via the shell `exit` path). A rebuild should consider shortening those too.
- The scroller is `aria-live="polite"`, so printed lines are announced. During the autoplay that means the banner is read as one large chunk; consider `aria-busy` while the intro is running, or announcing a single summary line.
- The real text input is visually hidden but present, with `aria-label` `Login name` before login and `Terminal input` after. The caret is `aria-hidden`.
- The skip link is a real `<button>` placed after the console in DOM order, so it is reachable with Tab from the focused input. It has no explicit `aria-label`; its text is the label. Focus styles fall back to the browser default outline (no custom focus ring).
- During the intro `html` and `body` are `overflow: hidden` and the rest of the page is `visibility: hidden`, so screen readers do not reach landing content until the swap.
- Contrast on pure black: `#cfcfcf` text 13.5:1, dim `#8a8a8a` 6.1:1, the skip link at white/40 only 3.7:1 and the hint row at white/35 3.0:1. Both small 11 px labels fail WCAG AA for normal text; raise them (white/55 or more) in a rebuild if accessibility matters more than exact fidelity.

---

## 8. Content model

```ts
export interface IntroContent {
  hostname: string;                 // "penguin"
  tty: string;                      // "tty1"
  distroLine: string;               // "Debian GNU/Linux 13 {hostname} {tty}"
  kernelLine: string;               // ~80 chars, uname -a style
  ownerName: string;                // bolded in the banner intro line
  bannerTagline: string;            // ", portfolio. Everything below is real and running:" (~50 chars)
  services: { unit: string; short: string }[];          // 7 items; unit 5 to 9 chars (padded to 11); short 24 to 42 chars
  bootParts: { part: 'pdu' | 'switch' | 'p340' | 'ssd'; host: string; msg: string }[]; // 4 items; host 7 to 9 chars; msg 7 to 28 chars
  defaultUser: 'guest';
}

export interface TerminalCommandSpec { name: string; help: string; introOnly?: boolean } // 19 visible commands, help text 9 to 33 chars

export interface ShellData {                  // drives about/education/experience/projects/certs/contact/services/neofetch/nmap
  aboutParagraphs: [string, string];          // ~110 and ~210 chars
  educationLine: string;                      // ~100 chars
  experience: { role: string; company: string; period: string }[];             // 3 items
  projects: { name: string; link: string; stack: string[] }[];                 // 4 items, stack 4 to 5 entries (first 3 shown)
  certs: { id: string; full: string; issuer: string }[];                       // 4 items
  socials: { key: 'email' | 'linkedin' | 'github' | 'instagram'; handle: string; href: string }[]; // 4 items
  homelab: { os: string; services: { name: string; role: string }[]; hardening: string[] }; // 7 services, 6 hardening items
  neofetch: { OS: string; Host: string; Memory: string; Storage: string; Network: string };
  resumeUrl: string;
  siteDomain: string;                         // shown in the nmap scan report
}

export interface LabSession { user: string; at: number; active: boolean }   // localStorage "yg-lab"
export type LabPhase = 'init' | 'intro' | 'booting' | 'live' | 'off';
export type TerminalMode = 'intro' | 'shell' | 'busy';
export type View = 'room' | 'classic';
```

Verbatim generic UI labels used in this area:
- `skip intro →`, `back to the page`, `Enter as guest`
- `penguin login: `, `{user}@penguin:~$ `, `Debian GNU/Linux 13 penguin tty1`, `Last login: … on tty1`
- `welcome, {user}. type help, or press enter to power on the lab.`
- `type any name and press enter (or just enter)`, `type help, or press enter to power on the lab`
- `powering on the homelab…`, `[  OK  ]`, `Reached target graphical.target - the room.`, `lab online. welcome, {user}.`
- `tab completes · ↑↓ history · ctrl+l clears`
- `tty1 · penguin`, `close (` or esc)`
- `-bash: {cmd}: command not found`, `{user} is not in the sudoers file. This incident will be reported.`, `nice try.`, `the lab is already running.`, `you're already in the gui.`, `cat: {file}: No such file or directory`, `open: no such section: {x}. try …`, `opening {section}…`, `opening resume.pdf…`, `logout`, `System restarted.`, `session restored. welcome back, {user}. type help to look around.`
- Glyphs: `●` (U+25CF), `→` (U+2192), `…` (U+2026), `·` (U+00B7), `↑↓`.

The owner's name, bio, education, employers, project names, cert numbers, social handles and homelab hardware strings are personal content: supply your own.

---

## 9. Assets

| Original | Used for | Replacement plan |
|---|---|---|
| Geist Mono (variable, `next/font/google`, `--font-geist-mono`) | all intro text | same font from `next/font/google` (open license) |
| No images, video or audio in the intro | | none needed |
| SVG room art (`svg[data-cam]` layers with data attributes `data-base`, `data-pool`, `data-lights`, `data-part`, `data-unit`, `data-cable`, `data-tag`, `data-pkt`) | the thing that powers up | original art per the room spec; it must expose the same data-attribute groups so the timelines in 4.3 and 4.6 apply |
| Landing mini-room still (1700×1460 webp, room bbox inset 10 px each side) | hand-off target | render your own room SVG to a still with the same bbox framing (section 4.4) |
| Night sky layer | backdrop revealed by the fade | original sky per the sky spec |

---

## 10. Implementation plan

### 10.1 Files (Next.js App Router, Tailwind v4, GSAP 3.13+ with `@gsap/react`, DrawSVGPlugin, MotionPathPlugin)

| File | Kind | Responsibility |
|---|---|---|
| `src/app/layout.tsx` | server | `<html data-view="classic" suppressHydrationWarning>`; first children of `<body>`: the gate script (2.2 B) via `<script dangerouslySetInnerHTML>`; optionally the legacy flag script |
| `src/lib/view.ts` | shared module | dataset-backed view store: `currentView`, `setView`, `useView` (`useSyncExternalStore`), events `yg:view`, `yg:home`, `yg:pick`, `enterRoom`, `takeEntry`, `setDoor`, `findWayOut`, `wayOut` |
| `src/lib/lab-session.ts` | shared | `readSession()`, `writeSession()` with try/catch around storage |
| `src/lib/camera.ts` | shared | `place`, `fit`, `defaultFit`, `applyViewBox` |
| `src/components/lab/Terminal.tsx` | client, `forwardRef` + `useImperativeHandle` | 2.5, 5.4 to 5.9, autoplay (4.9) |
| `src/components/lab/terminal/lines.tsx` | client | line templates (2.6) |
| `src/components/lab/terminal/commands.tsx` | client | command table and renderers (5.5 to 5.7), data from a content module |
| `src/components/lab/IntroControls.tsx` | client | skip and back buttons |
| `src/components/lab/LabHero.tsx` | client | phase machine (5.1), `onBoot` (5.2), GSAP timelines (4.2, 4.3, 4.4, 4.6) inside one `useGSAP({ scope })`, exposing them through a ref like the original (`consoleBoot`, `powerUp`, `hideConsole`, `showLogin`, `powerDown`, `frameOpening`, `toPage`, `lightUp`, `skipBoot`, `openTerm`, `closeTerm`) |
| `src/content/intro.ts` | data | `IntroContent` and `ShellData` |
| `src/app/globals.css` | css | 2.4 rules, `lab-caret`, `lab-fade-in`, `.key` family |

### 10.2 Gotchas

1. The gate script mutates `<html>` attributes before React hydrates; add `suppressHydrationWarning` on `<html>`, and render the terminal on the server in `busy` mode (no prompt) so server and client markup match. The `html[data-opening]` rule keeps the console visible until GSAP sets `autoAlpha:1` and the attribute is removed.
2. Use NBSP for blank lines and caret content, or they collapse.
3. Keep the input `readOnly` and swallow keydown during the autoplay; clear all autoplay timers when the autoplay user is reset (skip) and on unmount (React StrictMode double-invokes effects in dev, which is fine because of the cleanup).
4. Keep the skip link lowercase (preflight sets `text-transform:none` on buttons).
5. GSAP array keyframes default to `easeEach: "power1.inOut"`; the flicker relies on it.
6. Guard tweens on `[data-dock]` (not mounted during the intro) to avoid the GSAP "target not found" console warning the original emits.
7. The hand-off only looks seamless if the landing still and the SVG room share the exact bbox framing and the door rectangle is measured with the landing layout active (temporarily set `data-view="classic"`, measure, restore) and corrected for the sky parallax offset.
8. Block wheel events for 700 ms after swapping to the landing so trackpad momentum does not scroll the freshly revealed page.
9. Write the session only when booting or skipping, not when the name is typed.
10. Cap the scrollback at about 200 entries and history at 50.
11. `scrollTo({ behavior: "instant" })` when entering intro phases and on every view swap.

---

## 11. Reference screenshots

All under `C:/Users/krisg/AppData/Local/Temp/claude/C--/decae922-eee1-4676-b27b-70265c1bf4af/scratchpad/ref/intro/`. Prefix `d-` = desktop 1440×900, `m-` = mobile 390×844 (touch, iPhone UA). Each `*-log.json` holds the per-frame state log (`t` = `performance.now()` ms) and frame timestamps.

| File(s) | Shows |
|---|---|
| `d-autoplay-f000..f081.png` (+ `d-autoplay-log.json`) | Full first-visit run, ~150 ms apart for 13 s: f000 pre-hydration console (header + caret only), f001 to f006 typing `guest`, f007 banner, f010 `boot`, f011 to f016 boot log, f017 to f023 console fade to sky, f023 to f046 room flicker and power-up with tags, f058 live (header fading in), f061 landing swap, f062 to f070 landing name animation |
| `m-autoplay-f000..f063.png` (+ log) | Same on mobile, 200 ms apart; f044 to f048 the 0.9 s pan down; f049 landing |
| `d-banner-full.png`, `m-banner-full.png` | Banner fully printed (layout reference) |
| `d-styles.json`, `m-styles.json` | Computed styles and line boxes for console, caret, input, skip link |
| `d-skip-zoom.png`, `d-skip-hover.png`, `m-skip-*.png` | Skip link at rest and hovered |
| `d-skip-intro-before.png`, `d-skip-intro-f000..f021.png` | Skip during typing: 0.3 s fade, then landing |
| `d-skip-boot-before.png`, `d-skip-boot-f000..f019.png` | Skip during the console boot log |
| `d-skip-powerup-before.png`, `d-skip-powerup-f000..f017.png` | Skip during the room power-up |
| `d-typing-f000..f012.png` | Typing `help` + Enter during the autoplay (ignored) |
| `d-returning-*.png`, `d-hash-*.png`, `d-reduced-*.png`, `m-reduced-*.png` | No intro: active session, URL hash, reduced motion |
| `d-room-live.png`, `d-termopen-00..05.png`, `d-term-open.png` | Room after "step inside", shell drop-down sliding in, open shell |
| `d-cmd-help.png`, `d-cmd-misc.png`, `d-cmd-neofetch.png`, `d-cmd-nmap.png`, `d-cmd-history.png`, `d-cmd-tab-multi.png`, `d-cmd-ctrl-l.png` | Command outputs in the shell (`misc` = whoami, pwd, ls, date, echo, unknown, sudo, su, boot, skip, cat, open) |
| `m-cmd-*.png`, `m-term-open.png`, `m-room-live.png` | Same on mobile (help rows overflow) |
| `d-cmd-exit-0.png`, `d-exit-00..20.png`, `m-exit-*.png` | `exit` power-down sequence into the login screen |
| `d-login-screen.png`, `d-login-typed.png`, `d-login-done.png`, `d-cmd-intro-help.png`, `d-cmd-intro-exit.png` | Interactive login screen, typed name, sanitized banner, intro-mode help (includes `boot`), intro-mode exit |
| `d-boot-00..57.png`, `d-after-boot.png` | Enter on an empty prompt: slow console boot, full power-up at the default fit, live room |
| `m-login-screen.png`, `m-guest-00..12.png`, `m-after-boot.png` | Coarse-pointer login with "Enter as guest" and the resulting boot |
| `d-reboot-0.png`, `d-reboot-login.png` | `reboot`: broadcast line, login screen with `System restarted.` |
| `d-loginskip-00..11.png` | Skip from the login screen: fast power-up |
| `d-backtopage.png` | "back to the page" from the login screen |
| `sheet-*.png` | Contact sheets of the sequences above (fade, hand-off, skips, shell, exit/login, manual boot, mobile) |

---

## 12. Open questions and uncertainties

1. T0 is hydration time, which varies with network and CPU (530 to 630 ms after navigation in headless Chrome on a fast connection). On slow devices the pre-hydration console (header line plus blinking caret, no prompt) is shown longer. The original has no loading fallback beyond that.
2. Frame logging runs on `requestAnimationFrame`, so measured times carry about ±20 ms jitter, and one sampling gap (~200 ms) occurred during the heaviest power-up frame. Predicted values from the code are the source of truth; measurements agree within that jitter everywhere.
3. The exact door-box fit condition at in-between viewport sizes (for example tablets at 768 to 1023 px) was not captured; the rule in 4.4 decides it at runtime, so a rebuild that implements the rule will behave the same.
4. The room art, the sky's own animations, the live HUD and the landing hero's entrance are specified in other area specs; this spec only fixes the order and timing of the hand-off between them.
5. Whether the backtick-in-input behavior (5.4) and the reduced-motion gaps (7) are intentional is unknown; both are documented as observed.
6. The `yg-boot` key, `#boot-intro` rule, `crt-off` and `boot-caret` keyframes look like leftovers from a previous intro. No shipped code renders them, but a lazily loaded chunk that was never requested could not be ruled out completely.
7. Screen reader output was not tested with a real screen reader; the notes in section 7 come from the markup.
