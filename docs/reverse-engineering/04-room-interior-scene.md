# 04 · Room interior scene (section#hero, "the lab")

Area key: `room-scene`. Scope: the isometric SVG room shown full screen after "step inside", its construction, layer order, palette, ambient animation, and the camera moves that bring it in and take it out. Hotspot click handling, focus panels, the terminal and the HUD buttons are covered by their own specs; they are only referenced here where they touch the scene.

Reference screenshots live in `C:/Users/krisg/AppData/Local/Temp/claude/C--/decae922-eee1-4676-b27b-70265c1bf4af/scratchpad/ref/room-scene/` (listed in section 11).

---

## 1. Overview

The interior is a single dark, cozy isometric bedroom-lab drawn entirely in code as inline SVG: a two-wall corner room on a wooden floor slab, floating over the site's fixed night-sky backdrop. Every object (walls, floor planks, rug, network rack, desk with a beige retro CRT, chair, floor lamp, record player cabinet, plant, wall art, window with a city skyline) is built from projected boxes and flat shapes mapped onto the iso planes with affine matrices. The scene has two visual states: "dark" (all furniture at 42% opacity, no lights) and "lit" (furniture at 100%, warm wall-wash strips, picture lights, colored floor light pools, glowing cables with data packets, blinking LEDs, a spinning record, CRT bar graph). Entering from the landing page is a pure camera move: the live SVG starts exactly on top of the landing page's still image of the same room and then zooms in (1.15 s, `power3.inOut`) by tweening the SVG `viewBox`; leaving reverses the move (0.9 s) and swaps back to the page. It feels quiet and tactile: slow ambient motion, small mint edge highlights, soft radial glows, and nothing moves unless it is a light or a signal.

---

## 2. Structure

### 2.1 DOM tree (room view)

```
section#hero  [data-phase="init|intro|booting|live|off"]
  class: relative min-h-[100svh] overflow-clip bg-[#050706]
  (CSS override: #hero { background: transparent } so the fixed sky shows through;
   html[data-view=room] #hero { height: 100svh; touch-action: none })
│
├─ div  (scene wrapper, GSAP target "stage")      class: pointer-events-none absolute -inset-4 opacity-0 md:-inset-6
│   ├─ svg[data-cam]  #1 BASE layer (static art, memoized)        class: absolute inset-0 h-full w-full
│   ├─ svg[data-cam]  #2 LIGHTS layer (glows, pools, cables, packets, LEDs)  class: absolute inset-0 h-full w-full [will-change:transform]
│   ├─ svg[data-cam]  #3 HINT MARKERS (pulsing rings)               class: pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-1000 opacity-0|opacity-100
│   ├─ svg[data-cam]  #4 HOTSPOTS (transparent polygons, role=button)  class: absolute inset-0 h-full w-full  [data-hotspots="on|off"]
│   └─ div[data-tip]  tooltip (see interactions spec)
├─ div  top fade  class: pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050706] to-transparent   (display:none via CSS in the current build)
├─ div  focus scrim  class: invisible absolute inset-0 z-30 bg-[#030504]/80 opacity-0
├─ focus panels / HUD / terminal / intro buttons (other specs)
```

All four `svg[data-cam]` share the same `viewBox` at all times (the camera) and `preserveAspectRatio="xMidYMid meet"`. SVG #1 and #2 are `aria-hidden`. The camera code always keeps the viewBox aspect equal to the element aspect, so "meet" never letterboxes.

Wrapper geometry: it bleeds past the section by 16 px (below 768 px) or 24 px (md and up) on every side, so pointer parallax and the 1.2 to 1 power-up scale never reveal an edge. At 1440x900 the SVGs measure 1488x948 at (-24, -24); at 390x844 they measure 422x876 at (-16, -16).

### 2.2 Coordinate system and projection

The scene is authored in a 3D "world" space (units are arbitrary, about 1 unit = 1 cm) and projected to 2D SVG user space with a true isometric projection scaled by K = 1.32.

```
K = 1.32
A = K * cos(30deg) = 1.14315      // horizontal step per world unit
B = K / 2         = 0.66          // vertical step per world unit along x or y
iso(x, y, z) = [ 800 + (x - y) * A ,  40 + (x + y) * B - z * K ]
```

Axis directions on screen: +x goes right and down, +y goes left and down, +z goes straight up.

Planar mapping helpers (SVG `transform="matrix(a b c d e f)"`, origin `(X, Y) = iso(x0, y0, z0)`):

| helper | matrix | local (u, v) maps to world | plane, faces toward |
|---|---|---|---|
| `faceTop(x0,y0,z0)` | `matrix(A, B, -A, B, X, Y)` | (x0+u, y0+v, z0) | horizontal plane (floors, desk tops) |
| `faceLeft(x0,y0,z0)` | `matrix(A, B, 0, K, X, Y)` | (x0+u, y0, z0-v) | plane y = y0, faces +y (screen lower left) |
| `faceRight(x0,y0,z0)` | `matrix(A, -B, 0, K, X, Y)` | (x0, y0-u, z0-v) | plane x = x0, faces +x (screen lower right) |

Matrix entries are rounded to 2 decimals in the output. Circles on horizontal planes that are drawn in screen space (not through a matrix) use ellipse radii `rx = 1.2247 * r * K`, `ry = 0.7071 * r * K`.

Primitives:

- **IsoBox(x, y, z, w, d, h, tone, rim=true, fillOpacity?)**: three polygons drawn in this order: "left" face (plane y+d, fill `tone.left`), "right" face (plane x+w, fill `tone.right`), "top" face (z+h, fill `tone.top`). With `rim` on, side faces get `stroke rgba(160,255,230,0.08)` and the top `stroke rgba(160,255,230,0.15)`, width 0.6, `stroke-linejoin: round` (the faint mint edge highlight seen on the desk, rack cabinet and camera). With `rim` off, no stroke.
- **boxHull(x, y, z, w, d, h)**: the 6-point silhouette of a box: (x,y,z+h), (x+w,y,z+h), (x+w,y,z), (x+w,y+d,z), (x,y+d,z), (x,y+d,z+h). Used for hotspot polygons and the occlusion mask.
- **FloorShadow(x, y, w, d, spread=16)**: a `faceTop` rect at (x-s, y-s, 0), size (w+2s) x (d+2s), `rx = s`, fill `url(#lab-shadow)`.
- **Led(cx, cy, color, r=0.8, glow=3.4, blink?, r2?)**: a `<g class="lab-led-{blink}">` holding a glow circle (radius `r*glow`, fill `url(#lab-glow-{color})`) and a core circle (radius r, fill LED color). See 4.2 for per-LED timing.
- **rng(seed)**: seeded mulberry32 PRNG returning [0,1). Seeds used: rack 83, desk 41, rubber band ball 7.

### 2.3 Room bounds, viewBox, framing

```
room shell: x0=430, y0=440, x1=860, y1=790, wall height h=180, wall thickness t=6, floor slab thickness 12
roomBounds (screen-space bbox of the 6 outer shell corners): x=381.61 y=368.68 w=905.38 h=776.16
initial viewBox attribute = roomBounds grown by 60 on each side, rounded = "322 309 1025 896"
```

Key projected points (SVG user units): back corner at ceiling height (788.57, 376.60), back corner at floor (788.57, 614.20), front-left floor end (388.46, 845.20), front-right floor end (1280.12, 898.00), front floor corner (880.02, 1129.00).

The `viewBox` attribute is replaced at runtime by the camera (`x y w h` with 2 decimals) on all four SVGs. Camera rules (pixels refer to the hero section; the SVG element is offset by the bleed):

- **Fit** (unzoomed): fit `roomBounds` into the hero inset by 16 px left and right, 64 px top, 48 px bottom, centered. `fitScale = min((hw-32)/905.38, (hh-112)/776.16)` px per unit.
- **Step-in** framing (after entering): center on world point (560, 575, 70) = screen (782.85, 696.70); scale `clamp(min(0.92*max(hw/905.38, hh/776.16), 2.2*min(hw/905.38, hh/776.16)), 1.15*fitScale, maxScale)`; then pan-clamp.
- **maxScale** = `max(4.5*max(hw/905.38, hh/776.16), 3*fitScale)`.
- **Pan clamp**: with margin m = 24 px converted to units, the view x is clamped to `[roomX - m, roomX + roomW + m - viewW]` (min/max swapped when the view is larger than the room), same for y. The room can never be dragged fully off screen.

Measured and computed framings:

| viewport | SVG element | fitScale | step-in scale | step-in viewBox width | room size on screen at step-in |
|---|---|---|---|---|---|
| 1440x900 | 1488x948 | 1.0153 | 1.4633 | 1016.91 (measured `286.48 372.77 1016.91 647.87`) | 1325x1136 px (top and bottom cropped) |
| 1280x800 | 1328x848 | 0.8864 | 1.3007 | 1021.01 | 1178x1010 |
| 1920x1080 | 1968x1128 | 1.2472 | 1.9510 | 1008.71 | 1766x1514 |
| 1024x768 | 1072x816 | 0.8452 | 1.0405 | 1030.24 | 942x808 |
| 768x1024 | 816x1072 | 0.8129 | 1.2138 | 672.29 | 1099x942 |
| 390x844 | 422x876 | 0.3954 | 0.9477 | 445.30 (measured `560.20 245.79 445.30 924.37`) | 858x736 (left and right cropped; desk, chair, lamp and rack front centered) |

---

## 3. Styling

### 3.1 Global tokens used by the scene

