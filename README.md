# Homelab portfolio

Kris Green's personal portfolio: a single page on a dark terminal grid with mint glyph rain in the gutters. First-time visitors land in a terminal that logs in, runs `sudo apt install kris-portfolio`, changes into `/opt/kris-portfolio` and prints a short `pf-whoami` summary before the lab powers up; after that the page opens on a landing hero with a door into "the lab", an explorable isometric room with a server rack, a desk, a CRT, certificates on the wall and a working shell. Below the landing, a classic scrolling page covers projects, the homelab, experience, about and contact.

The layout, motion and interaction system is an original recreation of an existing portfolio design, documented in `docs/reverse-engineering/`. All art, illustrations, music and copy in this repository are original; personal content comes from the owner's resume and hardware notes.

## Stack

* Next.js 16.2 (App Router, Turbopack) and React 19
* Tailwind CSS v4 (`@tailwindcss/postcss`)
* GSAP 3.15 with `@gsap/react` for the room, intro and rack timelines; `motion` for reveal fades
* lucide-react for a few UI icons
* TypeScript, ESLint (`eslint-config-next`)
* Asset scripts (dev only): playwright-core driving a local Chrome, sharp, pdfjs-dist and @napi-rs/canvas

This is Next.js 16: APIs and conventions differ from older versions. Read `AGENTS.md` and the guides in `node_modules/next/dist/docs/` before changing framework code.

## Getting started

Requirements: Node.js 20.9 or newer. The asset scripts also need Google Chrome (set `CHROME_PATH` if it is not at `C:/Program Files/Google/Chrome/Application/chrome.exe`) and, for the music loop only, ffmpeg.

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run lint         # eslint
npx tsc --noEmit -p .
```

The first visit to `/` plays the terminal intro (about 7 s of terminal session, then the room power-up and the hand-off to the landing page; "skip intro →" works at any point). To see it again, clear the site data for localhost (or run `localStorage.removeItem("yg-lab")` in the console). To skip it, open `/#x`. Visitors who prefer reduced motion never get the intro.

## Project structure

```
src/
  app/                 routes: page.tsx (the whole site), layout.tsx, OG and Twitter images, dev/ previews
  content/             every piece of text and data on the site (start here to edit content)
  components/
    chrome/            header, mobile menu, footer, rain divider, classic wrapper
    hero/              landing hero and the room door
    sections/          Projects, Homelab, Websites, Experience, About, Contact
    lab/               the room: engine (LabHero, camera, timelines), art/, panels/, terminal/, rack inspector
    sky/               background: page grid, glyph rain canvas, packets, pointer/scroll parallax
    ui/                shared primitives (BlurFade, SectionHeading, MagicCard, Led, BrandGlyphs)
  lib/                 view store, session storage, isometric math, seeded RNG, rack layout and drawings
  styles/              one stylesheet per area, imported by app/globals.css
public/                images, the resume PDF, the music loop (mostly generated, see below)
scripts/
  assets/              asset generators (room still, panels, previews, portrait)
  lib/render.mjs       headless Chrome rendering helpers
docs/
  BUILD-NOTES.md       architecture, contracts, file map, verification
  PERSONALIZATION-TODO.md   drafts and placeholders the owner still has to confirm
  OWNER-NOTES.md       owner-supplied facts and decisions
  reverse-engineering/ specs 01 to 09 of the original design
  theme/               theme specs: B (Mint Terminal, live), A and C (reference only)
```

## Theme

The live theme is B, Mint Terminal (`docs/theme/b.md`): a near-black base with a faint 1 px grid, a canvas of mint glyph rain in the gutters, drifting packets, and a rain divider that settles into static glyph rows above the footer. The room view uses the same rain at full width, dimmed around the room.

Colour tokens live in `src/styles/base.css`: the `:root` variables (`--background`, `--mint`, `--mint-hi`, `--mint-head`, the `--gray-*` steps, `--line`, `--card`, key colours, `--warn`, `--alert` and the rest) and the `@theme inline` block that exposes them to Tailwind as `bg-background`, `text-mint`, `border-line-strong` and so on. The four section accents (`--signal`, `--dusk`, `--beacon`, `--sodium`) and `--putty` all resolve to mint; the tokens stay so a later variant can split them again. Keycaps are in `src/styles/keys.css`; the rain parameters are in `src/components/sky/rain.ts`.

The colour rule: mint styles the page frame and UI, and things that carry meaning through colour keep it.

