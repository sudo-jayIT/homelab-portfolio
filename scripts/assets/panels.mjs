// Generates the room panel assets (spec 05 section 9).
//
//   node scripts/assets/panels.mjs                 (everything)
//   node scripts/assets/panels.mjs poster cover    (only the named jobs)
//
// Jobs: poster, print, cover, resume, certs, audio. The credential cards are
// rendered from /dev/panels/cert/<id> on the running dev server (real fonts,
// content pulled from src/content), so `next dev` must be up for `certs`:
// BASE_URL overrides http://localhost:3000. The other jobs fall back to the
// default paths below when the dev server is not reachable.
//
// Output:
//   public/lab/poster.webp    1024x1024 retro-futurist lighthouse screenprint (original art)
//   public/lab/print.webp     1360x920 in-scene framed art print. The current file is kept;
//                             FORCE_PRINT=1 replaces it with an original lamplit illustration
//   public/lab/cover.webp     400x400 cover art for the music card
//   public/lab/resume.webp    page 1 of public/resume.pdf rendered at 1224 px wide (17:22),
//                             with pdfjs-dist on @napi-rs/canvas; any phone number is cut out
//                             of the image and its line re-centred. RESUME_SRC=<path to a PDF>
//                             first copies that file to public/resume.pdf
//   public/certs/<id>.webp    1200x927 original stylized credential card for every credential
//                             (not an imitation of any official certificate; no logos)
//   public/lab/nocturne.mp3   26.7 s music-card loop synthesized in Node (needs ffmpeg to
//                             encode; set FFMPEG=path when it is not on PATH)
//
// Everything drawn here is original.

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { closeBrowser, renderSvg, renderUrl } from "../lib/render.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const PUBLIC = path.join(ROOT, "public");
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const out = (p) => path.join(PUBLIC, p.replace(/^\//, ""));

/* ------------------------------------------------------------------------ */
/* Helpers                                                                   */
/* ------------------------------------------------------------------------ */

/** Seeded PRNG so reruns are identical. */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r2 = (n) => Math.round(n * 100) / 100;

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Paths used when the dev server (and so the manifest) is not reachable. */
const DEFAULTS = {
  certs: null,
  resume: { image: "/lab/resume.webp", pdf: "/resume.pdf" },
  poster: "/lab/poster.webp",
  print: { out: "/lab/print.webp" },
  cover: "/lab/cover.webp",
  audio: "/lab/nocturne.mp3",
  music: { artist: "Lowtide", title: "Nocturne for Servers" },
};

async function manifest() {
  try {
    const res = await fetch(`${BASE}/dev/panels/manifest`);
    if (res.ok) return await res.json();
    console.warn(`manifest: ${res.status} from ${BASE}/dev/panels/manifest; using default paths`);
  } catch (err) {
    console.warn(`manifest: ${BASE} not reachable (${err.message}); using default paths`);
  }
  return DEFAULTS;
}

/** A North American style phone number: (804) 555-0100, 804-555-0100, 804.555.0100. */
const PHONE = /\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4}/;
/** Text runs that only separate contact items ("|", "•", "·", spaces). */
const SEPARATOR = /^[\s|•·,]*$/;

/**
 * Remove every phone number from a rendered page, so the room's resume image
 * never shows it. Each text line holding a number is redrawn without the
 * number and one adjacent separator, then re-centred on its old centre (the
 * resume header line is centred). Returns how many numbers were removed.
 */
async function redactPhones(page, viewport, ctx, pdfjs) {
  const { items } = await page.getTextContent();
  const runs = items
    .filter((it) => typeof it.str === "string" && it.str.length > 0)
    .map((it) => {
      const tx = pdfjs.Util.transform(viewport.transform, it.transform);
      const size = Math.hypot(tx[2], tx[3]);
      return { str: it.str, x: tx[4], y: tx[5], end: tx[4] + it.width * viewport.scale, size };
    });
  let removed = 0;
  for (const phone of runs.filter((r) => PHONE.test(r.str))) {
    const line = runs.filter((r) => Math.abs(r.y - phone.y) < 1).sort((a, b) => a.x - b.x);
    const content = line.filter((r) => r === phone || !SEPARATOR.test(r.str));
    const at = content.indexOf(phone);
    const before = content[at - 1];
    const after = content[at + 1];
    const L = Math.min(...line.map((r) => r.x));
    const R = Math.max(...line.map((r) => r.end));
    // Cut the number plus the separator on one side of it.
    const A = after || !before ? phone.x : before.end;
    const B = after ? after.x : phone.end;
    const size = Math.max(...line.map((r) => r.size));
    const top = Math.floor(phone.y - size * 1.0);
    const h = Math.ceil(size * 1.35);
    const left = A - L > 0.5 ? ctx.getImageData(Math.floor(L), top, Math.ceil(A - L), h) : null;
    const right = R - B > 0.5 ? ctx.getImageData(Math.floor(B), top, Math.ceil(R - B) + 2, h) : null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.floor(L) - 1, top, Math.ceil(R - L) + 4, h);
    const start = L + (B - A) / 2;
    if (left) ctx.putImageData(left, Math.round(start), top);
    if (right) ctx.putImageData(right, Math.round(start + (A - L)), top);
    removed += 1;
  }
  return removed;
}