| token | value | use |
|---|---|---|
| putty | `#e6d9b5` | hotspot outlines, marker rings, tag leaders, music notes, tooltip text |
| tag text | `#efe6cc` | rack callout labels |
| LED green | `#4ade80` | switch activity and power LEDs, CRT power LED |
| LED emerald | `#34d399` | defined, unused in scene |
| LED cyan | `#22d3ee` | WAN cable, return packets, rack pool |
| LED blue | `#60a5fa` | SSD activity LED, moonlight pool |
| LED amber | `#fbbf24` | desk cable, PDU LED, disk LED, record player LED, CRT pool |
| LED red | `#fb7185` | blocked packet, firewall alert |
| LED white | `#f1f5f9` | P340 power LED, spotlight, picture lights, moon glow |
| LED warm | `#fdba74` | wall wash strips, floor lamp, lamp pool |
| CRT phosphor | `#ffb347` (dim text `rgba(255,179,71,0.45)`) | CRT screen content |
| packet core | `#ecfdf5` | data packet center dot |
| fonts | SVG text inherits Geist Sans (`--font-geist-sans`); class `.lab-mono` sets `font-family: var(--font-geist-mono), ui-monospace, monospace` | |

### 3.2 Material tones (IsoBox top / left / right)

| name | top | left (+y face) | right (+x face) | used by |
|---|---|---|---|---|
| chassis (default) | `#1c232a` | `#12181e` | `#0c1014` | default only |
| wood (desk top) | `#2a2119` | `#1b1510` | `#140f0b` | desk top |
| metal | `#3b444d` | `#272e35` | `#1c2127` | desk legs, lamp base and pole, chair gas lift, small desk cube |
| plastic | `#191e23` | `#101418` | `#0b0e11` | defined only |
| putty | `#a39b86` | `#8a8371` | `#6c665a` | CRT front bezel box, keyboard |
| puttyDark | `#8a8371` | `#736d5e` | `#5a554a` | CRT rear housing, CRT riser |
| fabric | `#22262c` | `#181b20` | `#121418` | chair seat and back |
| floor slab | `#1a1511` | `#2a221b` | `#211a14` | room slab |
| wall A (y=440) | `#30363c` | `#1a1e22` (interior face) | `#262b31` (end cap) | right-hand back wall |
| wall B (x=430) | `#30363c` | `#262b31` (end cap) | `#15181c` (interior face) | left-hand back wall |
| rack cabinet | `#17191b` | `#0f1113` | `#0a0b0c` | cabinet under rack (rim on) |
| record cabinet wood | `#3a2a1d` | `#2c2016` | `#21180f` | cabinet and feet |
| turntable plinth | `#17181b` | `#3a2a1d` | `#2c2016` | |
| plant pot | `#3d2c21` | `#34251b` | `#271b14` | |
| camera body | `#202326` | `#15171a` | `#0d0e10` | |
| camera dial | `#34383c` | `#1d2023` | `#16181a` | |
| window sill | `#343a41` | `#22272c` | `#1b1f23` | |
| phone | `#0b0c0d` | `#1a1c1f` | `#131517` | |
| spot bracket | `#2a2e33` | `#1a1d20` | `#131518` | |
| spot head | `#23272b` | `#15181b` | `#0e1012` | |

### 3.3 Gradients, patterns, clips, masks (all ids are document-global)

Defined in SVG #1 (base):

| id | type | definition | purpose |
|---|---|---|---|
| `lab-shadow` | radialGradient (default center) | `#000` @0% opacity 0.75, `#000` @100% opacity 0 | soft contact shadows under furniture and ball |
| `lab-halo` | radialGradient | `#12302b` 0.55 @0%, `#0b1a18` 0.25 @60%, `#050706` 0 @100% | big ellipse (rx 720, ry 420) under the floor center; hidden by CSS in the current build |
| `lab-lens` | radialGradient cx 40% cy 35% r 70% | `#3b4a6b` @0%, `#141b2b` @55%, `#05070b` @100% | camera lens glass |
| `lab-sky` | linearGradient vertical (0,0 to 0,1) | `#080c1a` @0%, `#141a33` @55%, `#3a2a44` @100% | window night sky with a dusky purple horizon |
| `lab-perf` | pattern 3x3 userSpaceOnUse | one 1.3x1.3 rect `#0a0b0c` | perforated rack top |
| `lab-win-clip` | clipPath rect 96x78 (in window local space) | | clips sky and skyline to the window opening |
| `lab-print-clip` | clipPath rect | photo area of the framed print | |
| `lab-poster-clip` | clipPath rect 60.4x60.4 | photo area of the poster | |
| `lab-rbb-clip-7` | clipPath circle | rubber band ball disc | |
| `lab-rbb-shade-7` | radialGradient cx 36% cy 30% r 75% | white 0.22 @0%, white 0 @40%, black 0.35 @78%, black 0.62 @100% | spherical shading over the bands |

Defined in SVG #2 (lights):

| id | type | definition | purpose |
|---|---|---|---|
| `lab-glow-{green,emerald,cyan,blue,amber,red,white,warm}` | radialGradient | color @0% op 0.7, @35% op 0.22, @100% op 0 | LED halos, packet halos, picture lights, lamp glow |
| `lab-pool-{same 8 colors}` | radialGradient | color @0% op 0.16, @45% op 0.05, @100% op 0 | floor light pools |
| `lab-crt-glow` | radialGradient cx 50% cy 45% r 65% | `#ffb347` 0.16 @0% to 0 @100% | phosphor bloom over the CRT |
| `lab-scan` | pattern 4 x 1.1 userSpaceOnUse | rect 4 x 0.45 `rgba(0,0,0,0.35)` | CRT scanlines (about 0.45 dark / 0.65 clear per 1.1 units in screen local space) |
| `lab-occlude` | mask userSpaceOnUse x -400 y -400 w 2400 h 1900 | white full rect, then black `boxHull` polygons of every foreground object | keeps floor pools, wall wash, cables and packets from painting over furniture |
| `lab-beam` | linearGradient userSpaceOnUse from the spot lens (557.65, 548.20) to the cabinet top center under the rack (621.67, 731.68) | `#e6f0ff` 0.3 @0%, 0.08 @55%, 0.02 @100% | spotlight cone on the rack |
| `lab-vinyl-sheen` | linearGradient diagonal (0,0 to 1,1) | white 0 @0%, 0 @44%, 0.13 @50%, 0 @56%, 0 @100% | static specular streak across the record |

Occluders in `lab-occlude` (world boxes, hull polygons filled black): lamp base (445,455,0, 14x14x2.4), lamp pole (450.5,460.5,0, 3x3x94), desk (546,460,0, 200x92x65), CRT (578,464,65, 52x50x65), camera (668,518,65, 26x24x21), record cabinet (752,446,0, 56x42x46), rack cabinet (452,620,0, 84x60x48), rack (459.8,627.5,48, 68.4x45x79.74), chair seat (590,582,0, 36x36x49), chair back (591,613,0, 34x5x97).

### 3.4 Hotspot and marker styling (scene overlays)

- `.lab-hot` polygons: `fill: transparent; stroke: transparent; stroke-width: 1.4px; stroke-linejoin: round; cursor: pointer; pointer-events: all; outline: none; transition: fill .2s, stroke .2s`. Hover, `:focus-visible` and `[data-active]`: `fill: #e6d9b51a; stroke: #e6d9b5e6`. Rack hotspot hover and active fill is lighter: `#e6d9b508`. `[data-hotspots="off"] .lab-hot { pointer-events: none }`.
- Hint markers (`g[data-mk].lab-mk`, 8 of them): ring `circle r=6.5 .lab-mk-ring` (no fill, stroke putty 1px, `transform-box: fill-box; transform-origin: 50%`, `lab-mk-ping` 2.8s ease-out infinite), back `circle r=6.5 .lab-mk-back` (fill `#0607089e`, stroke `#e6d9b580` 0.9px), dot `circle r=2.6 .lab-mk-dot` (fill putty, `lab-mk-breathe` 2.8s ease-in-out infinite). Staggered `animation-delay: 0.43s * index`. Each marker group gets `transform="scale(viewBoxW / elementW * O)"` on every camera update so it keeps a constant on-screen size: radius `6.5 * O` px, `O = clamp(fitScale / 0.9, 0.6, 1)` (6.5 px at desktop, 3.9 px on phones). Anchors are the centers of the hotspot faces for: monitor, resume, camera, record, rack, map, cert (red band one), print.
- Tooltip: `lab-tip pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-md border border-putty/25 bg-[#0b0d0c]/95 px-2 py-1 font-mono text-[11px] leading-none text-putty shadow-[0_8px_24px_-8px_rgba(0,0,0,0.9)]`; hidden `opacity 0, translate(-50%, calc(-100% - 6px))`, shown `[data-on]` `opacity 1, translate(-50%, calc(-100% - 10px))`, transitions 0.15s.

---

## 4. Animation and timing

GSAP 3.15 with `useGSAP` (scope = section), `DrawSVGPlugin` and `MotionPathPlugin` registered. The CSS keyframes live in the global stylesheet.

### 4.1 CSS keyframes used by the scene

