# Build notes

An original Next.js 16 (App Router, Turbopack, Tailwind v4) recreation of a single-page portfolio that sits on a dark grid with mint glyph rain in the gutters: a first-visit terminal intro, an explorable isometric room ("the lab"), and a classic scrolling page whose sections are switched on and off in `SECTION_DEFS` (five of six enabled: Projects, Homelab, Experience, About, Contact). The site is personalized for Kris Green: personal content comes only from his resume and hardware notes, and every draft or placeholder he still has to confirm is listed in `docs/PERSONALIZATION-TODO.md`. All art is original. The reverse-engineering specs in `docs/reverse-engineering/` (01 to 09) are the authoritative reference for layout, timing and behavior. The live theme is B, Mint Terminal (`docs/theme/b.md`, with the colour rule in `docs/OWNER-NOTES.md`); the specs for directions A and C stay in `docs/theme/` for reference, and the preview routes were removed after the rollout.

## Architecture

### Two views on one page

`<html data-view>` holds the current view:

* `classic`: the scrolling page (landing hero, the enabled sections, rain divider, footer).
* `room`: the full-screen lab (`section#hero`), also used by the first-visit intro.

Switching is pure CSS (`src/styles/base.css`):

```css
html[data-view="classic"] #hero,
html[data-view="room"] #hero ~ *,
html[data-view="room"] [data-classic] { display: none; }
```

So `page.tsx` order is load-bearing: the room sky comes before `#hero`, every classic element comes after it, and the footer lives outside `<main>` in a `[data-classic]` wrapper. Both skies stay mounted; only visibility changes.

### First-visit gate

`src/app/layout.tsx` renders an inline script as the first child of `<body>`. On `/` only, unless `localStorage["yg-lab"].active` is true, the URL has a hash, or the visitor prefers reduced motion, it sets `data-view="room"`, `data-lab-intro` and `data-opening` before paint. `<html>` carries `suppressHydrationWarning` because of this. `/dev/*` routes are never gated. Storage keys `yg-lab` and `yg-lab-hints` match the original for behavioral parity.

To test the intro again, clear site data (or run `localStorage.removeItem("yg-lab")`). To skip it, load `/#x`.

### First-visit intro

The intro types a short Debian session that installs the portfolio, then opens the page (the sequence in `docs/OWNER-NOTES.md`):