/**
 * Render page 1 of a PDF to a PNG buffer `width` px wide, on white, with
 * pdfjs-dist (legacy Node build) drawing into an @napi-rs/canvas canvas.
 * Phone numbers are removed from the image (redactPhones).
 */
async function pdfPagePng(file, width) {
  const require = createRequire(path.join(ROOT, "package.json"));
  const pdfjs = await import(pathToFileURL(require.resolve("pdfjs-dist/legacy/build/pdf.mjs")).href);
  const { createCanvas } = require("@napi-rs/canvas");
  const fontDir = path.join(path.dirname(require.resolve("pdfjs-dist/package.json")), "standard_fonts");
  const data = new Uint8Array(await fs.readFile(file));
  const task = pdfjs.getDocument({ data, verbosity: 0, standardFontDataUrl: `${pathToFileURL(fontDir).href}/` });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const redacted = await redactPhones(page, viewport, ctx, pdfjs);
    return { png: await canvas.encode("png"), pages: doc.numPages, redacted };
  } finally {
    await task.destroy();
  }
}

/** Paper grain and halftone shared by the poster and the cover. */
const GRAIN_DEFS = `
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0 0.04  0 0 0 0.22 0"/>
  </filter>
  <pattern id="halftone" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
    <circle cx="2" cy="2" r="1.05" fill="#000" fill-opacity="0.2"/>
  </pattern>`;

/* ------------------------------------------------------------------------ */
/* Poster: lighthouse under a ringed planet, screenprint style                */
/* ------------------------------------------------------------------------ */