| class | animation | keyframes |
|---|---|---|
| `.lab-led-act` | `lab-act 1.2s step-end infinite` (duration overridden per LED) | opacity 1 @0%, 0.15 @8%, 1 @13%, 0.2 @36%, 1 @40%, 0.1 @61%, 1 @65%, 0.3 @71%, 1 @75% (step-end holds each value until the next stop: irregular network flicker) |
| `.lab-led-disk` | `lab-disk 3s step-end infinite` (duration overridden per LED) | 0.12 @0%/100%, 1 @4%, 0.2 @7%, 1 @10%, 0.12 @13%, 0.12 @52%, 1 @55%, 0.3 @58%, 1 @61%, 0.12 @64% (two double-blinks per cycle) |
| `.lab-led-pulse` | `lab-pulse 3.2s ease-in-out infinite` | 1 @0%/100%, 0.35 @50% |
| `.lab-spin` | `lab-spin 1.8s linear infinite`, `transform-box: fill-box; transform-origin: 50%` | to `rotate(360deg)` (33 1/3 rpm) |
| `.lab-note` | `opacity: 0`; under `html[data-lab-music]`: `lab-note 2.6s ease-out infinite` | 0%: opacity 0, translate(0); 18%: opacity 0.9; 100%: opacity 0, translate(7px, -28px) (user units) |
| `.lab-mk-ring` | `lab-mk-ping 2.8s ease-out infinite` | 0%: opacity 0 scale 1; 12%: opacity 0.6; 75% to 100%: opacity 0 scale 2.1 |
| `.lab-mk-dot` | `lab-mk-breathe 2.8s ease-in-out infinite` | 0.55 at 0%/100%, 1 at 50% |
| HUD buttons | `lab-fade-in` | from opacity 0, translateY(8px) to none |

The CRT block caret is a `<tspan class="lab-caret">█</tspan>`, but no `.lab-caret` rule exists in the CSS, so it is static (only the terminal overlay caret blinks, via `lab-caret` 1.05s steps). Reproduce as static unless a blink is wanted.

### 4.2 LED timing randomization

Each blinking LED gets inline `animation-duration` and a negative `animation-delay` derived from a seeded pair `r2 = [rng(), rng()]` (rack seed 83):

```
ranges: act [0.7s, 1.9s], disk [1.8s, 4.6s]
duration = min + r2[0] * (max - min)          // toFixed(2) + "s"
delay    = -(r2[1] * duration)                // starts mid-cycle so LEDs are desynced
```

Scene LED inventory (8 `act`, 2 `disk`, 6 `pulse`):

| LED | position (local) | color, r, glow | behavior |
|---|---|---|---|
| 8 switch port LEDs | switch front (13, 32.2) + (11 + 4.6i + 1.7, 2.6), rack front face, scale 0.9 | green, 0.45, 3.2 | `act`, random rates |
| switch power | (13+2.2, 32.2+6) | green, 0.5, 3 | steady |
| P340 power | P340 front (12, 51) + (46.5, 6.8) | white, 0.6, 4 | steady |
| P340 disk | (12, 51) + (33.8, 7.6) | amber, 0.35, 3 | `disk` |
| SSD activity | (31, 46.6) + (26.4, 2.2) | blue, 0.45, 3.4 | `disk` |
| PDU | rack side panel local (43, 12.9) plus an orange `#fb923c` 2.4x3.4 rocker rect at (41.8, 11.2) | amber, 1, 4 | steady |
| CRT power | CRT bezel (60, 53.8) | green, 0.7, 4 | steady |
| record player | plinth front (43, 3) | amber core only r 0.55, no glow | steady |
| city windows | 6 of the 23 lit skyline windows (indices 0,4,8,12,16,20) | `.lab-led-pulse` with delay `-(0.37 * index)s` | slow pulse |

### 4.3 Ambient GSAP loops (start when the room is lit, `ambient()`)

Skipped entirely when `prefers-reduced-motion: reduce`. All timelines are stored, paused when the room view is left (`sleep`), resumed on return, killed on power-down.

**Data packets** (4 groups `g[data-pkt]`, each a halo circle r 9 `url(#lab-glow-{color})` plus core circle r 2 `#ecfdf5`):

| cable | dir | color | meaning |
|---|---|---|---|
| wan | +1 (wall outlet to rack) | white | inbound |
| wan | -1 | cyan | outbound |
| desk | +1 (rack to desk) | amber | to workstation |
| desk | -1 | cyan | back to rack |

Per packet:
```
len      = screen length of the cable polyline (wan 196.64, desk 596.64 units)
duration = len / random(110, 150)            // wan 1.31 to 1.79s, desk 3.98 to 5.42s
timeline({ repeat: -1, delay: random(0, duration), repeatDelay: random(0.4, 2.4) })
  .set(pkt, { opacity: 0 })
  .to(pkt, { duration, ease: "none", motionPath: { path: "#lab-cable-X", align: "#lab-cable-X",
              alignOrigin: [0.5, 0.5], start: dir>0 ? 0 : 1, end: dir>0 ? 1 : 0 } }, 0)
  .to(pkt, { opacity: 1, duration: 0.25 }, 0)
  .to(pkt, { opacity: 0, duration: 0.25 }, duration - 0.25)
```
Random values are evaluated once per timeline (fixed per session).

**Blocked packet and firewall alert** (`g[data-blocked-pkt]`, red halo r 9 plus red core r 2):
```
travel = len_wan * 0.48 / 140  = 0.67s      // 0.48 = fraction of the WAN path at world (434, 694, 0), mid baseboard run
timeline({ repeat: -1, delay: 1.2, repeatDelay: 4 })
  .set(blocked, { opacity: 0 })
  .to(blocked, { duration: travel, ease: "none", motionPath: { path: wan, align: wan, alignOrigin: [.5,.5], start: 0, end: 0.48 } }, 0)
  .to(blocked, { opacity: 1, duration: 0.3 }, 0)
  .set(blocked, { opacity: 0 }, travel)
  .call(incrementBlockedCounter, travel + 0.15)                 // CRT number goes 0, 1, 2 ... (toLocaleString)
  .fromTo("[data-fw-alert]", { opacity: 0 }, { keyframes: { opacity: [1, .35, 1, 1, 1, 0] }, duration: 1.8, ease: "none" }, travel + 0.1)
  .fromTo("[data-fw-burst]", { attr: { r: 1.5 }, opacity: 1 }, { attr: { r: 13 }, opacity: 0, duration: 0.9, ease: "power2.out" }, travel + 0.1)
```
Cycle period about 0.67 + 1.9 + 4 = 6.6 s. The packet travels from the wall outlet and dies halfway along the baseboard, where a red ring bursts and a red label flashes.

Firewall alert geometry (anchor `(ax, ay) = iso(434, 694, 0) = (502.78, 784.48)`): leader polyline (ax, ay-2) to (ax-8, ay-26), stroke `#fb7185` opacity 0.6, width 0.8; label rect x = ax-78, y = ay-41, 82x15, rx 3, fill `rgba(20,6,8,0.92)`, stroke `#fb7185` 0.6 opacity, width 0.8; text "blocked · ufw", `.lab-mono`, font-size 8.6, fill `#fecdd3`, `text-anchor: middle` at (ax-37, ay-30.6). Burst ring: `circle` at the anchor, r animated, no fill, stroke `#fb7185` width 1. These two are outside the occlusion mask.

**CRT bar graph** (12 `rect[data-bar]`): `gsap.to(bar, { scaleY: () => random(0.25, 1), transformOrigin: "50% 100%", duration: random(0.6, 1.3), ease: "sine.inOut", repeat: -1, repeatRefresh: true })`.

**Pointer parallax** (fine pointer only, no reduced motion): `quickTo(wrapper, "x"/"y", { duration: 1.4, ease: "power3" })` driven by window `pointermove`: `x = -((clientX/innerWidth - 0.5) * 16)`, `y = -((clientY/innerHeight - 0.5) * 9)` px (max about plus or minus 8 by 4.5 px). Only applied while the scene is "settled and unzoomed" (set true when the power-up timeline completes or a focus panel closes while unzoomed; cleared, and x/y returned to 0, whenever the camera zooms, a focus opens, or the scene exits). In normal step-inside use the camera is zoomed, so this is rarely visible.

Not animated (static by design): window stars, moon, the CRT glow and scanlines (no flicker), the spotlight beam (no shimmer), the vinyl sheen, the plant.

### 4.4 Light states and the power-up timeline

Initial render state: every `[data-base]` group opacity 0.42 (dark furniture), every `[data-lights]` group, `[data-unit]`, `[data-pool]`, `[data-cable]`, `[data-tag]`, packet and alert group opacity 0. The wrapper is `opacity-0` (GSAP `autoAlpha`).

Group keys: `data-base`: room (shell and wall art, also lamp and chair), desk, deskitems, camera, record, myrack. `data-lights`: room, desk, deskitems, camera (empty), record, myrack (always visible; children are `data-unit`). `data-part` on rack units: spot, pdu, switch, p340, ssd. `data-pool`: room (2 pools), desk, myrack. `data-cable`: wan, desk.

**lightUp()** (instant, used when entering from the page and when skipping the intro): kill boot timelines; `set` bases, lights, units, pools, cables to opacity 1; `drawSVG: "0% 100%"` on lit cable paths; wrapper `autoAlpha 1, scale 1`; terminal overlay hidden; start ambient loops.

**powerUp(fast, user, onDone, silent)** (first-visit intro, after the terminal boot). Parameters: `step = fast ? 0.1 : 0.45`, `t0 = fast ? 0 : 1`. Verified live (non-fast) with a frame log; measured offsets match to within one frame.