1. tty header, `homelab login: guest` (55 ms per character), then `Last login: <date> on tty1` (the saved session's time for a visitor who logged out earlier, otherwise now). No service banner.
2. `guest@homelab:~$ sudo apt install kris-portfolio`, then `[sudo] password for guest:` with a 360 ms silent pause, then apt 2.x and dpkg output line by line: the three `Reading ...` stages (each shown without `Done` first), the NEW packages block, `Get:1 http://apt.homelab.lan stable/main all kris-portfolio all 1.0.0 [4,812 kB]`, `Fetched`, `Selecting previously unselected package`, `(Reading database ... 60%` rewritten to the final count, `Preparing to unpack`, `Unpacking`, `Setting up`. apt's bottom progress row (`Progress: [ 20%] [####....]`, the label on the mint accent the way apt draws it black on green) steps 0, 20, 40, 60, 80 % during unpack and setup, sized to the console's character columns, then disappears.
3. `cd /opt/kris-portfolio`; the prompt becomes `guest@homelab:/opt/kris-portfolio$`.
4. `pf-whoami` prints the identity summary (`PfWhoami`): the name in bold title ink, `SITE.role · SITE.location` dim, then five rows with mint dots (study, work, lead, homelab, certs). Every value comes from the content modules (`PF_WHOAMI` in `intro.ts`). Each part of a value is an inline-block, so a row that does not fit breaks after a ` · ` and hangs under its column; below md the long parts switch to short forms (the degree level instead of the full degree, the badge tab names), so every row is one line at 1440 and at most two at 390. Then `launching kris-portfolio ...`.
5. `onBoot`: the engine fades the console (`consoleBoot({ rows: false })`, 0.7 s from +0.1 s, no `powering on` line and no `RACK_BOOT` rows), then the existing frame opening, power-up and camera hand-off. The login screen after a logout and `reboot` still print the banner, `powering on the homelab…` and the boot rows.

Code: `terminal/session.tsx` builds the script as beats (`firstVisitSession(user, lastLogin)`); each beat's actions (input text, cursor line, printed lines, user, cwd, progress, boot) run in one timer callback so React renders them together. Keystrokes are 45 to 63 ms from a seeded generator (`keyDelays`, mulberry32), think time 220 ms, Enter 110 ms, so the run is identical on every visit and nothing random reaches render. `terminal/apt.tsx` holds the apt and dpkg text (`APT_INSTALL`, `AptProgress`) and the shell replies. `Terminal` keeps two autoplay-only states: `live` (the cursor line shows program text, or just the caret while a program runs, instead of the prompt) and the progress row; both render only while `autoplay` is set, and the effect cleanup clears every pending beat and resets them, so a skip at any point leaves a clean prompt. Package numbers live in `PORTFOLIO_PACKAGE` (`intro.ts`).

Below md the session outgrows the screen and scrolls; the scroller masks its top 40 to 64 px (`INTRO_TOP_FADE`) so lines that scroll up fade out under "skip intro →" instead of running into it.

Skip: everything up to the hand-off runs in phase `intro`, so "skip intro →" during typing, sudo, apt output, cd or pf-whoami takes the instant path (0.3 s console fade, then the landing). During the console fade and the power-up (phase `booting`) it completes the timelines and runs the camera hand-off, as before.

Shell additions (`commands.tsx`): `pf-whoami` (in help, no launch line); `sudo apt install kris-portfolio` (the three `Reading` lines, `kris-portfolio is already the newest version (1.0.0).`, `0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`); `sudo apt install <other>` (`E: Unable to locate package`); `sudo apt update` and `upgrade`; `apt` or `apt-get` without sudo (the dpkg frontend lock error, or the lists lock for `update`, in alert red); any other `sudo` command gets sudo's refusal for a restricted account (`Sorry, user guest is not allowed to execute '/usr/bin/ls' as root on homelab.`), which replaced the "not in the sudoers file" line now that the intro shows guest using sudo. `cd` resolves `~`, absolute and relative paths with `.` and `..` over a small model (`/`, `/home`, `/home/<user>`, `/opt`, `/opt/kris-portfolio`); anything else prints `-bash: cd: <dir>: No such file or directory`. `pwd` prints the working directory. Tab completion knows `pf-whoami`, `apt`, `cd` and `sudo`, and completes arguments: the package after `apt install`, `install`/`update`/`upgrade` after `apt`, `apt` after `sudo`, `/opt/kris-portfolio` and `~` after `cd`, the two files after `cat` and the sections after `open`. After a first visit the shell keeps the whole session in its scrollback and the `/opt/kris-portfolio` prompt.

Note: the transcript follows the apt 2.x wording (Debian 12) as specified, while the tty header says Debian 13, whose apt 3.0 prints a different summary layout.

### Rendering split

* Server components: page composition, sections (unless a builder needs client state), skies (except the `RainField` canvas), rain divider, footer, room art (`RoomBase`, `RoomLights`).
* Client components: `Header`, `SkyMotion`, `BlurFade`, `MagicCard`, `HeroRoom`, `LabHero` and everything inside the room UI (panels, `RackInspector`), `Homelab` (its CTA needs a click handler; still fully server rendered), the terminal.
* The room art is rendered on the server in `page.tsx` and passed into `LabHero` as `base` and `lights` props, so thousands of SVG nodes ship once as HTML and never re-render when the engine's state changes.

### CSS layering

`src/app/globals.css` imports Tailwind, then one stylesheet per area. Rules that are not wrapped in `@layer` are unlayered and therefore beat Tailwind utilities. That is intentional and reproduces the original cascade:

* `.display { line-height: .9 }` overrides `leading-[0.95]` on card titles.
* `header { transition: opacity .6s }` kills the header's `transition-all`, so the background swap is instant and only the hide fade animates.
* The `.key` system sits in `@layer components`, so any utility on a key (for example `pr-7`, `text-[12px]`) wins over it.

Import order: `base.css`, `keys.css`, `sky.css`, `chrome.css`, `hero.css`, `lab-art.css`, `lab.css`, `terminal.css`, `panels.css`, `homelab.css`, `work.css`, `about.css`. Later files win ties among unlayered rules. The `@theme inline` block lives in `base.css` and is processed by `@tailwindcss/postcss` through the import (verified: `text-sec` resolves to the section accent).

### Parallax and sky motion

`SkyMotion` (client, renders nothing) writes `--px`, `--py` (eased pointer, 160 ms time constant) and `--sy` (scroll) to every `[data-sky-vars]` element. Layers use `.par`, `.par-wrap` (scroll wraps with `mod()`, with an `@supports` fallback) or `.par-x`, driven by per-layer `--d` (pointer depth) and `--s` (scroll rate). Elements carrying `data-sky-vars` must not get a React `style` prop. Under reduced motion SkyMotion does nothing and `.par*` translate is `none`.

The Mint Terminal sky: the rain canvas (`RainField` in `.sky-rain`) is a `.par` layer with `--d 6` and `--s 0` (pointer parallax only, the far plane); the two packets are `.par` with `--d 30` and `22`; the divider bands are `.par-x` with `--d 7` (far) and `17` (near). `SkyGrid` is page tall and scrolls natively, with no parallax. `RainField` takes `mode="room"` in `RoomSky` (full width, dimmed inside an ellipse around the room) and the classic gutter profile otherwise; under reduced motion it paints one seeded static field.

### Background components (Mint Terminal)

The night sky is gone; the background is the theme B grid and rain (`docs/theme/b.md` section 4).

| Component | Role |
|---|---|
| `src/components/sky/SkyGrid.tsx` | Page-tall 1 px grid (64 px cells, mint intersection dots) with eight pinging gutter nodes on the `sky-twinkle` keyframes. Rendered by `ClassicShell`, scrolls natively, fades out above the divider. Server component. |
| `src/components/sky/RainField.tsx` | One canvas of glyph rain. `mode="page"` keeps the rain in the side gutters (the 72rem content column is quiet); `mode="room"` rains full width, dimmed in an ellipse around the room. Burst drops every 12 to 22 s. The loop stops while the tab is hidden, while the canvas is off screen, and (room mode) whenever the view is not `room`. Reduced motion paints one seeded static field. The only client component in the background. |
| `src/components/sky/rain.ts` | Rain parameters (`RAIN`: speeds, trails, bursts, the frame cap, the desktop and mobile profiles), the glyph set and JS copies of the two palette colours the canvas needs (`RAIN_COLOR`). Keep `RAIN_COLOR` in sync with `--mint` and `--mint-head` in `base.css`. |
| `src/components/sky/SkyPackets.tsx` | Two drifting packets (3 px head, 56 px tail) on horizontal runs (`sky-run-east`, `sky-run-west`), `.par` layers with `.sky-moving` so reduced motion hides them. |
| `src/components/sky/ClassicSky.tsx` | The sticky `h-lvh` layer inside `ClassicShell`: rain (`.par`, `--d 6`, `--s 0`), packets and the top wash. |
| `src/components/sky/RoomSky.tsx` | The fixed room view background: the same rain in room mode, packets and wash; visible only under `html[data-view="room"]`. |
| `src/components/chrome/RainDivider.tsx` | Replaces the skyline above the footer: two `.par-x` bands of static, seeded glyph rows (three text nodes per row), a 1 px mint floor line and a blinking block cursor. Server component. |

Removed with the rollout: `SkyLayers.tsx`, `sky-data.ts` and `Skyline.tsx`, which drew the three tiled star fields, the milky way band, the twelve twinkles, two constellations, the moon, two satellites, two shooting stars and the city skyline, along with the `sky-drift-east`, `sky-drift-west` and `sky-shoot` keyframes. Twinkles became grid pings, satellites became packets, shooting stars became burst drops, and the skyline became the rain divider. The room's window (`objects/WindowView.tsx`) is room art and keeps its own night view; it was not part of the page sky.

Removed theme previews: `src/components/theme-preview/` (directions A, B and C) and the routes `/dev/theme-a`, `/dev/theme-b`, `/dev/theme-c` and `/dev/theme-c/stage`. The live code took over the B preview's rain, divider and tokens; `docs/theme/b.md` notes the mapping.

## File map and ownership

| Owner | Files |
|---|---|
| Foundation (read-only after handoff) | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx`, `src/app/favicon.ico` (generated by `scripts/assets/favicon.mjs`), `src/app/dev/layout.tsx`, `src/app/dev/page.tsx`, `next.config.ts`, `package.json`, `src/styles/base.css`, `src/lib/cn.ts`, `src/lib/rng.ts`, `src/lib/iso.ts`, `src/lib/og-card.tsx`, `src/components/ui/*` (BlurFade, SectionHeading, MagicCard, Led, BrandGlyphs), `src/components/sky/SkyMotion.tsx`, `src/content/types.ts`, `src/content/index.ts`, `src/content/site.ts`, `src/components/lab/contracts.ts`, `scripts/lib/render.mjs` |
| B1 chrome | `src/styles/keys.css`, `src/styles/sky.css`, `src/styles/chrome.css`, `src/components/sky/**` except SkyMotion, `src/components/chrome/**` (Header, MobileMenu, Footer, RainDivider, ClassicShell), `src/app/dev/chrome/**`; the sky is `RainField`, `rain.ts`, `SkyGrid`, `SkyPackets`, `ClassicSky` and `RoomSky` |
| B2 hero | `src/components/hero/**`, `src/content/hero.ts`, `src/styles/hero.css`, `src/app/dev/hero/**` |
| B3 room art | `src/components/lab/art/**`, `src/styles/lab-art.css`, `scripts/assets/room-still.mjs`, `public/room/**`, `src/app/dev/room-art/**`, `src/app/dev/room-still/**` |
| B4 room engine | `src/lib/view-store.ts`, `src/lib/lab-session.ts`, `src/lib/camera.ts`, `src/components/lab/*.ts(x)` except contracts, RackInspector and Box3D, `src/styles/lab.css`, `src/app/dev/room/**` |
| B5 terminal | `src/components/lab/terminal/**`, `src/content/intro.ts`, `src/styles/terminal.css`, `src/app/dev/terminal/**` |
| B6 room panels | `src/components/lab/panels/**`, `src/content/room.ts`, `src/styles/panels.css`, `public/lab/**`, `public/certs/**`, `public/resume.pdf`, `scripts/assets/panels.mjs`, `src/app/dev/panels/**` |
| B7 homelab | `src/lib/rack.tsx`, `src/components/sections/Homelab.tsx`, `src/components/lab/RackInspector.tsx`, `src/components/lab/Box3D.tsx`, `src/content/homelab.ts`, `src/styles/homelab.css`, `src/app/dev/homelab/**` |
| B8 work | `src/components/sections/{Projects,Websites,Experience}.tsx`, `src/content/{projects,websites,experience}.ts`, `src/styles/work.css`, `public/previews/**`, `public/sites/**`, `scripts/assets/work.mjs`, `src/app/dev/work/**` |
| B9 about | `src/components/sections/{About,Contact}.tsx`, `src/content/{about,contact}.ts`, `src/styles/about.css`, `public/about/**`, `scripts/assets/about.mjs`, `src/app/dev/about/**` |

Owner facts and decisions supplied after the resume (rack order, what runs where, sections to keep off) are collected in `docs/OWNER-NOTES.md`.

## Page composition

```tsx
<Header />                                   // B1, client, fixed
<main>
  <SkyMotion />                              // F, renders null
  <RoomSky />                                // B1, fixed, visible only in room view
  <LabHero base={<RoomBase />} lights={<RoomLights />} />   // B4 + B3, section#hero
  <ClassicShell>                             // B1: flat base wrapper, SkyGrid, sticky ClassicSky, children, RainDivider
    <LandingHero />                          // B2
    {SECTION_ORDER.map(id => <Section />)}   // SECTION_COMPONENTS[id], enabled sections only
  </ClassicShell>
</main>
<Footer />                                   // B1, div[data-classic] > footer
```

`SECTION_COMPONENTS` in `page.tsx` maps every `SectionId` (projects, homelab, websites, experience, about, contact) to its component; `SECTION_ORDER` comes from `SECTION_DEFS` in `src/content/site.ts`. Switching a section off there removes it from the page, the header nav, the footer, the terminal (`open`, `nmap`), the room CRT and `ROOM_PICK`, and renumbers the remaining headings ("01." onward; the first enabled section drops its top border). Websites is off today; its content and component stay ready.

## Shared primitives

* `cn(...)` (`src/lib/cn.ts`): clsx plus tailwind-merge.
* `mulberry32(seed)`, `rng`, `between`, `intBetween`, `pick`, `seededPairs` (`src/lib/rng.ts`). Use seeded randomness for anything rendered on the server; never `Math.random()` in markup.
* `src/lib/iso.ts`: `iso(x, y, z) = [800 + (x - y) * 1.14315, 40 + (x + y) * 0.66 - z * 1.32]`, `K`, `A`, `B`, `r2`, `pts`, `pathD`, `screenLength`, `faceTop`/`faceLeft`/`faceRight` (SVG `matrix()` strings) and their numeric `*M` variants, `onTop`/`onLeft`/`onRight` local to world mappers, `faceRect`, `boxHull`, `floorEllipse`, `screenBounds`, `parsePoints`, `pointsBounds`.
* `BlurFade` (`delay` prop): opacity 0 to 1 and y 14px to 0, 0.5 s easeOut, once at 15% visibility, duration 0 under reduced motion.
* `SectionHeading` (`index`, `kicker`, `title`, optional `lede` as ReactNode): eyebrow plus `h2.display.sec-title` inside a BlurFade with `mb-12 md:mb-16`. Render inside a section with `data-sec`.
* `MagicCard` (`className`): 350 px spotlight of `--sec` at 8% over `var(--card-glass)` with an 8 px backdrop blur, `border-line-strong`, `border-sec/40` on hover. Pass `!p-0` to drop its built-in padding.
* `.glass-card` (`src/styles/work.css`, `@layer components`): the same glass surface for section cards that are not MagicCards (Websites site cards, the About education list, the Contact cards). The Experience ticket carries its own glass surface and mint notch rims in `work.css`.
* `Led` (`cx`, `cy`, `color`, `r`, `glow`, `halo: "gradient" | "flat"`, `blink`, `r2`) and `ledTiming(kind, pair)`: halo plus core in one blinking `<g>`; seeded duration and negative delay with 2-decimal strings so SSR and CSR match.
* `SkyMotion`: see Parallax above.
* `BrandGlyphs` (`src/components/ui/BrandGlyphs.tsx`): the one shared set of profile glyphs (`CodeGlyph`, `ProfileGlyph`, `ResumeGlyph`, `MailGlyph`, and `CONTACT_GLYPH` keyed by `ContactKey`: github, linkedin, resume, email), used by the Contact cards and the footer Connect list. 24-unit box, `fill=currentColor`, `aria-hidden`. They fill the original's brand-icon slots at the same size and weight but are original generic symbols (a branch disk, a head-and-shoulders card, a folded sheet) plus lucide's `Mail` envelope; never swap in paths from a brand icon set. `CodeGlyph` uses `useId` so each instance's mask id is unique (works in server and client components).

Global classes from `base.css`: `.display`, `.sec-title`, `.name-block`, `.name-line` (+ `name-in`), `.lab-mono`, `.dot-grid`, `.no-scrollbar`, `.par`, `.par-wrap`, `.par-x`, `.lab-led-act`, `.lab-led-disk`, `.lab-led-pulse`, `.lab-spin`, `.lab-disc-spin`, keyframes `lab-act`, `lab-disk`, `lab-pulse`, `lab-fade-in`, `lab-caret`, `lab-spin`, the view switching, scroll lock and header hide rules. `keys.css`: `.key`, `.key-light`, `.key-sm`, `.key-xs`, `.key-icon`, `.key-legend`.

Theme colors (Mint Terminal, `docs/theme/b.md`): `background`, `foreground`, `mint`, `mint-hi`, `mint-head`, `line`, `line-strong`, `card` (plus the `--card-glass` variable), `raised`, `title`, `gray-1` to `gray-4`, `warn`, `alert`, `footer`, `console`. `putty`, `sec` (`var(--sec, #3dfc9a)`) and the four accents `signal`, `dusk`, `beacon`, `sodium` all resolve to mint; the tokens stay so a later variant can split them again. Body text never goes below `gray-2` (6.5:1 on the base); `gray-3` (3.1:1) is for decoration and disabled states. Room art, rack hardware and LEDs, devicons and images keep their own colours (`docs/OWNER-NOTES.md`). Fonts: `font-sans` is Geist, `font-mono` is Geist Mono, Archivo (`--font-archivo`, with the `wdth` axis) is used through `.display`.

## Contracts

### View store (`src/lib/view-store.ts`)

* `currentView()`, `setView(v)`, `subscribeView(cb)`, `useView()` (server snapshot `null`).
* Events on `window`: `VIEW_EVENT` `"yg:view"` (plain Event after every switch), `HOME_EVENT` `"yg:home"`, `PICK_EVENT` `"yg:pick"` (`CustomEvent<HotspotId>`). Helpers `pickInRoom(id)`, `goHome()`.
* Door handshake: `enterRoom(box, rest, depth)`, `takeEntry()` (only valid during the synchronous view dispatch), `setDoor(fn | null)`, `findWayOut()`, `wayOut()`.
* Convenience: `goToSection(id)` ("classic view ↓"), `seeItInTheRoom()` (homelab CTA), `blockWheel(ms)`.

### Lab session (`src/lib/lab-session.ts`)

`readSession()` (accepts the legacy plain-string user), `writeSession()`, `startSession(user)`, `endSession()`, `savedUser()`, `readHintsSeen()`, `writeHintsSeen()`. All storage access is wrapped in try/catch.

### Room (`src/components/lab/contracts.ts`)

* Geometry: `ROOM_SHELL`, `ROOM` (projected bbox `381.61, 368.68, 905.38 x 776.16`), `INITIAL_VIEWBOX` `"322 309 1025 896"`, `STEP_IN_TARGET`, `CAMERA` (margins, thresholds, durations), `STILL` (1700 x 1460, 10 px margin, insets 1/170 and 1/146, depth 18, render viewBox `376.22 363.29 916.16 786.94`), `insetStill(rect)`.
* Ids: `HotspotId` (23) = `PanelId` (12: monitor, resume, badge, phone, record, print, map, poster, cert-1 to cert-4) plus `RackPartId` (11: rack, switch-5, switch-8, pve1, pve2, pve3, pve4, pi, zima, nas, pdu, in rack order; also the inspector tab order). `RackDeviceId` is every rack part except `rack`. `BootPartId` (switch-8, pve1, pi, pdu) names the four devices that get a callout tag during the power-up; every device lights up. `BootRow { host, msg }` and `BootStage { parts, rows }` type the power-up script (`RACK_BOOT` in `src/content/homelab.ts`). `MARKED` (8 marker ids in order: monitor, resume, badge, record, rack, map, cert-3, print). `ROOM_PICK` (section to hotspot) is derived from `ENABLED_SECTIONS`, so disabled sections have no entry. Certificate ids are slot based so content swaps never touch ids; `zima` is the shelf holding both ZimaBoards.
* `Hotspot { id, title, tip | null, points, face?, marker? }`, `Face3`, `PartBox`. Data comes from `src/components/lab/art/hotspots.ts` (`HOTSPOTS`, `HOTSPOT`, `RACK_PART_BOXES`).
* Art vocabulary `ART_ATTR`: `data-base`, `data-pool`, `data-lights`, `data-part`, `data-unit`, `data-cable`, `data-tag`, `data-pkt`, `data-blocked-pkt`, `data-fw-alert`, `data-fw-burst`, `data-blocked-count`, `data-bar`, `data-screen`, `data-vinyl`, `data-cam` (the SVG roots the view camera moves, not a room object); plus `BaseGroup`, `PoolGroup`, `CableId`, `CABLE_PATH_ID`, `POWER_GROUPS`, `ART_IDS`, `sel()`, `LED`, `BLINK_RANGE`.
* `RoomArtProps { lit? }` for `RoomBase` and `RoomLights` (server-compatible, deterministic). `AmbientControls { start, pause, kill }` returned by `useAmbient(scopeRef)`.
* Terminal: `TerminalMode`, `LabPhase`, `TerminalHandle { print, clear, focus, login, reset }`, `TerminalProps { mode, autoplay, onBoot, onExit, onClose, onCommand, ref }`, line templates `TerminalLineProps` exported by `terminal/lines.tsx`.
* Panels: `PanelProps { id, onClose, onNavigate?, onStopMusic? }`, `PanelRegistry` exported as `PANELS` from `lab/panels/index.ts`. DOM contract: `[data-focus-layer]` > `[data-lift]` (GSAP writes the lift matrix) + `[data-chrome]`; the record disc carries `[data-spin]`.
* Rack inspector: `RackInspectorProps { initial, poseOf, onClose, onGo, ref }`, `RackInspectorHandle { enter, leave }`, `ScenePose { x, y, px }`, stage element `[data-stage]`.
* Engine: `LabHeroProps { base, lights }`, `LabApi` (enter, home, openFocus, closeFocus, openTerm, closeTerm, zoomBy, zoomAt, resetView, stepIn, nudge, showTip, hotspotPx, poseOf, sleep, consoleBoot, powerUp, powerDown, hideConsole, showLogin, frameOpening, toPage, lightUp, skipBoot), `LAB_DOM` and `HTML_FLAGS` name lists.

## Content plan

`src/content/types.ts` defines every shape (section 8 of each spec). `src/content/index.ts` re-exports everything, so import from `@/content`.

| File | Exports | Notes |
|---|---|---|
| `site.ts` | `SITE`, `SECTION_DEFS`, `ENABLED_SECTIONS`, `SECTION_ORDER`, `isSectionEnabled()`, `sectionIndex()`, `NAV`, `CHROME`, `SECTIONS`, `FOOTER` | identity; `SECTION_DEFS` is the section switchboard (enabled, label, room hotspot, accent, kicker, title, container, footer); nav, headings, index numbers and footer links derive from it |
| `hero.ts` | `HERO` | prompt, two name lines with per-line `fontStretch`, roles, CTAs, door still |
| `intro.ts` | `INTRO`, `PORTFOLIO_PACKAGE`, `TERMINAL_COMMANDS`, `NMAP_PORTS`, `SHELL`, `SHELL_EXTRA`, `PF_WHOAMI` | `PORTFOLIO_PACKAGE` is the package the first-visit session installs (name from `SITE.name`, repo `http://apt.<SITE.host>.lan`, version, sizes, dpkg file count, `/opt` directory, the `pf-whoami` command); `PF_WHOAMI` is the pf-whoami summary derived from `SITE`, `ABOUT.education`, `EXPERIENCE`, `HOMELAB` and `CREDENTIALS`; the login banner (shown only on the login screen after a logout) has 7 rows, one per `HOMELAB_HOSTS` row with a banner text (the idle pve4 is left out); `services` and the neofetch Services row read `HOMELAB_HOSTS`; boot rows come from `RACK_BOOT`; education from `ABOUT.education`; `nmap` rows are computed from the enabled sections (plus one filtered telnet row) |
| `projects.ts` | `PROJECTS` (4), `DEVICON` | from the resume; the homelab card has `preview: null` and a `placeholderFile`; `link: ""` hides the link icon |
| `homelab.ts` | `HOMELAB`, `HOMELAB_HOSTS`, `CLUSTER_HOSTS`, `hostsOn()`, `serviceSummary()`, `CLUSTER_SERVICE_COUNT`, `RACK_BOOT`, `HOMELAB_TBD` | `HOMELAB_HOSTS` holds 8 rows (pve1 to pve4, plus the Pi, edge, storage and honeypot) with each one's rack part, tag, note, services and banner text, taken from `docs/OWNER-NOTES.md`; `CLUSTER_HOSTS` is the four nodes, `hostsOn(part)` the rows on one rack part, `serviceSummary()` a short comma list; `HOMELAB.services` is derived from `HOMELAB_HOSTS` (one entry per row). 11 rack parts (the rack and 10 devices, all listed), 6 hardening chips, `stories: []` (blocks hide when empty), 4 rack tags; `RACK_BOOT` is the power-up script (stages of devices plus console rows); `HOMELAB_TBD` records facts not provided yet and is never rendered |
| `websites.ts` | `WEBSITES` (2), `WEBSITES_LEDE` | fictional sample businesses on `.example` domains; the section is disabled |
| `experience.ts` | `EXPERIENCE` (2) | internship and club leadership, with room badge styling |
| `about.ts` | `ABOUT`, `CREDENTIALS` (4), `credentialStatus()`, `credentialDate()` | portrait (placeholder flag), bio, skill groups, `education` and `coursework`; each credential has `status` ("in-progress" or "earned"), `date`, `kind` and a generated card `thumb`; none has a PDF or verify link; all four are drawn on the wall |
| `contact.ts` | `CONTACT`, `CONTACT_LINKS`, `contactLink()`, `contactLinksIn()` | email, LinkedIn, GitHub (placeholder) and a `resume` key; a link with an empty `href` is hidden everywhere (grid, footer, phone panel, terminal); grid and footer orders, phone pitch |
| `room.ts` | `ROOM_CONTENT`, `MAP_EXTRA` | poster, `printArt` plus `print` (art print labels), resume, CRT text (listing from `PROJECTS`), record, music, map board labels and map panel nodes; `MAP_EXTRA` holds the map panel's extra nodes (Pi, NAS, honeypot, Tailscale overlay) |

Asset paths referenced by content (each generated by its owner):

* `/previews/<slug>.png` 1280 x 800 (B8), `/sites/<slug>.webp` 1400 x 875 (B8, used only when Websites is enabled)
* `/about/portrait.webp` (B9, a generated placeholder silhouette)
* `/certs/<id>.webp` (B6): original stylized credential cards rendered from `/dev/panels/cert/<id>`; there are no certificate PDFs
* `/lab/poster.webp`, `/lab/print.webp`, `/lab/resume.webp`, `/resume.pdf` (B6). `/resume.pdf` is the owner's real resume; `/lab/resume.webp` is its page 1 with the phone number cut out
* `/lab/cover.webp` and `/lab/nocturne.mp3` (B6): music card cover and an original 26.7 s synthesized loop
* `/room/room-still.webp` 1700 x 1460 with a 10 px transparent margin (B3). The landing door (`HeroRoom`, `HERO.door.src`) and `/dev/room` reference it directly; there is no placeholder fallback.

## Asset rendering

`scripts/lib/render.mjs` (Node ESM) drives the local Chrome through playwright-core and encodes with sharp:

* `renderSvg(svg, out, { width, height, format, transparent, quality })`
* `renderHtml(html, out, { width, height, selector, transparent, format })`
* `renderUrl(url, out, { width, height, selector, transparent, format, fullPage, waitFor, wait })` (for example a `/dev/*` route on the running dev server, which gets the real fonts)
* `renderPdf(html | null, out, { format: "Letter", url })`
* `closeBrowser()` at the end of every script. `CHROME_PATH` overrides the Chrome location. Format comes from the option or the file extension (png, webp, jpg).

### Regenerating room assets

* `node scripts/assets/panels.mjs [poster|print|cover|resume|certs|audio]` (no argument runs every job; `certs` needs the dev server, `BASE_URL` overrides `http://localhost:3000`):
  * `print`: the current `/lab/print.webp` art print is kept. `FORCE_PRINT=1` replaces it with an original lamplit illustration.
  * `resume`: renders page 1 of the real `public/resume.pdf` with pdfjs-dist on @napi-rs/canvas into `/lab/resume.webp` (1224 x 1584). Any phone number is cut out of the image and its line re-centred; the PDF itself is served unchanged. `RESUME_SRC=<path to a PDF>` first copies a new resume into `public/resume.pdf`.
  * `certs`: one original credential card per `CREDENTIALS` entry (title, issuer, status, date; no logos, seals or signatures, and a footer saying it is not an official document).
* `node scripts/assets/room-still.mjs` (the dev server must serve `/dev/room-still`): rerun after any change to the room art, the rack layout (`RACK_SLOTS`), the wall rasters (print, poster) or the certificate wall. It prints the opaque bounds; they must read x 10..1689, y 10..1449. The dev server's image optimizer caches `/_next/image` variants of the still for up to 4 hours; delete the matching entries under `.next/dev/cache/images` (or restart `next dev`) to see a new still on the landing during development. Production builds are unaffected.
* `node scripts/assets/favicon.mjs` (the dev server must be running, for the site fonts): renders the header's "KG" monogram keycap (mint legend and rim on the charcoal cap) at 16, 32 and 48 px into `src/app/favicon.ico`. It replaced the scaffold favicon.

## Dev routes

`/dev` lists the preview routes. `src/app/dev/layout.tsx` calls `notFound()` in production, so `/dev/*` never ships, and mounts `SkyMotion`. Each builder owns `src/app/dev/<area>/page.tsx`. `/dev/panels/cert/<id>` and `/dev/room-still` are render targets for the asset scripts. `next.config.ts` sets `devIndicators: false` so screenshots stay clean; errors still surface.

## Swapping in your own content

1. Identity: edit `SITE` in `src/content/site.ts` (name, initials, role, description, location, url, domain, email, handle). Metadata, the footer, the terminal prompt and the OG card follow.
2. Sections: flip `enabled` in `SECTION_DEFS` (`src/content/site.ts`) to show or hide a section; nav, footer, terminal, room CRT and heading numbers follow. `footer: false` keeps an enabled section out of the footer's Navigation column.
3. Landing: edit `src/content/hero.ts`. For a different name length, re-tune each line's `fontStretch` so the word fills the name block (spec 03 section 3.4); `/dev/hero` prints the largest value that fits.
4. Section content: edit the matching content file. Counts and approximate lengths are noted in `types.ts` to keep layouts intact. Empty values hide their UI: a contact link with `href: ""`, a project with `link: ""`, an empty `HOMELAB.stories`.
5. Images: replace the files under `public/` at the same paths and sizes, or rerun the owner's generator in `scripts/assets/`.
6. Room: certificates come from `CREDENTIALS` (wall slot per credential), rack hardware from `HOMELAB.parts` and its layout from `RACK_SLOTS` in `src/lib/rack.tsx`, the power-up from `RACK_BOOT`, room-only text from `ROOM_CONTENT`. Hotspot ids only change if the rack's devices change (contracts `RACK_PART_IDS`). Rerun `room-still.mjs` afterwards.
7. Resume: `RESUME_SRC=path/to/resume.pdf node scripts/assets/panels.mjs resume` copies the PDF to `public/resume.pdf` and re-renders `public/lab/resume.webp` (phone number removed from the image only).
8. Open items for the owner: `docs/PERSONALIZATION-TODO.md`.

## Verification

* `npx tsc --noEmit -p .` and `npx eslint .` must stay clean (no warnings either).
* `npm run build` can run while the shared dev server is up: Next 16 dev writes to `.next/dev` and the build to `.next`. Verified: the build succeeds alongside `next dev`, and `/dev/*` routes return 404 from `next start`.
* Capture tool: `scratchpad/tools/snap.mjs` (`--skipIntro`, `--mobile`, `--full`, `--logs`, `--eval`).
* Integration checks in `scratchpad/tools/` (each takes a base URL; the e2e scripts default to `http://localhost:3100` for `next start -p 3100`):
  * `int-e2e3.mjs [base] [a,b,c,d,e,f,g] [shotsDir]`: the current smoke test. Same as `int-e2e2.mjs` below, plus the terminal's `services` (every node, its services and the hardening line), `neofetch` (OS, CPU, Memory and the "n on pve1" Services row) and the in-shell `login` refusal. Updated for the apt intro: scenario a checks the session steps in order (sudo prompt, dpkg setup, cd, launch line), that no banner or boot rows print, that the terminal part ends 6.5 to 7.5 s after hydration and the landing 12.5 to 17 s after it; scenario c skips during login typing, apt output, pf-whoami output, the console fade and the power-up; scenario e adds `pf-whoami`, `sudo apt install kris-portfolio`, `apt install` without sudo and `cd`.
  * `intro-v2.mjs [base] [frames,skip,returning,reduced,shell,firstshell] [outDir]`: the apt intro in detail. Frames every 150 ms of the whole first visit at 1440 x 900 and 390 x 844 (mobile UA, touch) with a contact sheet, a per-step timeline from hydration, skip at four points (apt command typing, apt output, pf-whoami output, power-up) on both sizes, the returning visit, the URL hash, reduced motion, the shell commands and tab completion on both sizes, and the shell after a full first visit.
  * `final-shots.mjs [base] [outDir]`: owner captures of the live theme (landing hero at 1440 x 900 and 390 x 844, full page after a reveal scroll, the homelab section, the room after stepping in, the rack inspector on pve1, the terminal with `neofetch` in the room).
  * `int-e2e2.mjs [base] [a,b,c,d,e,f,g] [shotsDir]`: fresh-context smoke test of the first visit (desktop and 390 x 844), the returning visit, skip during typing, boot and power-up, all 23 hotspots (keyboard, click, tap), each rack part checked by title in the inspector, all 11 inspector tabs, the pve1 "open the homelab map" link (map panel without an empty stories heading), music start and stop, the terminal (backtick, key, help, whoami, projects, ls, nmap of the enabled sections, a bad command, exit and log back in), stepping outside, the enabled sections in order, footer links, the mobile menu and a reduced-motion run. Prints console errors and warnings per scenario. (`int-e2e.mjs` is the earlier version for the 19-hotspot layout with Photography.)
  * `door-check.mjs [base] [outDir] [--mobile]`: on the first room frame after clicking the landing door, the live ROOM rect must land on the drawn room inside the still (within 1.5 px).
  * `review-shots.mjs <site> <dev> <outDir> site`: the earlier owner review captures (hero, full page, homelab, room, inspector). Pass `site` only; its `themes` step targets the removed preview routes.
  * `int-ambient.mjs [base]`: ambient loops on `/` after the intro and after "step inside" (packets, CRT bars, blocked counter, record spin, LEDs) and that they pause after stepping outside.
  * `int-banner.mjs [base]`: intro banner prompt y and per-service line counts. Obsolete since the apt intro: the first visit no longer prints the banner (it waits for "power on the lab", which now only appears on the login screen after a logout).
  * `int-cert.mjs [base]`: certificate panel chrome rows at 390 x 844.
* Intro timing, apt session (production build, `next start`, 2026-10-06; ms after hydration, which was 0.17 to 0.22 s after navigation start):

  | Step | 1440 x 900 | 390 x 844 |
  |---|---|---|
  | login name typing | 0.36 s | 0.36 s |
  | login accepted, Last login | 0.72 s | 0.72 s |
  | `sudo apt install` typing | 0.98 s | 0.99 s |
  | `[sudo] password` | 2.66 s | 2.67 s |
  | apt output starts | 3.03 s | 3.03 s |
  | `Get:1` | 3.55 s | 3.55 s |
  | progress row on / off | 3.84 / 4.58 s | 3.85 / 4.58 s |
  | `Setting up` | 4.41 s | 4.41 s |
  | `cd` typing / prompt path | 4.85 / 6.05 s | 4.86 / 6.06 s |
  | `pf-whoami` typing / summary | 6.33 / 6.91 s | 6.32 / 6.91 s |
  | launch line | 7.09 s | 7.09 s |
  | console fade (phase booting) | 7.29 s | 7.29 s |
  | power-up (console hidden) | 8.15 s | 8.15 s |
  | live | 13.85 s | 13.85 s |
  | landing | 14.34 s | 14.79 s |

  Skip lands 0.37 s after the click from any point of the session (phase intro), 0.5 s during the fade or power-up on desktop (camera hold) and 0.97 s on mobile (camera pan). The earlier banner intro reached booting at 1.73 s and the landing at 10.03 s from navigation.
* Apt intro pass (2026-10-06, production build on `next start -p 3100`): `npx tsc --noEmit` and `npx eslint .` clean; `npm run build` succeeds next to the running dev server; `intro-v2.mjs` passes 77 checks and `int-e2e3.mjs` all 193 checks across 20 scenarios (fresh contexts) at 1440 x 900 and 390 x 844, both with zero console errors or warnings (no hydration warnings). Frames, contact sheets and logs are in `scratchpad/intro-v2/`.
* Last full pass before the apt intro (2026-10-06, theme B rollout, production build on `next start -p 3100`): `npx tsc --noEmit` and `npx eslint .` clean with no warnings; `npm run build` succeeds (static `/`, `/opengraph-image`, `/twitter-image`; every `/dev/*` route returns 404); `int-e2e3.mjs` passes all 175 checks across 16 fresh contexts at 1440 x 900 and 390 x 844 with zero console errors or warnings; the door hand-off is aligned within 0.24 px on both sizes; `room-still.mjs` reproduces the committed still byte for byte. The unused create-next-app files in `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) were removed.

## Integration notes

* Engine and art wiring (spec 04 and 05 contract): `lightUp` resets `drawSVG "0% 100%"` on `[data-cable] path`; the record phase sync reads `[data-vinyl] .lab-spin`; packets carry `data-pkt-cable` and `data-pkt-dir`; markers come from `HOTSPOT[id].marker` (`MARKERS` in hotspots.ts). `useAmbient(sectionRef).start()` runs in `lightUp`, at the end of `powerUp` and on re-entry; `pause()` in `sleep()`; `kill()` in `powerDown`.
* Room rack: the owner's floor-standing 12U 10-inch rack on four feet, with the devices also seen through the tinted side panel (`RackSideDevices`). `objects/Rack.tsx` renders the shared `RackFront` from `@/lib/rack` inside the `faceLeft` transform, and the lit layer uses the shared `DeviceLeds` (seeded `SEEDS.rack`), so the scene, the homelab diagram and the inspector models share one face drawing. Everything follows `RACK_SLOTS` (top to bottom: 5-port switch, 8-port switch, pve1 to pve4, a 1U shelf with the Pi and both ZimaBoards, a 4U NAS, and the PDU on the front at U1): reorder or resize a slot and the hotspots, poses, callout tags and inspector follow. The drawn wordmark is generic ("10in", "12U"); host names on the faces are label-maker stickers.
* Power-up: `useLabTimelines` plays `RACK_BOOT` stage by stage (each stage's devices flicker on together and its rows print to the console as `[  OK  ] host  msg` when the console is still up, which is the login screen and reboot path; the first visit fades the console without them); `/dev/terminal` previews the same rows. The four callout tags (`HOMELAB.rackTags`, keyed by `BootPartId`) show only during the power-up.
* Rack inspector: 11 tabs in `RACK_PART_IDS` order. The rack tab lists every device top to bottom with its U position; every other part lists its own services (`hostsOn(part)`), and pve1 to pve4 add an "open the homelab map →" link that opens the map panel.
* Content parity: the login banner (now only on the login screen after a logout; the first visit prints the apt session instead) has one row per `HOMELAB_HOSTS` row with a banner text (7 rows, like the original). The homelab section shows each row's name, tag, note and services, not the banner text. The "Broke it, fixed it" block in the section and "Things I've debugged" in the map panel render only when `HOMELAB.stories` has entries. The first credential (no verify or PDF keys) keeps its `note` at 30 characters or fewer so its panel chrome is one row at 390.
* Music: the card (and its hidden `<audio autoPlay loop>`) mounts only after the visitor picks the record (click, tap or Enter), so playback always follows a gesture and nothing plays on load. The card's stop key, the record panel's "stop the music" and logout unmount it, which stops playback. The card is portalled to `<body>`, so music keeps playing on the page until stopped, like the original.
* Terminal quirk kept for parity (spec 01 section 5.4): with the shell input focused a backtick is typed into the line instead of closing the shell; backtick closes it when focus is outside the input, and Esc always does.

## Known deliberate differences

* The legacy pre-paint `yg-boot` script and its `noscript` style are not reproduced; they had no visible effect.
* The original's night sky (star fields, moon, satellites, shooting stars, skyline) is replaced by the Mint Terminal grid, glyph rain, packets and rain divider. Layer slots, parallax depths and reduced-motion behaviour follow the same system. The room scene keeps its original palette under the colour rule.
* The OG and Twitter images are a generated title card (name over the mint grid) instead of the room illustration.
* Rack hardware is the owner's real gear (Tecmojo rack, NETGEAR switches, HP ProDesk and GMKtec nodes, Raspberry Pi 4, ZimaBoards, UGREEN NAS). Brand and model names appear only as plain text (inspector, section list, aria labels); the drawn faces carry no logos or maker names.
* Employer, school and credential names are the owner's real ones, as text. Credential cards are original designs, not copies of official certificates.
* There is no Photography section (the original had one); the wall print is an original art print and its panel shows that one image.
* Profile glyphs (Contact, footer) are original generic symbols in the slots where the original shows brand icons.
* The Websites section exists but is switched off, so section numbering runs 01 to 05.
* The first-visit intro is an apt install session (login, `sudo apt install kris-portfolio`, `cd`, `pf-whoami`) instead of the original's service banner, `boot` and boot log, so the terminal part runs about 7.3 s and the landing appears about 14.3 s (desktop) after hydration instead of 9.5 s. The console fade, power-up and hand-off are unchanged.
* In the shell, `sudo` answers like a restricted sudoers entry (apt only) instead of "not in the sudoers file", since the intro shows the guest account using sudo.