function posterSvg() {
  const W = 1024;
  const HORIZON = 700;
  const rand = mulberry32(4107);

  // Posterised sky: flat ink bands, darkest at the top.
  const skyInks = ["#0f1830", "#131e3a", "#182444", "#1e2b4f", "#273259", "#353763", "#4c3a68", "#6c4068", "#944a64", "#bd585d", "#e07a5a"];
  const bandH = HORIZON / skyInks.length;
  const sky = skyInks
    .map((c, i) => `<rect x="0" y="${r2(i * bandH)}" width="${W}" height="${r2(bandH + 1)}" fill="${c}"/>`)
    .join("");

  // Stars in the upper sky, kept off the planet.
  let stars = "";
  for (let i = 0; i < 90; i++) {
    const x = rand() * W;
    const y = rand() * 430;
    if (Math.hypot(x - 790, y - 250) < 150) continue;
    const r = 0.8 + rand() * 1.6;
    stars += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(r)}" fill="#f6ead0" fill-opacity="${r2(0.45 + rand() * 0.5)}"/>`;
  }
  const sparkle = (x, y, s) =>
    `<path d="M${x} ${y - s} L${x + s * 0.22} ${y - s * 0.22} L${x + s} ${y} L${x + s * 0.22} ${y + s * 0.22} L${x} ${y + s} L${x - s * 0.22} ${y + s * 0.22} L${x - s} ${y} L${x - s * 0.22} ${y - s * 0.22} Z" fill="#f6ead0"/>`;
  stars += sparkle(118, 120, 13) + sparkle(470, 70, 9) + sparkle(930, 520, 10) + sparkle(560, 300, 7);

  // Sun cut by widening sky stripes as it sinks.
  const sunStripes = [612, 632, 650, 667, 683]
    .map((y, i) => `<rect x="0" y="${y}" width="${W}" height="${4 + i * 2.6}" fill="#000"/>`)
    .join("");

  // Sea bands, wave dashes and the broken sun reflection.
  const seaInks = ["#20304f", "#1a2843", "#152138", "#111b2f", "#0e1628"];
  const seaH = (W - HORIZON) / seaInks.length;
  const sea = seaInks
    .map((c, i) => `<rect x="0" y="${r2(HORIZON + i * seaH)}" width="${W}" height="${r2(seaH + 1)}" fill="${c}"/>`)
    .join("");
  let waves = "";
  for (let row = 0; row < 16; row++) {
    const y = HORIZON + 14 + row * row * 1.2 + row * 6;
    if (y > W) break;
    for (let k = 0; k < 9; k++) {
      const x = (rand() * W * 1.1) | 0;
      const w = 20 + rand() * (40 + row * 6);
      waves += `<rect x="${x}" y="${r2(y)}" width="${r2(w)}" height="${r2(1.4 + row * 0.18)}" fill="#3d5b82" fill-opacity="${r2(0.35 + rand() * 0.3)}"/>`;
    }
  }
  let glint = "";
  for (let row = 0; row < 12; row++) {
    const y = HORIZON + 8 + row * 15;
    const w = 210 - row * 15 + rand() * 30;
    const x = 600 - w / 2 + (rand() - 0.5) * 30;
    glint += `<rect x="${r2(x)}" y="${y}" width="${r2(w)}" height="${r2(3 + row * 0.35)}" fill="#f0a35e" fill-opacity="${r2(0.75 - row * 0.05)}"/>`;
  }

  // Lighthouse on the cliff, with a beam sweeping right under the planet.
  const tower = "M193 562 L205 392 L255 392 L267 562 Z";
  const stripes = [0, 1, 2, 3, 4, 5]
    .map((i) => `<rect x="180" y="${392 + i * 28.4}" width="100" height="28.4" fill="${i % 2 ? "#efe3c8" : "#c9483b"}"/>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}">
  <defs>
    ${GRAIN_DEFS}
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff1c8" stop-opacity="0.62"/>
      <stop offset="1" stop-color="#fff1c8" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="beamL" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#fff1c8" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#fff1c8" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7d57e"/>
      <stop offset="1" stop-color="#ee8a55"/>
    </linearGradient>
    <linearGradient id="planet" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f1d38a"/>
      <stop offset="1" stop-color="#c77a45"/>
    </linearGradient>
    <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffe6a3" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#ffe6a3" stop-opacity="0"/>
    </radialGradient>
    <mask id="sunCut"><rect width="${W}" height="${W}" fill="#fff"/>${sunStripes}</mask>
    <clipPath id="planetClip"><circle cx="790" cy="250" r="118"/></clipPath>
    <clipPath id="towerClip"><path d="${tower}"/></clipPath>
    <clipPath id="aboveSea"><rect width="${W}" height="${HORIZON}"/></clipPath>
  </defs>

  ${sky}
  ${stars}

  <g clip-path="url(#aboveSea)">
    <circle cx="600" cy="${HORIZON}" r="232" fill="url(#sun)" mask="url(#sunCut)"/>
  </g>

  <g transform="translate(790 250) rotate(-16)">
    <ellipse rx="214" ry="44" fill="none" stroke="#f2e3c6" stroke-width="9" stroke-opacity="0.85"/>
    <ellipse rx="190" ry="36" fill="none" stroke="#f2e3c6" stroke-width="3" stroke-opacity="0.55"/>
  </g>
  <circle cx="790" cy="250" r="118" fill="url(#planet)"/>
  <g clip-path="url(#planetClip)" fill="#8f4d34">
    <rect x="660" y="196" width="260" height="14" fill-opacity="0.35"/>
    <rect x="660" y="226" width="260" height="7" fill-opacity="0.28"/>
    <rect x="660" y="262" width="260" height="20" fill-opacity="0.3"/>
    <rect x="660" y="304" width="260" height="9" fill-opacity="0.25"/>
    <circle cx="742" cy="214" r="118" fill="#fff4d6" fill-opacity="0.18"/>
  </g>
  <g transform="translate(790 250) rotate(-16)">
    <path d="M -214 0 A 214 44 0 0 0 214 0" fill="none" stroke="#f2e3c6" stroke-width="9" stroke-opacity="0.9"/>
    <path d="M -190 0 A 190 36 0 0 0 190 0" fill="none" stroke="#f2e3c6" stroke-width="3" stroke-opacity="0.6"/>
  </g>

  <polygon points="230,360 ${W},250 ${W},400" fill="url(#beam)"/>
  <polygon points="230,362 0,318 0,368" fill="url(#beamL)"/>

  ${sea}
  ${waves}
  ${glint}

  <path d="M0 548 L70 534 L150 542 L214 556 L300 562 L346 596 L388 654 L430 716 L482 806 L528 ${W} L0 ${W} Z" fill="#0b1322"/>
  <path d="M0 548 L70 534 L150 542 L214 556 L300 562 L346 596 L388 654 L430 716 L482 806 L528 ${W}" fill="none" stroke="#2a3a58" stroke-width="3"/>
  <path d="M40 600 L120 590 M60 660 L190 640 M30 740 L150 720 M120 820 L260 790 M200 700 L330 680" stroke="#18233a" stroke-width="5" stroke-linecap="round"/>

  <rect x="276" y="516" width="58" height="46" fill="#1b2438"/>
  <path d="M270 518 L305 494 L340 518 Z" fill="#c9483b"/>
  <rect x="286" y="530" width="10" height="12" fill="#ffd98a"/>
  <rect x="312" y="530" width="10" height="12" fill="#ffd98a" fill-opacity="0.7"/>

  <circle cx="230" cy="360" r="120" fill="url(#lamp)"/>
  <g clip-path="url(#towerClip)">${stripes}</g>
  <path d="${tower}" fill="none" stroke="#0b1322" stroke-width="2"/>
  <rect x="226" y="470" width="8" height="14" fill="#ffd98a"/>
  <rect x="195" y="382" width="70" height="10" fill="#1b2236"/>
  <path d="M199 382 V372 M211 382 V372 M223 382 V372 M237 382 V372 M249 382 V372 M261 382 V372 M197 372 H263" stroke="#1b2236" stroke-width="2"/>
  <rect x="210" y="338" width="40" height="34" fill="#ffe7a8"/>
  <path d="M220 338 V372 M230 338 V372 M240 338 V372" stroke="#c99a52" stroke-width="2"/>
  <path d="M205 340 Q230 304 255 340 Z" fill="#c9483b"/>
  <path d="M230 318 V284" stroke="#efe3c8" stroke-width="2.5"/>
  <circle cx="230" cy="281" r="4" fill="#efe3c8"/>
  <ellipse cx="230" cy="355" rx="44" ry="9" fill="none" stroke="#efe3c8" stroke-width="2" stroke-opacity="0.8"/>

  <g font-family="Arial, Helvetica, sans-serif" fill="#f2e3c6">
    <text x="512" y="958" text-anchor="middle" font-size="44" font-weight="700" letter-spacing="18">NIGHT WATCH</text>
    <text x="512" y="992" text-anchor="middle" font-size="15" letter-spacing="9" fill-opacity="0.8">LIGHT STATION 07 · EST. 2087</text>
  </g>

  <rect width="${W}" height="${W}" fill="url(#halftone)" opacity="0.5"/>
  <rect width="${W}" height="${W}" filter="url(#grain)"/>
</svg>`;
}