| time (s) | target | tween |
|---|---|---|
| 0 | wrapper | non-fast: `set visibility visible, transformOrigin` = screen point of (roomBounds center x, roomBounds.y + 0.55 h); `opacity` keyframes [0, .5, .06, .75, .25, 1] over 1.2s ease none (fluorescent flicker); `scale 1.2 to 1` over 5.2s `power2.out` (slow settle). Fast: `autoAlpha 1, scale 1` 0.5s `power1.out` |
| t0 | `[data-part=spot]` | opacity keyframes [0, 1, .3, 1, .7, 1], 0.5s (fast 0.25s), ease none |
| t0+0.1 | `[data-base=myrack]` | opacity 1, 0.5s (fast 0.25s) `power1.out` |
| t0+0.2 | `[data-pool=myrack]` | opacity 1, 1.2s `power1.out` |
| t0+0.35+i*step | `[data-part=pdu,switch,p340,ssd]` (i = 0..3) | opacity keyframes [0, 1, .2, 1, .55, 1], 0.5s (fast 0.3s), ease none; non-silent also prints a terminal line |
| same | `[data-tag=...]` (non-fast only) | from opacity 0, x -8 to opacity 1, x 0, 0.35s `power2.out` |
| H+0.7 (H = t0+0.35+4*step = 3.15) | all tags | opacity 0, 0.45s, stagger 0.06 |
| H + g*d (d = fast ? 0.1 : 0.35; group 0 = room+wan cable, group 1 = desk, deskitems, camera, record + desk cable) | `[data-base=X]` | opacity 1, 0.4s (fast 0.25s) `power1.out` |
| +0.1 | `[data-pool=X]` (if any) | opacity 1, 1.2s `power1.out` |
| +0.05 | `[data-lights=X]` | opacity keyframes [0, 1, .2, 1, .55, 1], 0.6s (fast 0.35s), ease none |
| H + g*d | `[data-cable=X]` | `set opacity 1`; paths `drawSVG 0% to 100%`, 0.9s (fast 0.5s) `power2.inOut` (the cable "draws itself" from the outlet to the rack, and from the rack to the desk) |
| H+2d (3.85) | | start ambient loops; print "lab online" line |
| end | | empty tween 0.5s (fast 0.1s); total length = 5.2s in the non-fast case (the scale tween) |

Measured (desktop, non-fast, relative to timeline start): spot 0.95 to 1.43s, rack base 1.05 to 1.50s, pdu 1.30, switch 1.75, p340 2.21, ssd 2.66, wan cable and room base 3.10, room lights 3.15 to 3.74, desk group 3.45 to 4.09, desk pool 3.55 to 4.67, tags fully gone by about 4.2. Wrapper scale at 1.0s: 1.10; at 2.0s: 1.05; at 4.3s: 1.001.

**powerDown()** (logout from the terminal): terminal overlay `autoAlpha 0` 0.25s; tags `set 0`; lit cable paths `drawSVG "100% 100%"` 0.7s `power2.in` (retracts toward the far end); `[data-unit]` opacity 0, 0.2s, stagger `{ each: 0.01, from: "end" }` at 0.1; all `[data-lights]` opacity 0, 0.25s, stagger 0.08 at 0.1; pools opacity 0, 0.6s at 0.1; bases back to 0.42, 0.6s at 0.3; cables `set 0`; wrapper `autoAlpha 0` 0.7s `power2.in` at 0.5. Then camera resets to Fit.

### 4.5 Entry transition from the landing page ("step inside")

The landing page shows a pre-rendered still of this exact room (1700x1460 bitmap with a 10 px transparent margin; its inner 1680x1440 area equals `roomBounds` at about 1.8555 px per unit). Clicking it stores the still's current on-screen rect (inset by 10/1700 horizontally and 10/1460 vertically) and switches the view:

1. `html[data-view]` goes from `classic` to `room` (also `data-been-inside` added, `history.scrollRestoration = "manual"`, instant scroll to top, `yg:view` event). CSS instantly hides all classic content after `#hero` and shows `#hero` full screen (100svh); the fixed starfield sky stays, so the background never changes.
2. `lightUp()` runs (scene is fully lit at once, ambient loops start, phase becomes `live`). If the phase was already `live` in this session (second entry), the paused ambient timelines are resumed instead.
3. Camera is set (no tween) so `roomBounds` maps exactly onto the still's rect: the live SVG lands pixel-on-pixel over where the bitmap was. Measured start viewBox at 1440x900: `-687.10 158.11 2231.40 1421.62`.
4. Camera tweens to the Step-in framing: `duration 1.15, ease "power3.inOut"` (measured: settles at 1.15 to 1.18 s). The room grows from its landing position (right half on desktop, lower half on mobile) to fill the viewport, centered on the desk and rug.
5. Concurrently: the site header fades out (`header { transition: opacity .6s }`, `html[data-lab-zoomed] header { opacity: 0; pointer-events: none }`), HUD keys fade up via `lab-fade-in` (0.5s with 0.3s and 0.4s delays), the hint line "drag to look around · scroll to zoom · click anything" (touch: "drag to look around · pinch to zoom · tap anything") fades in for 5 s the first time the camera zooms (opacity transition 700 ms).
6. Reduced motion: every camera duration is multiplied by 0, so the room appears directly at the Step-in framing (verified).

There is no crossfade and no zoom of the bitmap: the switch is a hard cut between two identical images followed by a `viewBox` camera move.

### 4.6 Exit ("step outside", Esc, or zooming out past Fit)

- Dock buttons `autoAlpha 0` 0.2 s.
- Camera tweens to the still's resting rect on the landing page (document position at scroll 0, corrected for the landing sky's pointer parallax: `x - px*18, y - py*18`), `duration 0.9` (0.45 when the intro ends on a fully visible still), `ease "power3.inOut"`. If the viewport size changed since entry, it falls back to the Fit framing.
- On complete: `data-view = classic` (instant cut back to the page, which shows the still at the same place), wheel events are swallowed for 700 ms so a trailing scroll does not move the page.
- Measured at 1440x900: start `286.48 372.77 1016.91 647.87`, end `-677.23 156.25 2231.80 1421.87`, `classic` at about 0.95 s.
- Zooming out (wheel, pinch, "-" key) until the view scale is at or below 1.04 x fitScale also triggers this exit.

### 4.7 First-visit intro sequence (how the room first appears)

On a first visit (no `yg-lab` session marked active, no URL hash, no reduced motion) an inline head script sets `data-view=room`, `data-lab-intro`, `data-opening` before paint. The terminal overlay covers the screen; it types a login and `boot` (see terminal spec), prints four boot lines, then fades out (`autoAlpha 0`, 0.7 s `power2.inOut`). Then:

1. Camera jumps to the landing still's resting rect (`frameOpening`), so the room powers on exactly where it will sit on the landing page.
2. `powerUp(false)` (table 4.4): flicker in, slow 1.2 to 1 settle, rack lights first with four callout tags, then the room, then the desk group, cables drawing themselves.
3. On complete: camera tweens to the still rect (0.45 s if the still is fully on screen, otherwise 0.9 s) and the view switches to `classic`; the landing page appears around the room with no visible jump.

---

## 5. Interaction and state (scene side)

- Phase machine on `section#hero[data-phase]`: `init` to `intro` (first visit, room view at mount) or `off` (classic at mount); `intro` to `booting` (boot command or Enter) to `live`; `live` to `intro` on logout. Entering from the page goes straight to `live` with `lightUp`.
- `html` attributes: `data-view="room|classic"`, `data-lab-intro` (intro or booting; locks scroll, hides header and everything after `#hero`), `data-lab-zoomed` (camera zoomed; header hidden, `#hero { cursor: grab }`, `#hero[data-dragging] { cursor: grabbing }`), `data-lab-focus` (focus panel open; header hidden), `data-lab-music` (record playing; notes animate), `data-opening` (intro before boot; forces the terminal visible).
- `html[data-view=room]` and its body: `overflow: hidden; overscroll-behavior: none`.
- localStorage: `yg-lab` = `{ user, at, active }` (session; `active: false` after logout), `yg-lab-hints` = `"1"` once any hotspot is opened (hides the hint markers forever), `yg-boot` (boot intro seen).
- Camera input (detail in the interactions spec): drag pans after 6 px of movement (only when zoomed); wheel zoom factor `exp(-deltaY * 0.0015)` (`* 0.01` with ctrlKey, deltaY x16 for line mode) around the cursor; two-finger pinch; keys `+`/`=` zoom 1.3x, `-`/`_` 1/1.3, `0` reset to Step-in (0.8 s), arrows pan 90 px (0.4 s `power3.out`), Esc closes focus, then terminal, then exits; dock buttons zoom 1.4x. Every zoom or pan tween is `power3.out` 0.35 s, `overwrite: true`.
- Hotspot ids (19): 4 certificates, poster, print, map, monitor, resume, badge, phone, camera, record (quiet: no tooltip), rack, pdu, patch, switch, ssd, p340. On coarse pointers, a tap on a hotspot smaller than 28 px on screen zooms 2.2x at the tap point and shows the tooltip for 2 s instead of opening it.
- While a focus panel is open on the record player, the in-scene `[data-vinyl]` is hidden (opacity 0 at 0.45 s) and a lifted DOM copy takes over; the copy's spin is phase-matched by reading the current rotation from the computed matrix and setting a negative `animation-delay` of `angle/360 * 1.8 s`.

---

## 6. Responsive behavior

- No breakpoint-specific art: the same SVG renders everywhere; only the camera framing changes (formulas in 2.3). Wrapper bleed: 16 px below `md` (768), 24 px at `md` and up.
- Desktop landscape: Step-in shows the whole room width with the ceiling corner and the front slab edge cropped (scale about 1.46 at 1440x900).
- Phone portrait (390x844): Step-in scale 0.948; view about 445 units wide, centered on the desk and rug; the rack front and the left edge of the desk are visible, the window, map and record player are off to the right (reachable by dragging).
- The ResizeObserver on the section recomputes on every resize (rAF throttled) and on `document.fonts.ready`: when zoomed it preserves the current center and scale; when unzoomed it re-fits; a focused object is re-framed.
- Coarse pointer: no pointer parallax; hint copy says "pinch" and "tap"; small hotspots need a zoom tap first. `touch-action: none` on `#hero` in room view.

---

## 7. Accessibility and reduced motion