* Mint: the background (grid and gutter rain), header, menus, keycaps, cards, chips, section headings and accents, the Experience tickets, the footer, the terminal and intro, the room HUD, hotspot outlines, markers, tooltips, panel and inspector chrome (frames, close and action keys, scrims), and the OG and Twitter cards.
* Full colour: the room scene (walls, wood floor, rug, desk, the amber CRT, lamp light, cables and packets, plant, record, certificates, map board, and the window's night view), the rack hardware and its multicolour status LEDs (room, homelab diagram and inspector), the wall poster and art print, devicon tech icons, and project preview images. Panels that lift off a room object keep that object's colours (the CRT panel stays amber phosphor); only their chrome is mint.
* Semantic colours stay: `--alert` red for errors, `--warn` amber for warnings.

The parts of `docs/theme/b.md` that would recolour the room (sections 3.8, 3.10 and the image regeneration in 3.12 and 8) are not applied; `docs/OWNER-NOTES.md` records the decision.

## Editing content

All content lives in `src/content/` and is imported through `@/content`. Shapes, counts and suggested lengths are documented in `src/content/types.ts`.

| File | What it holds |
|---|---|
| `site.ts` | name, metadata, email, LinkedIn handle, site URL, section toggles, footer |
| `hero.ts` | landing prompt, name lines, role line, description, buttons |
| `projects.ts` | project cards (also used by the terminal and the room CRT) |
| `homelab.ts` | rack hardware, services, hardening chips, stories, the power-up boot log |
| `experience.ts` | jobs and leadership, plus the room badge styling |
| `about.ts` | bio, skills, education, coursework, credentials (also drawn on the room wall) |
| `contact.ts` | contact links and their order in the grid and footer |
| `intro.ts` | terminal text: the package the intro installs (`PORTFOLIO_PACKAGE`), the `pf-whoami` summary (built from the other content files), the login banner, help list, `about`, `neofetch`, `nmap` |
| `room.ts` | room-only text: poster, art print, CRT, record, network map |
| `websites.ts` | client websites (the section is switched off) |

Section toggles: `SECTION_DEFS` in `src/content/site.ts` lists every section in page order. Set `enabled: false` to remove a section from the page, the header nav, the footer, the terminal and the room; heading numbers follow the enabled order. `footer: false` keeps a section out of the footer's Navigation column.

Hiding things: a contact link with `href: ""` disappears everywhere, a project with `link: ""` shows no link icon, and the homelab stories block only renders when `HOMELAB.stories` has entries.

Rack layout: the order and height of every device in the rack is the `RACK_SLOTS` table in `src/lib/rack.tsx`. The homelab diagram, the room art, the hotspots and the rack inspector all follow it.

Everything that still needs the owner's input is listed in `docs/PERSONALIZATION-TODO.md`.

## Regenerating assets

Generated images are committed under `public/`. Rerun a generator after changing what it draws. Start the dev server first (`npm run dev`); several scripts render `/dev/*` routes from it. `BASE_URL` (or the first argument for `room-still.mjs`) points them at another dev server.

| Command | Output | Rerun when |
|---|---|---|
| `node scripts/assets/room-still.mjs` | `public/room/room-still.webp`, the 1700 x 1460 landing still of the room | the room art, the rack layout, the wall art or the certificates change. It prints the opaque bounds, which must read x 10..1689, y 10..1449. |
| `node scripts/assets/panels.mjs [job ...]` | `public/lab/*` and `public/certs/*`: jobs `poster`, `print`, `cover`, `resume`, `certs`, `audio` (no argument runs all) | `certs` after credential changes; `resume` after replacing the resume. The art print is kept unless `FORCE_PRINT=1`. |
| `RESUME_SRC=path/to/resume.pdf node scripts/assets/panels.mjs resume` | copies the PDF to `public/resume.pdf` and renders page 1 to `public/lab/resume.webp` | a new resume. Phone numbers are cut out of the image only; the PDF is served as is. |
| `node scripts/assets/work.mjs [slug]` | `public/previews/*.png` project previews, `public/sites/*.webp` | project preview art changes |
| `node scripts/assets/about.mjs` | `public/about/portrait.webp` placeholder portrait | only while the portrait is still a placeholder |
| `node scripts/assets/favicon.mjs` | `src/app/favicon.ico`, the "KG" monogram keycap at 16, 32 and 48 px | the monogram or the keycap colours change |

During development, Next's image optimizer caches resized copies of images such as the room still for up to 4 hours. If the landing keeps showing an old still, restart `npm run dev` or delete `.next/dev/cache/images`. Production builds are not affected.

## Dev preview routes

`/dev` lists preview routes for each area: chrome (header, menus, grid and rain background, rain divider, footer), hero, room art and still, room engine, terminal, panels, homelab and rack inspector, work, and about. The theme previews were removed once theme B went live. Some are also render targets for the asset scripts. They exist only in development: `src/app/dev/layout.tsx` returns a 404 for every `/dev/*` route in production builds.

## Deploying to Vercel

1. Push the repository to GitHub (or another Git provider).
2. In Vercel, import the repository. The framework preset is detected as Next.js; the default build command (`next build`) and output settings work as is. No environment variables are needed.
3. After the first deploy, set the real origin in `SITE.url` and `SITE.domain` (`src/content/site.ts`) so canonical and share-card URLs are correct, then redeploy. Add a custom domain in the Vercel project settings if you have one.

Before going public, work through the "Before publishing" items in `docs/PERSONALIZATION-TODO.md` (the resume PDF, the site origin and the GitHub link).

## Further reading

* `docs/BUILD-NOTES.md`: architecture, contracts between areas, file map, verification steps
* `docs/PERSONALIZATION-TODO.md`: every draft and placeholder, grouped by section, with the file to edit
* `docs/reverse-engineering/`: layout, timing and behavior specs of the original design
* `docs/theme/b.md`: the live Mint Terminal spec (palette, tokens, rain parameters), with a status note listing what the colour rule left out
* `docs/theme/a.md`, `docs/theme/c.md`: the unchosen directions (Phosphor Rain, Depth Rain), kept for reference