/* ------------------------------------------------------------------------ */
/* Music card cover                                                          */
/* ------------------------------------------------------------------------ */

function coverSvg(m) {
  const S = 400;
  const rand = mulberry32(2219);
  let stars = "";
  for (let i = 0; i < 40; i++) {
    const x = rand() * S;
    const y = rand() * 200;
    stars += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(0.6 + rand())}" fill="#f2e8d0" fill-opacity="${r2(0.35 + rand() * 0.5)}"/>`;
  }
  const inks = ["#2bb3a6", "#25979a", "#1f7d8a", "#1b6579", "#174f66", "#133c52", "#102d40"];
  let waves = "";
  inks.forEach((c, i) => {
    const y = 236 + i * 21;
    const amp = 6 + i * 1.2;
    let d = `M 0 ${y}`;
    for (let x = 0; x <= S; x += 25) d += ` Q ${x + 12.5} ${r2((x / 25) % 2 === 0 ? y - amp : y + amp)} ${x + 25} ${y}`;
    waves += `<path d="${d} L ${S} ${S} L 0 ${S} Z" fill="${c}"/>`;
  });
  let leds = "";
  for (let i = 0; i < 12; i++) {
    const on = i % 3 !== 1;
    leds += `<rect x="${44 + i * 26}" y="356" width="16" height="5" rx="1" fill="#0b1322"/><circle cx="${48 + i * 26}" cy="358.5" r="1.6" fill="${on ? (i % 4 === 0 ? "#fbbf24" : "#4ade80") : "#334155"}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>${GRAIN_DEFS}
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0e1630"/>
      <stop offset="1" stop-color="#23306a"/>
    </linearGradient>
    <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#f6e7c1" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#f6e7c1" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="#0e1630"/>
  <rect width="${S}" height="250" fill="url(#dusk)"/>
  ${stars}
  <circle cx="246" cy="176" r="120" fill="url(#moonGlow)"/>
  <circle cx="246" cy="176" r="74" fill="#ecdfc0"/>
  <circle cx="222" cy="160" r="12" fill="#d8c9a4"/>
  <circle cx="268" cy="196" r="8" fill="#d8c9a4"/>
  <circle cx="262" cy="148" r="5" fill="#d8c9a4"/>
  ${waves}
  ${leds}
  <text x="28" y="50" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" letter-spacing="9" fill="#f2e8d0">${m.artist.toUpperCase()}</text>
  <text x="28" y="74" font-family="Georgia, serif" font-style="italic" font-size="16" fill="#f2e8d0" fill-opacity="0.75">${m.title.toLowerCase()}</text>
  <rect width="${S}" height="${S}" fill="url(#halftone)" opacity="0.35"/>
  <rect width="${S}" height="${S}" filter="url(#grain)"/>
</svg>`;
}