- SVG #1, #2, #3 are `aria-hidden`. Hotspot polygons are `role="button"`, `tabIndex 0` when live and not focused (else -1), `aria-label` set, a `<title>` child for native tooltips (except the record player), Enter or Space activates, focus shows the putty outline (`:focus-visible`).
- Text in the scene is decorative, at 1 to 10 user units, and duplicated in the panels.
- `prefers-reduced-motion: reduce`: the intro never auto-starts (head script exits), every camera and focus tween has duration 0, ambient GSAP loops (packets, blocked packet, bars) never start, CSS `lab-led-*`, `lab-spin`, `lab-mk-dot` animations are `none`, `lab-mk-ring` is `display: none`, tooltip transitions are off, and the music notes sit at opacity 0.8 without moving. Pointer parallax is disabled. Verified: entering shows the final framing instantly with all lights on and no packets.

---

## 8. Content model

The art is data driven. Record the shape, not the owner's specific content.

```ts
type Vec3 = [x: number, y: number, z: number];
type LedColor = "green" | "emerald" | "cyan" | "blue" | "amber" | "red" | "white" | "warm";
type Tone = { top: string; left: string; right: string };

interface RoomShell { x0: 430; y0: 440; x1: 860; y1: 790; h: 180; t: 6; slab: 12 }

interface WallFrame {            // flat object on a wall, in wall-local (u, v) units
  id: string;
  wall: "A" | "B";               // A: plane y=440, u runs +x from 430; B: plane x=430, u runs from y=790 toward 440
  u: number; v: number; w: number; h: number;
  kind: "photo" | "certificate" | "map" | "window" | "outlet";
}

interface Certificate {          // 4 instances, wall B, 36x28 each, u = 182, 224, 266, 308, v = 34
  id: string;
  issuerWordmark: string;        // 4 to 7 chars, drawn in the issuer brand color (one is multicolor per letter)
  title: string;                 // 4 to 9 chars, bold
  sealColor: string;             // hex
  band?: string;                 // optional full-width color header band (1 of 4 has it)
  label: string;                 // aria label, 20 to 40 chars
}

interface NetworkMapNode { x: number; y: number; label: string } // 8 nodes, labels 3 to 9 chars, 4 columns: 1, 1, 3, 3

interface CrtScreen {
  promptPrefix: string;          // DOS style "C:\XX>" with the owner's initials
  listCommand: string;           // e.g. "dir projects"
  listing: string[];             // 4 lines, "name<pad>.ext", 14 to 15 chars each
  counterCommand: string;        // "threats" (verbatim UI)
  barsLabel: string;             // "wan0" (verbatim UI)
  modelBadge: string;            // 6 chars, "<initials>-386" style
}

interface RackTag { part: "pdu" | "switch" | "ssd" | "p340"; text: string } // 4 tags, 18 to 30 chars, lowercase, "name · status" format

interface Hotspot { id: string; label: string; quiet?: boolean; points: string; face?: [Vec3, Vec3, Vec3] }

interface Packet { cable: "wan" | "desk"; dir: 1 | -1; color: LedColor }
interface Pool { group: string; at: [number, number]; r: number; color: LedColor }
interface Cable { pts: Vec3[]; color: LedColor }

interface RecordLabel { artist: string; title: string } // 2 short strings (7 and 8 chars) on the center label
```

Counts: 1 room, 2 walls, 1 floor (22 plank rows), 1 rug, 1 window (4 panes, 10 stars, 1 moon, 12 back buildings, 4 towers, 11 front buildings, 23 lit windows), 1 framed photo print, 1 square poster, 4 certificates, 1 network map (8 nodes), 1 wall outlet, 1 floor lamp, 1 desk (4 legs), 1 CRT, 1 keyboard (60 keys), 1 small cube, 1 resume sheet (8 text lines), 1 badge with lanyard, 1 phone, 1 rubber band ball (56 bands), 1 camera (11 lens discs), 1 record cabinet (14 record spines, 1 door), 1 turntable (6 grooves), 1 rack (6U) on a 2-door cabinet, 1 wall spotlight, 1 office chair (5 casters), 1 potted plant (9 leaves), 2 cables, 4 packets, 1 blocked packet, 4 floor pools, 15 LEDs (plus 6 pulsing skyline windows), 8 hint markers, 19 hotspots, 4 rack tags.

Verbatim generic UI labels in the scene: `blocked · ufw`, `homelab.map`, `HOMELAB` (cabinet label plate and landing still), `threats`, `wan0`, `33 · 45`, `15A RESET`, rack U numbers `06` to `01`, `CAT6`, music notes `♪ ♫ ♪`. Tooltip short names: Projects, Resume, Experience, Contact, Photography, Photo print, Network map, The rack, Patch panel, PDU, plus product and certificate names (owner content). Hotspot aria labels follow "Section: object" (for example "Projects: the CRT", "Experience: work badge", "Contact: phone", "Photography: framed print") or a product name.

Rack callout tag format: lowercase `"<device> · <status>"` (for example a PDU "· 4 outlets live" style status), 18 to 30 chars.

---

## 9. Assets

| original | how it is used | replacement plan |
|---|---|---|
| Room still bitmap (`/room/room-still-*.webp`, 1700x1460, 10 px margin, aspect 1.1644) | landing page "door" image; the camera entry and exit start and end on it | Do not copy. Render your own scene: point a headless browser at a page that renders the lit SVG with `viewBox = "376.22 363.29 916.16 786.94"` at 1700x1460 (roomBounds plus 5.39 units padding) and save as WebP. Or render the live SVG in place of the bitmap. |
| Framed print photo (`<image>` in wall A, 68x46 user units visible, `xMidYMid slice`, landscape about 1.48:1) | owner's photograph, warm architectural interior | Original landscape photo or illustration with warm lamplit tones, 1360x920 or larger; keep the white mat look. |
| Poster image (`<image>` on wall B, 60.4x60.4, `slice`, square) | owner's square poster of a person | Original square illustration or abstract poster, 1024x1024; mid-tones that read on a dark wall. |
| Certificate wordmarks and titles (SVG text) | issuer brand names | Use your own certifications or neutral placeholders; keep the "white card, colored wordmark, bold title, two gray lines, colored seal ring" layout. |
| Rack and device wordmarks (SVG text: rack maker, switch maker, PC maker, PDU maker, camera maker, record label) | real product branding | Replace with your own gear names or generic labels. Brand text is optional detail. |
| Fonts | Geist Sans, Geist Mono via `next/font` | same (open source) |
| Everything else | drawn in code | draw original shapes from section 9.1 |

### 9.1 Layer-by-layer drawing guide (original art, same composition)

All coordinates are world units unless marked "local" (wall-local u, v or face-local). Paint in this order; later items cover earlier ones. Screen bboxes are in SVG user units of the base viewBox (`322 309 1025 896`).

**SVG #1, BASE** (everything sits inside `data-base` groups at opacity 0.42 until lit, except the halo ellipse and the dark cable beds of step 12, which are direct children of the SVG at full opacity)

1. *(hidden)* Halo ellipse, center `iso(645, 615, 0)` = (834.29, 871.60), rx 720, ry 420, `lab-halo`. Optional; currently `display: none`.
2. **Floor slab**: IsoBox (424, 434, -12) 436 x 356 x 12, tone floor slab, no rim. Screen bbox x 381.6 to 1287.0, y 606.3 to 1144.8. The two visible slab sides read as a thick wooden cut.
3. **Floor planks** (`faceTop(430, 440, 0)`, local 430 x 350): base `#1a1511`; every odd 16-unit row overlaid `#1d1813`; seams `stroke #0f0c09` 0.6: long seams every 16 along y, butt joints in row t at `((53t) mod 97) + 20`, then every 97 along x (staggered planks). Planks run parallel to wall A.
4. **Rug** (same face, local origin (150, 158) = world (580, 598)), 206 x 156, rx 2, fill `#1b1a2c`; outer border inset 6 stroke `#3a3656` 1.4; inner border inset 12 stroke `#2a2740` 0.6; fringe: 26 ticks every 5.9 (from 4) on both short ends (world x = 580 and x = 786), 3 long, `#3a3656` 0.6. Screen bbox x 601 to 1015, y 817 to 1056.
5. **Wall A** (right-hand back wall): IsoBox (424, 434, 0) 436 x 6 x 180, tone wall A, no rim. Interior face is the "left" face at y = 440.
6. **Wall B** (left-hand back wall): IsoBox (424, 440, 0) 6 x 350 x 180, tone wall B. Interior face is the "right" face at x = 430.
7. **Wall A decor** (`faceLeft(430, 440, 180)`, local u along wall, v down from the top):
   - Baseboard: rect y 175, full width 430, h 5, `#0e1113`.
   - Window recess: rect (232.5, 22.5) 103 x 85, `#0b0d0f`.
   - Window (local group at (236, 26), clipped to 96 x 78): `lab-sky` fill; 10 tiny stars r 0.35 `#dbe4f5` op 0.7 scattered in the top third; moon disc at (82, 12) r 4.6 `#e7ecf4` with a crater r 1 `#cfd6e2` slightly up-left; a back row of 12 low buildings (`#141b2c`, widths 4 to 7, tops at 44 to 56); 4 taller towers `#0c1120` between x 30 and 79 (one round-topped, one crenellated, one with a pointed spire and a 0.6 antenna to y 5, one with a pointed roof), tops at 13 to 29; front row of 11 buildings `#070a12` (widths 5 to 10, tops at 58 to 66). World x 666 to 762, z 76 to 154; screen bbox x 1058 to 1168, y 567 to 733.
   - Window bars: vertical at x 283 (2 wide, full height), horizontal at y 60 (2 tall, full width), `#0b0d0f` (4 panes, upper row 34 tall).
   - Framed print: shadow rect offset (1.4, 1.8) `rgba(0,0,0,0.45)`; frame (24, 30) 80 x 58 `#0c0d0e`; mat inset 2.4 `#ecebe7`; photo inset 6 (68 x 46), clip `lab-print-clip`. World x 454 to 534, z 92 to 150; screen bbox x 816 to 907, y 432 to 561.
   - Network map board at (344, 36) 80 x 46: shadow, frame `#0c0d0e`, inner board inset 2 `#0f1a24`; title text at (+5, +7.4) size 2.8 `#e2e8f0` mono; tree lines `#94a3b8` 0.4 op 0.8 (root to hub, hub to 3 nodes, last column dashed `1 1`); 8 node circles r 1.8 fill `#0f1a24` stroke `#e2e8f0` 0.45 with labels below (size 2.1 `#cbd5e1` mono, centered) at local (10,25), (27,25), (45,15), (45,25), (45,35), (64,15), (64,25), (64,35). Screen bbox x 1182 to 1273, y 651 to 765.
8. **Window sill**: IsoBox (661, 440, 73) 106 x 6 x 3, tone window sill.
9. **Wall B decor** (`faceRight(430, 790, 180)`, u runs from the front end toward the corner):
   - Baseboard: rect y 175, width 350, h 5, `#0e1113`.
   - 4 certificates at u = 182, 224, 266, 308, v = 34, each 36 x 28: shadow offset (1.2, 1.6) `rgba(0,0,0,0.45)`; frame `#0c0d0e`; paper inset 2.4 (31.2 x 23.2) `#e9e6de`; optional color band (31.2 x 7) at top; issuer wordmark size 3.2 at (+4.6, +8); title size 3.3 bold `#1f2328` at (+4.6, +12.6); two gray lines `#b5b1a8` 0.8 tall at +16 (w 19) and +18.4 (w 12); seal disc r 3 (brand color, op 0.85) with a white ring r 1.9 stroke `#f5f3ee` 0.4 at (+28.6, +21). World y 446 to 608, z 118 to 146; screen bboxes start at x 596.5, 644.5, 692.5, 740.6 (each 41 x 61).
   - Poster: shadow (23.2, 37.6) 64 x 64; frame (22, 36) 64 x 64 `#0c0d0e`; image (23.8, 37.8) 60.4 x 60.4, clip `lab-poster-clip`. World y 704 to 768, z 80 to 144; screen bbox x 414 to 487, y 598 to 725.
   - Wall outlet: (40, 156) 9 x 11 rx 0.8 `#c9ccd0` with a dark socket (42.3, 159.4) 4.4 x 3.6 `#1a1c1e`. World y 741 to 750, z 13 to 24. The WAN cable starts here.
10. **Floor shadows** for the lamp (445, 455, 14 x 14, spread 10) and plant (826, 454, 22 x 22, spread 10).
11. **Plant** (front-right corner of the back walls): pot IsoBox (826, 454, 0) 22 x 22 x 20, tone plant pot; soil `faceTop(828, 456, 20)` 18 x 18 `#120d0a`; 9 lens-shaped leaves drawn in screen space from anchor `iso(837, 465, 20)` = (1225.25, 872.92) minus 2 in y, each rotated about the anchor: (rotation deg, length, half width, color): (-24, 30, 5, `#1d3a28`), (22, 32, 5, `#1a3424`), (-8, 40, 5.5, `#24452f`), (8, 38, 5, `#21402c`), (-38, 22, 4.5, `#18301f`), (36, 24, 4.5, `#1a3424`), (0, 44, 5, `#2a5036`), (-16, 26, 4, `#2a5036`), (16, 26, 4, `#24452f`). Leaf = two mirrored cubic curves from base to tip (widest about 1.4 x half width at 35% height) plus a midrib line to 92% length, `rgba(255,255,255,0.08)` 0.5.
12. **Cable beds (unlit)**: both cable polylines (see 4.3 and below) stroked `#0c1211` 3.2 plus `rgba(160,255,230,0.07)` 1, round caps and joins.
    - WAN: (431, 745.5, 17) down to (431, 745.5, 1.5), (434, 745.5, 0), along wall B's baseboard to (434, 652, 0), then into the rack cabinet at (470, 652, 0).
    - Desk: from behind the cabinet (470, 630, 0) to (437, 630, 0), along wall B to the corner (437, 444, 0), along wall A to (604, 444, 0), then up the wall to desk height (604, 444, 66).
13. **Floor lamp** (back corner): base plate IsoBox (445, 455, 0) 14 x 14 x 2.4 metal; pole IsoBox (450.5, 460.5, 2.4) 3 x 3 x 91.6 metal; shade = truncated cone in screen space between `iso(452, 462, 94)` (ellipse rx 19.40, ry 11.20) and `iso(452, 462, 110)` (rx 13.74, ry 7.93), side `#3b3127`, top ellipse `#4a3e31`. Shade screen center bottom (788.57, 519.16).
14. **Desk** (wood top, world (546, 460), 200 x 92): floor shadow spread 18; 4 legs IsoBox 6 x 6 x 60 metal at (550, 464), (736, 464), (550, 542), (736, 542); top IsoBox (546, 460, 60) 200 x 92 x 5 wood, rim on. Screen bbox of top x 793 to 1127, y 618 to 817.
15. **CRT**: riser IsoBox (580, 484, 65) 48 x 30 x 3 puttyDark; rear tube housing IsoBox (578, 464, 73) 52 x 32 x 44 puttyDark; front bezel IsoBox (568, 496, 68) 72 x 18 x 62 putty. Front face (`faceLeft(568, 514, 130)`, local 72 x 62): recess (6, 3) 60 x 46.5 rx 4 `#6f6958`; inner lip (7.8, 4.8) 56.4 x 42.9 rx 3.2 `#1d1a14`; dark screen (9, 6) 54 x 40.5 rx 2.6 `#0b0904`; model badge text size 2.6 bold `#4a4538` letter-spacing 0.3 at (9, 54.8); 6 vent slots 1.2 x 3.4 rx 0.4 `#6f6958` at x 31 + 2.4i, y 52.6; power button (57, 52) 6 x 3.6 rx 0.6 `#77705f`. Screen bbox of bezel x 862 to 965, y 571 to 712.
16. **Keyboard**: IsoBox (576, 522, 65) 58 x 19 x 2.4 putty; keys on `faceTop(576, 522, 67.4)`: 4 rows x 15, 2.9 x 2.9 rx 0.4 at (2.4 + 3.6i, 2.2 + 3.8r), `#c9c0a9`; spacebar keys (row 3, i 4 to 10) `#d8d0bb`.
17. **Small cube** (speaker or hub) IsoBox (564, 526, 65) 9 x 9 x 11 metal.
18. **Desk items** (`faceTop` at z 65 plus a hair):
    - Resume sheet at (698, 468): under-sheet (2, -1.5) 30 x 39 `#d9d6cf`; top sheet rotated -7 deg about its center, 30 x 39 `#f1efe9`, heading bar (4, 4) 16 x 2 `#1f2328`, subline (4, 7.6) 10 x 0.9 `#8a8f96`, 8 lines at y 11 + 3.1t, widths 22 (14 every third), 0.8 tall `#b8b4ab`.
    - Work badge at (549, 533) 13 x 17 rx 1 `#f1f5f9`, header band 4 tall `#1e3a8a`, photo square (2, 6) 5 x 6 `#94a3b8`, two lines `#475569` and `#94a3b8`; lanyard loop above it, a cubic loop stroke `#1d4ed8` 1.2.
    - Phone body IsoBox (646, 530, 65) 11 x 20 x 1.2, tone phone.
    - Rubber band ball (center world (662, 488, 77.6), r 12.6): contact shadow `faceTop` circle r 11.97 `lab-shadow`; disc at screen (998.91, 696.57) radius 20.37 fill `#a87d48`; clipped to the disc, 56 band arcs: each a half ellipse centered on the disc whose endpoints are diametrically opposite on the rim (a great circle seen at a tilt; minor/major ratio random 0.1 to 0.98, random orientation, front half only), drawn as a dark under-stroke `rgba(0,0,0,0.32)` (width w + 0.6) then a color stroke; 26 tan bands (`#c59a62`, `#b8894f`, `#d1aa72`, width 0.6 to 0.96) then 30 colored bands (30% tan, else `#d8452f #2f6fd6 #3b9e4f #e8b72c #e47524 #8a52c4 #de5c96 #1e9e98`, width 0.9 to 1.68); shading overlay `lab-rbb-shade`; edge ring r 19.97 `rgba(0,0,0,0.45)` 0.8. Use your own seed.