/* ------------------------------------------------------------------------ */
/* Print: lamplit reading room with a dusk window (FORCE_PRINT=1)            */
/* ------------------------------------------------------------------------ */

function printSvg() {
  const W = 1360;
  const H = 920;
  const rand = mulberry32(911);
  let books = "";
  const spines = ["#7a2f22", "#2d4b6e", "#c9a14a", "#3c5d3a", "#8b5a2b", "#6b3a6b", "#a8432c", "#d6cfbf", "#2c6f73", "#b8862f"];
  for (let shelf = 0; shelf < 4; shelf++) {
    let x = 92;
    const base = 300 + shelf * 140;
    while (x < 400) {
      const w = 14 + rand() * 14;
      const h = 70 + rand() * 40;
      books += `<rect x="${r2(x)}" y="${r2(base - h)}" width="${r2(w)}" height="${r2(h)}" fill="${spines[(rand() * spines.length) | 0]}"/>`;
      x += w + 2;
    }
    books += `<rect x="80" y="${base}" width="340" height="12" fill="#3a2414"/>`;
  }
  let lights = "";
  for (let i = 0; i < 40; i++) {
    lights += `<rect x="${r2(700 + rand() * 360)}" y="${r2(470 + rand() * 120)}" width="4" height="5" fill="#ffd38a" fill-opacity="${r2(0.4 + rand() * 0.6)}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient id="warm" cx="0.62" cy="0.38" r="0.7">
      <stop offset="0" stop-color="#8a4d22"/><stop offset="0.55" stop-color="#4a2814"/><stop offset="1" stop-color="#1c0f08"/>
    </radialGradient>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b2a55"/><stop offset="0.7" stop-color="#4f5b9a"/><stop offset="1" stop-color="#d58a68"/>
    </linearGradient>
    <radialGradient id="cone" cx="0.5" cy="0" r="1">
      <stop offset="0" stop-color="#ffd590" stop-opacity="0.75"/><stop offset="1" stop-color="#ffd590" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#warm)"/>
  <rect x="640" y="140" width="480" height="520" rx="240" ry="240" fill="#2a170c"/>
  <rect x="664" y="164" width="432" height="496" rx="216" ry="216" fill="url(#dusk)"/>
  <path d="M664 600 L720 560 L760 590 L820 520 L880 575 L940 540 L1000 580 L1060 548 L1096 570 L1096 660 L664 660 Z" fill="#141a33"/>
  ${lights}
  <path d="M880 164 V660 M664 420 H1096" stroke="#2a170c" stroke-width="14"/>
  <rect x="600" y="660" width="560" height="26" fill="#3a2414"/>
  ${books}
  <path d="M1220 120 V250" stroke="#1a0e07" stroke-width="4"/>
  <path d="M1180 250 L1260 250 L1240 210 L1200 210 Z" fill="#c98a3c"/>
  <path d="M1180 250 L1260 250 L1440 920 L1000 920 Z" fill="url(#cone)" opacity="0.55"/>
  <path d="M440 920 L470 700 Q560 640 650 700 L680 920 Z" fill="#5a2b18"/>
  <path d="M430 760 Q560 700 690 760 L690 820 L430 820 Z" fill="#6e3720"/>
  <rect y="860" width="${W}" height="60" fill="#140a05"/>
</svg>`;
}

/* ------------------------------------------------------------------------ */
/* Music loop: an original lo-fi sketch synthesized from scratch             */
/* ------------------------------------------------------------------------ */

/**
 * 8 bars at 72 bpm (26.7 s), mono 44.1 kHz: soft pad chords, a sine bass, a
 * plucked arpeggio, a quiet kick / snare / hat pattern and vinyl crackle.
 * Every event that runs past the end wraps to the start, so the loop is
 * seamless. Returns Float32 samples in [-1, 1].
 */
function synthLoop() {
  const SR = 44100;
  const BPM = 72;
  const beat = 60 / BPM;
  const bars = 8;
  const N = Math.round(bars * 4 * beat * SR);
  const buf = new Float32Array(N);
  const rand = mulberry32(3301);
  const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
  const add = (i, v) => {
    buf[((i % N) + N) % N] += v;
  };

  // Two bars per chord: Fmaj7, Em7, Dm7, Cmaj7 (voiced around middle C).
  const chords = [
    [53, 57, 60, 64],
    [52, 55, 59, 62],
    [50, 53, 57, 60],
    [48, 52, 55, 59],
  ];
  const chordLen = 8 * beat;

  // Pad: detuned sine pairs with a slow swell, overlapping into the next chord.
  chords.forEach((notes, c) => {
    const t0 = c * chordLen;
    const len = chordLen + 1.2;
    const n = Math.round(len * SR);
    for (const note of notes) {
      const f = hz(note);
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const env = Math.min(1, t / 1.1) * Math.min(1, (len - t) / 1.2);
        const v = Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 1.003 * t + 1.3) * 0.7 + Math.sin(2 * Math.PI * f * 2 * t) * 0.12;
        add(Math.round(t0 * SR) + i, v * env * 0.028);
      }
    }
    // Bass: root two octaves down, one note per bar.
    for (let b = 0; b < 2; b++) {
      const f = hz(notes[0] - 24);
      const s = Math.round((t0 + b * 4 * beat) * SR);
      const n2 = Math.round(3.6 * beat * SR);
      for (let i = 0; i < n2; i++) {
        const t = i / SR;
        const env = Math.min(1, t / 0.03) * Math.exp(-t * 0.9);
        add(s + i, Math.sin(2 * Math.PI * f * t) * env * 0.16);
      }
    }
    // Plucked arpeggio on eighth notes with a little swing.
    const pattern = [0, 2, 1, 3, 2, 1, 3, 2, 0, 2, 3, 1, 2, 3, 1, 2];
    pattern.forEach((k, step) => {
      if (rand() < 0.18) return;
      const swing = step % 2 ? 0.06 * beat : 0;
      const s = Math.round((t0 + step * 0.5 * beat + swing) * SR);
      const f = hz(notes[k] + 12);
      const n3 = Math.round(1.4 * SR);
      const vel = 0.05 + rand() * 0.025;
      for (let i = 0; i < n3; i++) {
        const t = i / SR;
        const env = Math.min(1, t / 0.004) * Math.exp(-t * 3.2);
        const v = Math.sin(2 * Math.PI * f * t + Math.sin(2 * Math.PI * f * 2 * t) * 0.6 * Math.exp(-t * 6));
        add(s + i, v * env * vel);
      }
    });
  });

  // Drums: kick on 1 and 3 (plus a ghost on the and of 2 every other bar), snare on 2 and 4, hats on eighths.
  let noiseLp = 0;
  for (let bar = 0; bar < bars; bar++) {
    const b0 = bar * 4 * beat;
    const kicks = [0, 2, ...(bar % 2 ? [1.5] : [])];
    for (const k of kicks) {
      const s = Math.round((b0 + k * beat) * SR);
      let ph = 0;
      for (let i = 0; i < 0.35 * SR; i++) {
        const t = i / SR;
        ph += (2 * Math.PI * (45 + 75 * Math.exp(-t * 28))) / SR;
        add(s + i, Math.sin(ph) * Math.exp(-t * 9) * (k === 1.5 ? 0.12 : 0.26));
      }
    }
    for (const k of [1, 3]) {
      const s = Math.round((b0 + k * beat) * SR);
      for (let i = 0; i < 0.22 * SR; i++) {
        const t = i / SR;
        noiseLp += 0.35 * (rand() * 2 - 1 - noiseLp);
        add(s + i, (noiseLp * 0.9 + Math.sin(2 * Math.PI * 190 * t) * 0.3) * Math.exp(-t * 18) * 0.11);
      }
    }
    for (let e = 0; e < 8; e++) {
      const s = Math.round((b0 + e * 0.5 * beat + (e % 2 ? 0.06 * beat : 0)) * SR);
      let prev = 0;
      for (let i = 0; i < 0.05 * SR; i++) {
        const t = i / SR;
        const w = rand() * 2 - 1;
        add(s + i, (w - prev) * Math.exp(-t * 90) * (e % 2 ? 0.018 : 0.028));
        prev = w;
      }
    }
  }

  // Vinyl: a low hiss floor and sparse clicks.
  let hiss = 0;
  for (let i = 0; i < N; i++) {
    hiss += 0.08 * (rand() * 2 - 1 - hiss);
    buf[i] += hiss * 0.012;
    if (rand() < 0.00012) buf[i] += (rand() - 0.5) * 0.25;
  }

  // Normalise to about -3 dBFS peak with a soft clip.
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(buf[i]));
  const g = 0.7 / (peak || 1);
  for (let i = 0; i < N; i++) buf[i] = Math.tanh(buf[i] * g * 1.1) / Math.tanh(1.1);
  return { samples: buf, rate: SR };
}