19. **Camera** (world (668, 518, 65), lens facing +y): body IsoBox 26 x 13 x 16 (rim on); viewfinder hump IsoBox (675, 520, 81) 11 x 10 x 4.5 (rim on) with a 2.3-size white bold wordmark on its +y face; mode dial IsoBox (687.5, 521, 81) 5 x 5 x 2; grip IsoBox (681, 531, 66.5) 6 x 3 x 13. Lens: 11 discs stacked along +y (y 531 to 541), each `faceLeft(668, 531 + n, 81)` circle at local (10, 9.5) r 7: normal `#121417`; discs 4 and 7 `#2f3338` with a `#8b929a` 0.4 ring (grip rings); front disc 10 `#0b0c0e` with glass r 5.2 `lab-lens`, a `#3a3f45` 0.5 ring and a specular ellipse (8.2, 7.6) rx 1.5 ry 0.9 `rgba(255,255,255,0.35)`. Screen bbox x 944 to 1001, y 710 to 770.
20. **Record cabinet** (world (752, 446), right end of wall A): floor shadow spread 12; 4 feet 3 x 3 x 6; cabinet IsoBox (752, 446, 6) 56 x 42 x 34, cabinet wood. Front face `faceLeft(752, 488, 40)` local 56 x 34: open shelf (3, 4) 25 x 26 `#120d09` holding 14 record spines 1.4 wide at x 4 + 1.7t, heights 23 to 26, bottom-aligned at 30, colors in order `#7a2f22 #2d4b6e #c9a14a #3c5d3a #8b5a2b #1f1f22 #6b3a6b #a8432c #d6cfbf #2c6f73 #4a4a52 #b8862f #5a2a2a #7c8a99`; door (31, 4) 22 x 26 `#30231a` stroke `rgba(0,0,0,0.35)` 0.4 with a brass pull (33, 14) 0.9 x 6 rx 0.45 `#c9a14a`.
21. **Turntable**: plinth IsoBox (757, 451, 40) 46 x 33 x 6, tone plinth; deck `faceTop(757, 451, 46)` local: plate (0.8, 0.8) 44.4 x 31.4 `#1d1e21` stroke `rgba(255,255,255,0.06)` 0.3; platter rim (15, 16.5) r 14.3 `#8b9096`; knob (4, 29) r 1.4 `#2b2d31` stroke `#6b7076` 0.3; switch (7.5, 28) 4 x 1.6 `#2b2d31`; speed text "33 · 45" size 1.6 `rgba(255,255,255,0.35)` mono, right-aligned at (42, 30.6).
22. **Rack cabinet** (world (452, 620), 84 x 60 x 48, rim on) with floor shadow spread 16. Inside the `myrack` group the spotlight (step 23) is painted first, then the shadow, cabinet and rack. Front face `faceLeft(452, 680, 48)`: door split (41.7, 4) 0.6 x 40 `#050606`; two pulls (38, 12) and (44.4, 12) 1.6 x 9 rx 0.8 `#2b2f33`; label plate (6, 5) 22 x 4.6 rx 0.4 `#eeece4` with "HOMELAB" size 2.9 bold mono `#111` letter-spacing 0.4. Screen bbox x 539 to 704, y 684 to 843.
23. **Spotlight** on wall B above the rack: bracket IsoBox (430, 648, 163) 6 x 4 x 2.6; head IsoBox (434, 646.5, 156) 8 x 7 x 8 (dark tones). Screen around (549 to 566, 533 to 557).
24. **Rack** (10-inch 6U, centered on the cabinet: origin (459.8, 627.5, 48), size 68.4 x 45 x 71.1; every face is authored in a 76 x 50 x 79 local box and scaled 0.9):
    - Side panel (`faceRight(528.2, 672.5, 119.1) scale(0.9)`, local 50 x 79): interior `#090b0c`; device silhouettes seen through the panel: switch `#1a1d20` (4, 32.2) 30 x 7.6; PC `#121416` (4, 51) 36 x 10.8; SSD `#474b4f` (6, 46.6) 26 x 4.4; PDU `#111315` (37, 9.5) 12 x 8 stroke white 0.1; tinted acrylic `rgba(175,205,220,0.09)` over everything; frame posts 3 wide both edges, top rail 6 tall, bottom rail 4 tall, all `#b5bbbf`.
    - Top (`faceTop(459.8, 627.5, 119.1) scale(0.9)`, local 76 x 50): `#1c1f22` stroke `rgba(255,255,255,0.14)` 0.5; inner (4, 4) 68 x 42 filled `lab-perf`.
    - Front (`faceLeft(459.8, 672.5, 119.1) scale(0.9)`, local 76 x 79): back `#0a0c0e`; side rails 7 wide `#d6dadd`; top header 8 tall `#e2e5e7` with a two-line maker wordmark (small mono 1.8 over a 3.8 bold line, `#111`); bottom rail 74 to 79 `#d6dadd`; 6 rail holes per side r 0.8 `#7d8489` at y 13.5 + 11r with U numbers 06 to 01 (size 1.4 `#8a9196`). Units top to bottom: blank 1U (8 to 19, plate `#0e1012` with 4 screws r 0.9 `#454b50`); patch panel (19.3 to 24.7, `#0b0c0e`, 12 keystone holes 2.9 x 2.8 `#040506` at x 11 + 4.1667i, the middle 8 filled with white plugs `#eef1f3`); switch shelf (30 to 41: ears `#121416`, lip `#1d2023`) holding the switch (13, 32.2) 50 x 7.6 `#262a2e` with 8 ports 3.4 x 2.9 `#060708` at x 11 + 4.6i; 8 white patch cords, cubic curves from each plug down to its switch port, `#eef1f3` 0.9 round, opacity 0.85; 2U shelf (41 to 63) with an SSD (31, 46.6) 28 x 4.4 rx 0.8 `#6a6f74` (dotted vents) on top of a tiny PC (12, 51) 50 x 10.8 `#121417` (vent dot grid, red vertical badge `#b91c1c`, 2 USB slots, power button ring); blank 1U below; bottom vent strip (7, 72) 62 x 2 `#15181b` with 26 slots.
    - 2 carry handles on top: U-shapes 8.64 tall above the top at y = 650, spanning x (l + 4.68 to l + 17.37) and (l + 51.03 to l + 63.72), where l = 459.8, stroke `#0b0c0d` 4.4 plus `rgba(255,255,255,0.14)` 0.8.
    - Screen bbox of the rack x 557 to 686, y 589 to 769.
25. **Office chair** (world center (608, 600), facing the desk, back toward the viewer): floor shadow (588, 580) 40 x 40 spread 10; 5-star base on `faceTop(584, 576, 3)`: spokes from (24, 24) length 21 at angles `i*72deg + 0.3rad`, `#2a2f35` 2.6 round, casters r 2 `#0d0f11`; gas lift IsoBox (606, 598, 4) 4 x 4 x 38 metal; seat IsoBox (590, 582, 42) 36 x 36 x 7 fabric; back IsoBox (591, 613, 49) 34 x 5 x 48 fabric; back cushion sheen `faceLeft(591, 618, 97)` rect (3, 4) 28 x 40 rx 4 `rgba(255,255,255,0.025)`. Screen bbox x 754 to 864, y 707 to 869.

**SVG #2, LIGHTS** (same viewBox, `will-change: transform`)

26. Masked group (`mask="url(#lab-occlude)"`):
    - **Room lights** (`data-lights="room"`): on wall A and wall B, a warm wash band rect (y 164, 11 tall, `#fdba74` op 0.05) and a thin warm LED strip (y 174.4, 0.7 tall, op 0.55) along the full length just above the baseboard; picture lights (small fixture bar 14 x 1.6 rx 0.8 `#2b2f33` with its top 3 units above the frame top, plus a glow ellipse centered 10 units below the frame top, rx 20 ry 14, `lab-glow-white` op 0.28; both exist only in the lit layer) over the print, the map, each certificate and the poster; moon glow circle r 13 `lab-glow-white` op 0.35 behind the window moon; 23 lit skyline windows 0.9 x 0.9 op 0.75 (`#fcd9a0`, every third `#dbeafe`); floor lamp glow ellipse at the shade mouth rx 46 ry 30 `lab-glow-warm` op 0.6 plus the lit shade opening ellipse rx 17.78 ry 10.27 `#fde2b8` op 0.6 (the lamp pole occluder cuts through it, so the pole reads in front of the glow).
    - **Floor pools** (`faceTop` circles): warm r 95 at (456, 468) under the lamp [screen center (786.28, 649.84)], blue r 120 at (714, 520) under the window [(1021.77, 854.44)], amber r 95 at (596, 572) in front of the CRT [(827.44, 810.88)], cyan r 105 at (494, 652) around the rack [(619.38, 796.36)].
    - **Lit cables**: same polylines, glow stroke LED color op 0.12 width 5, core stroke op 0.55 width 1.1 (ids `lab-cable-wan` cyan, `lab-cable-desk` amber).
    - **Packets** and **blocked packet** groups (positioned by MotionPath).
27. Firewall burst ring and alert label (unmasked, see 4.3).
28. **Desk lights**: CRT screen group on the bezel face: screen fill `#1a0f03`; `lab-crt-glow`; text (mono, size 2.5, `#ffb347`): prompt line at (12, 11), 4 dim listing lines at y 15.2 + 3.4r (`rgba(255,179,71,0.45)`), second prompt at y 30.4, big counter (size 6) at y 38, final prompt with a block caret at y 43; bar graph baseline (39, 40) to (60, 40) dim 0.3; 12 bars 1.1 wide at x 39.4 + 1.75i, heights 5 to 23 (seeded), bottom at y 40, `#ffb347` op 0.7; "wan0" label size 2.2 dim at (39, 11); scanline overlay `lab-scan` on top. Green power LED.
29. **Desk item lights**: phone screen on `faceTop(646, 530, 66.25)`: (0.9, 1.2) 9.2 x 17.6 rx 1.2 `#0f172a`, notification pill (1.8, 3) 7.4 x 3.2 rx 0.8 `#e2e8f0` op 0.85 with a line `#334155`.
30. **Record lights**: vinyl group on `faceTop(757, 451, 46.6)`, spinning sub-group (`.lab-spin`): disc r 13.5 `#0b0b0c`, 6 grooves r 12.6 to 6.6 step 1.2 stroke `#1d1d20` 0.35, two highlight arcs (r 11.8 from 20 to 70 deg, `rgba(255,255,255,0.14)` 0.5; r 8.6 from 200 to 245 deg, 0.1, 0.45), center label r 4.6 `#c2c6cb` with its lower half `#8f959c`, two small label texts (bold 1.25 and 0.95), spindle r 0.5 `#cfd3d8`; then the static `lab-vinyl-sheen` disc. Tonearm on `faceTop(757, 451, 48.6)`: pivot (39, 6) r 2.6 `#9aa0a6` with hub r 1.2 `#5b6167`, counterweight (42.5, 2) r 1.7 `#4b5056`, arm (39, 6) to (25, 22) `#c9ced3` 0.8 round, headshell 3.2 x 1.8 `#2a2d31` rotated along the arm; amber LED; 3 music notes (size 9, `#e6d9b5`) at screen (iso(772, 467.5, 56).x - 6 + 7i, iso(...).y) = around (1142 to 1156, 784).
31. **Rack lights** (`data-lights="myrack"`, units individually faded): spotlight beam polygon from two points at the spot (world (437, 647, 160) and (437, 653, 160)) to two points on the cabinet top level (536.2, 621.5, 48) and (453.8, 680.5, 48), fill `lab-beam`, plus a hot spot circle r 10 `lab-glow-white` op 0.8 at the spot; PDU amber LED on the side panel; switch, PC and SSD LEDs on the front face (4.2).
32. **Rack tags** (`data-tag`, only during power-up): right edge of each label box at x = 522.85, rows centered at y = 612.11, 634.11, 656.11, 678.11 (22 apart, starting 18 above the rack's top-front-left corner (556.85, 630.11)); box width `5.9 * chars + 14`, height 16, rx 3, fill `rgba(8,9,10,0.9)`, stroke putty op 0.45 0.8; text mono size 9.8 `#efe6cc` 7 in from the left, baseline +3.4; leader polyline from the box edge 10 units right then to the device anchor, putty op 0.6 0.8; anchor dot r 1.8 putty.

**SVG #3** hint markers, **SVG #4** hotspot polygons (3.4).

---

## 10. Implementation plan

Read `node_modules/next/dist/docs/` before writing code (Next 16.2 has breaking changes from older versions).

Suggested files:

```
lib/iso.ts                       iso(), faceTop/Left/Right(), boxHull(), pathD(), pts(), screenLength(), mulberry32()
components/room/config.ts        ROOM shell, palette (TONES, LED), object coordinates, cables, pools, packets, tags, hotspots (typed per section 8)
components/room/primitives.tsx   IsoBox, FloorShadow, Led, OnFace (wraps children in a face matrix)
components/room/objects/*.tsx    Floor, Rug, Walls, WindowView, WallFrames, Certificates, NetworkMap, Lamp, Desk, Crt, Keyboard,
                                 DeskItems, RubberBandBall, Camera, RecordCabinet, Turntable, Rack (Front, Side, Top), Chair, Plant, Cables
components/room/RoomBase.tsx     SVG #1 (memo, no props)
components/room/RoomLights.tsx   SVG #2 (memo, no props) incl. defs, mask, pools, packets, tags
components/room/HintMarkers.tsx  SVG #3
components/room/Hotspots.tsx     SVG #4
components/room/useRoomCamera.ts camera state {x,y,w,h}; setViewBox on all [data-cam]; fit(), stepIn(), toStill(); ResizeObserver
components/room/useRoomPower.ts  lightUp, powerUp, powerDown, ambient start/pause/kill
components/room/LabHero.tsx      "use client"; section#hero; orchestrates phase, view events, HUD
lib/view.ts                      data-view store (useSyncExternalStore), enterRoom/setDoor/wayOut handshake with the landing still
```

- Everything that touches GSAP or the DOM is a client component. The static art (SVG #1) has no props and can be produced by a server component passed into `LabHero` as `children`, which avoids shipping and hydrating thousands of nodes twice. If you keep it client-side, wrap it in `memo` so camera updates never re-render it (the camera writes `viewBox` imperatively, not through React state).
- Register `useGSAP`, `DrawSVGPlugin`, `MotionPathPlugin` once. Scope selectors to the section.
- Camera: tween a plain object `{x, y, w, h}` with `onUpdate` that writes `viewBox` to the four SVGs and rescales the hint markers. Keep `w/h` equal to the element aspect. Recompute element metrics on resize (subtract the wrapper's current GSAP x/y when measuring).
- Entry handshake: the landing still component registers a function returning its rest rect (document coordinates, depth 18 for the sky parallax). On click it calls `enterRoom(currentImageRect, restRect, 18)`. The room reads the rect once, sets the camera so `roomBounds` matches it, then tweens to Step-in. Inset the image rect by its transparent margin (10/1700, 10/1460).
- Gotchas:
  - SVG ids are document-global. Gradients used by both layers must be defined once; if the scene is ever rendered twice (for example a live landing preview), prefix ids with `useId`.
  - The record spin lives inside a `matrix()` face transform, so the rotation must be on an inner `<g>` with `transform-box: fill-box; transform-origin: 50% 50%`; the bbox center must be the record center (keep all children inside the disc).
  - CSS `translate()` on SVG text (music notes) is in user units of that element's coordinate system.
  - `drawSVG` needs the cable paths to be real `<path>` elements; reset to `"0% 100%"` in `lightUp`.
  - MotionPath `align` to a path in the same SVG; `alignOrigin [0.5, 0.5]` on a group whose content is centered at (0, 0).
  - Keep packets, pools and wall wash inside the occlusion mask, or furniture will look transparent.
  - Multiply every camera duration by `reducedMotion ? 0 : 1` instead of branching.
  - On leaving the room view, pause ambient timelines (do not kill) so they resume without a restart pop.
  - After the exit camera lands, swallow `wheel` for 700 ms.

---

## 11. Reference screenshots

All under `C:/Users/krisg/AppData/Local/Temp/claude/C--/decae922-eee1-4676-b27b-70265c1bf4af/scratchpad/ref/room-scene/`.

| file | shows |
|---|---|
| `desktop-00-landing.png` | landing page with the still (1440x900) before entry |
| `desktop-01-entry-00.png` to `-13.png` | entry camera move, about 180 ms apart (frame 00 = room exactly over the still, header fading) |
| `desktop-02-room-settled.png` | settled Step-in framing, lit, HUD and hint markers |
| `desktop-03-exit-00.png` to `-11.png`, `desktop-04-after-exit.png` | exit camera move back onto the still, then the classic page |
| `desktop-intro-00.png` to `-35.png` | first-visit intro: terminal fade, flicker-in at the still position, rack and tags lighting, room and desk lighting, hand-off to the page |
| `desktop-reduced-motion-room.png` | reduced motion: instant Step-in framing, no animation |
| `detail-full-fit.png` | whole room at Fit framing (viewBox `322 309 1025 896`) |
| `detail-rack.png` | rack, spotlight beam, perforated top, side panel, LEDs, patch cords, cabinet label |
| `detail-desk.png`, `detail-crt.png` | CRT screen content, scanlines, bar graph, keyboard, badge, small cube, rubber band ball |
| `detail-camera.png` | camera construction (hotspot hover outline and tooltip visible) |
| `detail-record.png` | turntable, vinyl, tonearm, record spines, LED (hotspot hover outline visible) |
| `detail-floor.png` | rug borders and fringe, plank pattern, chair base |
| `detail-cables.png` | WAN cable from the wall outlet, packet halos, red blocked packet with burst ring |
| `detail-lamp.png` | lamp shade glow and pole occlusion |
| `detail-window.png` | window: sky gradient, stars, moon glow, skyline with lit and pulsing windows, mullions, sill |
| `detail-wallA.png` | wall A overview: print with picture light, lamp, desk group, window, network map |
| `detail-wallB.png`, `detail-wallB-certs.png` | wall B: poster, spotlight, certificates with picture lights, LED wash strip |
| `detail-map.png`, `detail-print.png` | network map board; framed print with mat |
| `detail-ball.png` | rubber band ball construction and shading |
| `detail-chair.png`, `detail-plant.png` | office chair from behind; potted plant leaves |
| `ambient-rack-00.png` to `-09.png` | rack LEDs over 2 s (200 ms apart) |
| `ambient-cables-00.png` to `-11.png` | packets moving along the cables (250 ms apart) |
| `mobile-00-landing.png`, `mobile-01-entry-00.png` to `-13.png`, `mobile-02-room-settled.png`, `mobile-03-exit-*.png`, `mobile-04-after-exit.png` | same flow at 390x844 with touch emulation |
| `desktop-dom-dump.json`, `mobile-dom-dump.json` | live DOM facts: SVG classes, viewBoxes, group opacities, defs list, hotspot list |
| `desktop-entry-camlog.json`, `desktop-exit-camlog.json`, `mobile-*-camlog.json` | per-frame viewBox during entry and exit |
| `desktop-intro-log.json` | per-frame opacities and wrapper transform during the intro power-up |

Probe scripts: `scratchpad/tools/room-probe.mjs` (entry, DOM dump, detail and ambient shots, exit), `room-detail2.mjs` (corrected wall, window and object close-ups), `room-intro-probe.mjs` (intro timeline log), `room-geom.mjs` (projection math and the coordinate tables in this spec).

---

## 12. Open questions and uncertainties

- The landing still bitmap is assumed to be a straight render of the lit SVG at about 1.8555 px per unit with a 10 px margin (the margin constants and aspect match to 0.02%); whether it was retouched could not be verified without copying it.
- The CRT `lab-caret` tspan has no CSS rule, so it does not blink on the live site. Treat as a likely oversight; matching the site means a static caret.
- The halo ellipse and the top fade div are rendered but hidden by CSS; they may be leftovers.
- Pointer parallax on the scene wrapper exists but only applies in the settled, unzoomed state, which normal step-inside use does not reach (the Step-in framing counts as zoomed). It is mostly visible after logging out from the terminal.
- Detail screenshots were produced by overriding the live `viewBox`; some include a hotspot hover outline or tooltip because the cursor happened to sit over a hotspot. The coordinates in section 9.1 come from the projection math and are authoritative.
- Exact packet start offsets and repeat delays are random per page load (ranges given). The blocked-packet counter starts at 0 every load.
- Hotspot behavior, focus panels (including the 3D rack inspector with its own `lab-perf-3d` pattern), the terminal and the night-sky backdrop are specified elsewhere; only their contact points with the scene are described here.