/** 16-bit PCM mono WAV. */
function wav({ samples, rate }) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

/* ------------------------------------------------------------------------ */
/* Jobs                                                                      */
/* ------------------------------------------------------------------------ */

const JOBS = {
  async poster(m) {
    await renderSvg(posterSvg(), out(m.poster), { width: 1024, height: 1024, format: "webp", transparent: false, quality: 88 });
    return [m.poster];
  },

  /** Keeps the current art print; FORCE_PRINT=1 (or a missing file) renders the illustration. */
  async print(m) {
    const target = out(m.print.out);
    if ((await exists(target)) && !process.env.FORCE_PRINT) return [`${m.print.out} (kept; FORCE_PRINT=1 to replace)`];
    await fs.mkdir(path.dirname(target), { recursive: true });
    await renderSvg(printSvg(), target, { width: 1360, height: 920, format: "webp", transparent: false });
    return [`${m.print.out} (illustration)`];
  },

  async cover(m) {
    if (!m.cover) return [];
    await renderSvg(coverSvg(m.music), out(m.cover), { width: 400, height: 400, format: "webp", transparent: false, quality: 88 });
    return [m.cover];
  },

  /** The owner's own PDF is the source of truth; the room panel shows its first page. */
  async resume(m) {
    const pdf = out(m.resume.pdf);
    const done = [];
    if (process.env.RESUME_SRC) {
      await fs.copyFile(path.resolve(process.env.RESUME_SRC), pdf);
      done.push(`${m.resume.pdf} (copied from RESUME_SRC)`);
    }
    if (!(await exists(pdf))) throw new Error(`resume: ${pdf} not found (set RESUME_SRC to copy one in)`);
    const { png, pages, redacted } = await pdfPagePng(pdf, 1224);
    const target = out(m.resume.image);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await sharp(png).resize(1224, 1584, { fit: "contain", background: "#ffffff" }).webp({ quality: 90 }).toFile(target);
    done.push(`${m.resume.image} (page 1 of ${pages}, ${redacted} phone number(s) removed from the image)`);
    if (redacted) console.warn(`resume: ${m.resume.pdf} itself still contains a phone number; export a copy without it if the PDF should not show it`);
    return done;
  },

  async certs(m) {
    if (!m.certs) throw new Error(`certs: needs the dev server (${BASE}/dev/panels/cert/<id>)`);
    const done = [];
    const tmp = path.join(os.tmpdir(), `panels-cert-${process.pid}.png`);
    for (const c of m.certs) {
      const url = `${BASE}/dev/panels/cert/${c.id}`;
      // The card is 1056x816 CSS px; render a little over 1200 px wide, then
      // resize to exactly 1200x927.
      await renderUrl(url, tmp, { width: 1056, height: 816, selector: "[data-cert]", deviceScaleFactor: 1.25, format: "png" });
      await fs.mkdir(path.dirname(out(c.image)), { recursive: true });
      await sharp(tmp).resize(1200, 927, { fit: "fill" }).webp({ quality: 88 }).toFile(out(c.image));
      done.push(c.image);
    }
    await fs.rm(tmp, { force: true });
    return done;
  },

  /** Needs ffmpeg on PATH (or FFMPEG=...) to encode the mp3; skipped otherwise. */
  async audio(m) {
    if (!m.audio) return [];
    const tmp = path.join(os.tmpdir(), `panels-loop-${process.pid}.wav`);
    await fs.writeFile(tmp, wav(synthLoop()));
    const target = out(m.audio);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const bin = process.env.FFMPEG || "ffmpeg";
    const res = spawnSync(bin, ["-y", "-loglevel", "error", "-i", tmp, "-ac", "1", "-c:a", "libmp3lame", "-b:a", "96k", target], {
      stdio: "inherit",
    });
    await fs.rm(tmp, { force: true });
    if (res.error || res.status !== 0) {
      console.warn(`audio: ffmpeg not available (${res.error?.message ?? `exit ${res.status}`}); ${m.audio} not written`);
      return [];
    }
    return [m.audio];
  },
};

const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(JOBS);
const unknown = names.filter((n) => !JOBS[n]);
if (unknown.length) {
  console.error(`unknown job(s): ${unknown.join(", ")}; expected ${Object.keys(JOBS).join(", ")}`);
  process.exit(1);
}

try {
  const m = await manifest();
  for (const name of names) {
    const files = await JOBS[name](m);
    for (const f of files) console.log(`${name.padEnd(7)} ${f}`);
  }
} finally {
  await closeBrowser();
}
